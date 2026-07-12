import { describe, expect, it, vi } from "vitest";

import {
  authRateLimitKey,
  authRateLimitPolicies,
  clientAddress,
  enforceAuthAbuseControls,
  enforceAuthRequest,
  publicAbuseControlError,
  turnstileClientConfiguration,
  verifyTurnstile,
} from "./auth-abuse.server";

describe("auth abuse controls", () => {
  it("uses the Cloudflare client address without trusting later forwarded hops", () => {
    const request = new Request("https://openmarket.test/auth/register", {
      headers: {
        "CF-Connecting-IP": "203.0.113.7",
        "X-Forwarded-For": "198.51.100.2, 198.51.100.3",
      },
    });

    expect(clientAddress(request)).toBe("203.0.113.7");
    expect(authRateLimitKey(request, "register")).toBe("auth:register:203.0.113.7");
  });

  it("keeps strict budgets for account creation and recovery", () => {
    expect(authRateLimitPolicies.register).toEqual({
      limit: 5,
      periodSeconds: 3600,
      requiresTurnstile: true,
    });
    expect(authRateLimitPolicies["forgot-password"].requiresTurnstile).toBe(true);
    expect(authRateLimitPolicies.login.requiresTurnstile).toBe(false);
  });

  it("fails closed when Turnstile is not configured", async () => {
    await expect(
      verifyTurnstile({ secret: "replace-me", token: "response-token" }),
    ).resolves.toEqual({ ok: false, reason: "turnstile-unavailable" });
  });

  it("submits only server-side Turnstile fields and validates the action", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ success: true, action: "register" }),
    );

    await expect(
      verifyTurnstile({
        secret: "secret-value-long-enough",
        token: "browser-token",
        remoteIp: "203.0.113.7",
        expectedAction: "register",
        fetcher,
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toContain("secret=secret-value-long-enough");
    expect(String(init?.body)).toContain("response=browser-token");
    expect(String(init?.body)).toContain("remoteip=203.0.113.7");
  });

  it("rejects a token issued for another action", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ success: true, action: "forgot-password" }),
    );

    await expect(
      verifyTurnstile({
        secret: "secret-value-long-enough",
        token: "browser-token",
        expectedAction: "register",
        fetcher,
      }),
    ).resolves.toEqual({ ok: false, reason: "turnstile-invalid" });
  });

  it("does not call Turnstile when the rate limit is exhausted", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const request = new Request("https://openmarket.test/auth/register", {
      headers: { "CF-Connecting-IP": "203.0.113.7" },
    });

    await expect(
      enforceAuthAbuseControls({
        request,
        action: "register",
        rateLimiter: { limit: async () => ({ success: false }) },
        turnstileSecret: "secret-value-long-enough",
        turnstileToken: "browser-token",
        fetcher,
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "rate-limited",
      retryAfterSeconds: 3600,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("allows a non-Turnstile action after the binding accepts the key", async () => {
    const request = new Request("https://openmarket.test/auth/login", {
      headers: { "CF-Connecting-IP": "203.0.113.7" },
    });

    await expect(
      enforceAuthAbuseControls({
        request,
        action: "login",
        rateLimiter: { limit: async () => ({ success: true }) },
      }),
    ).resolves.toEqual({ ok: true });
  });

  it("bypasses external controls only in the explicit local environment", async () => {
    await expect(
      enforceAuthRequest({
        env: { APP_ENV: "local" },
        request: new Request("http://localhost:5173/auth/register"),
        formData: new FormData(),
        action: "register",
      }),
    ).resolves.toEqual({ ok: true });

    await expect(
      enforceAuthRequest({
        env: { APP_ENV: "preview" },
        request: new Request("https://preview.openmarket.test/auth/register"),
        formData: new FormData(),
        action: "register",
      }),
    ).resolves.toEqual({ ok: false, reason: "abuse-control-unavailable" });
  });

  it("returns only the public Turnstile site key to route loaders", () => {
    expect(
      turnstileClientConfiguration({
        APP_ENV: "preview",
        TURNSTILE_SITE_KEY: "site-key-value",
        TURNSTILE_SECRET_KEY: "secret-value-long-enough",
      }),
    ).toEqual({ bypass: false, siteKey: "site-key-value" });

    expect(turnstileClientConfiguration({ APP_ENV: "local" })).toEqual({
      bypass: true,
      siteKey: null,
    });
  });

  it("maps rate limiting to a stable public response with Retry-After", () => {
    expect(
      publicAbuseControlError({
        ok: false,
        reason: "rate-limited",
        retryAfterSeconds: 900,
      }),
    ).toEqual({
      message: "Çok fazla istek yapıldı. Lütfen daha sonra yeniden deneyin.",
      status: 429,
      headers: { "Retry-After": "900" },
    });
  });
});

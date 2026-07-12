import { describe, expect, it, vi } from "vitest";

import {
  authRateLimitKey,
  authRateLimitPolicies,
  clientAddress,
  enforceAuthAbuseControls,
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
});

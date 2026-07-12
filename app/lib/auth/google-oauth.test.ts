import { describe, expect, it } from "vitest";

import {
  googleAccountLinkingPolicy,
  googleOAuthProvider,
  inspectGoogleOAuthReadiness,
  resolveGoogleCallbackState,
} from "./google-oauth";

describe("Google OAuth policy", () => {
  it("stays disabled when either credential is missing", () => {
    expect(inspectGoogleOAuthReadiness({})).toEqual({
      configured: false,
      missing: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    });
    expect(
      inspectGoogleOAuthReadiness({ GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com" }),
    ).toEqual({ configured: false, missing: ["GOOGLE_CLIENT_SECRET"] });
  });

  it("rejects committed placeholder values", () => {
    expect(
      inspectGoogleOAuthReadiness({
        GOOGLE_CLIENT_ID: "replace-with-google-client-id",
        GOOGLE_CLIENT_SECRET: "placeholder-secret",
      }).configured,
    ).toBe(false);
  });

  it("builds a minimal provider only when both values are real", () => {
    expect(
      googleOAuthProvider({
        GOOGLE_CLIENT_ID: " client.apps.googleusercontent.com ",
        GOOGLE_CLIENT_SECRET: " google-secret ",
      }),
    ).toEqual({
      clientId: "client.apps.googleusercontent.com",
      clientSecret: "google-secret",
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
      disableSignUp: true,
    });
  });

  it("forbids implicit or cross-email linking", () => {
    expect(googleAccountLinkingPolicy).toEqual({
      enabled: true,
      disableImplicitLinking: true,
      allowDifferentEmails: false,
      updateUserInfoOnLink: false,
    });
  });

  it("maps callback parameters without exposing provider details", () => {
    expect(
      resolveGoogleCallbackState(new URL("https://openmarket.test/auth/callback?status=success")),
    ).toBe("success");
    expect(
      resolveGoogleCallbackState(
        new URL("https://openmarket.test/auth/callback?error=account_not_linked"),
      ),
    ).toBe("account-not-linked");
    expect(
      resolveGoogleCallbackState(
        new URL("https://openmarket.test/auth/callback?error=google_unavailable"),
      ),
    ).toBe("unavailable");
    expect(
      resolveGoogleCallbackState(new URL("https://openmarket.test/auth/callback?error=denied")),
    ).toBe("provider-error");
    expect(resolveGoogleCallbackState(new URL("https://openmarket.test/auth/callback"))).toBe(
      "processing",
    );
  });
});

import { describe, expect, it } from "vitest";

import { validateEmailRequest, validateResetPassword } from "./recovery";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("verification and recovery validation", () => {
  it("normalizes email requests and accepts the supported languages", () => {
    const result = validateEmailRequest(
      form({ email: " USER@Example.com ", preferredLanguage: "en" }),
    );

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({
      email: "user@example.com",
      preferredLanguage: "en",
    });
  });

  it("rejects malformed email requests", () => {
    const result = validateEmailRequest(form({ email: "not-an-email", preferredLanguage: "de" }));

    expect(result.errors.email).toBeTruthy();
    expect(result.errors.preferredLanguage).toBeTruthy();
  });

  it("requires a token and matching launch-policy password", () => {
    const result = validateResetPassword(
      form({ token: "", password: "short", confirmPassword: "different" }),
    );

    expect(result.errors).toMatchObject({
      token: expect.any(String),
      password: expect.any(String),
      confirmPassword: expect.any(String),
    });
  });

  it("accepts a valid reset payload", () => {
    const result = validateResetPassword(
      form({
        token: "reset-token",
        password: "OpenMarket-Recovery-2026",
        confirmPassword: "OpenMarket-Recovery-2026",
      }),
    );

    expect(result.errors).toEqual({});
    expect(result.token).toBe("reset-token");
  });
});

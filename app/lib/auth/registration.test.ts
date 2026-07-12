import { describe, expect, it } from "vitest";

import { validateLogin, validateRegistration } from "./registration";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("registration validation", () => {
  it("accepts the required launch fields", () => {
    const result = validateRegistration(
      form({
        name: "Halit Turan Arıcan",
        email: "HALIT@example.com",
        country: "Türkiye",
        preferredLanguage: "tr",
        intendedUse: "both",
        password: "OpenMarket-2026",
        confirmPassword: "OpenMarket-2026",
      }),
    );

    expect(result.errors).toEqual({});
    expect(result.values.email).toBe("halit@example.com");
    expect(result.values.intendedUse).toBe("both");
  });

  it("rejects missing preferences and mismatched passwords", () => {
    const result = validateRegistration(
      form({
        name: "A",
        email: "not-an-email",
        country: "T",
        preferredLanguage: "de",
        intendedUse: "visitor",
        password: "short",
        confirmPassword: "different",
      }),
    );

    expect(result.errors).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      country: expect.any(String),
      preferredLanguage: expect.any(String),
      intendedUse: expect.any(String),
      password: expect.any(String),
      confirmPassword: expect.any(String),
    });
  });
});

describe("login validation", () => {
  it("requires a valid email and a password", () => {
    const result = validateLogin(form({ email: "invalid", password: "" }));
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.password).toBeTruthy();
  });
});

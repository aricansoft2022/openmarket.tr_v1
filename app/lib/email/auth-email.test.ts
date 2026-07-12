import { describe, expect, it } from "vitest";

import { renderAuthEmail } from "./auth-email";

describe("auth email templates", () => {
  it("renders the Turkish verification contract", () => {
    const rendered = renderAuthEmail(
      "auth.verify-email",
      "tr",
      "https://openmarket.test/api/auth/verify-email?token=secret",
    );

    expect(rendered.subject).toContain("doğrulayın");
    expect(rendered.text).toContain("1 saat");
    expect(rendered.text).toContain("https://openmarket.test/");
  });

  it("renders the English reset contract", () => {
    const rendered = renderAuthEmail(
      "auth.reset-password",
      "en",
      "https://openmarket.test/auth/reset-password?token=secret",
    );

    expect(rendered.subject).toContain("Reset");
    expect(rendered.text).toContain("1 hour");
  });

  it("rejects insecure non-local links", () => {
    expect(() =>
      renderAuthEmail(
        "auth.reset-password",
        "tr",
        "http://openmarket.test/auth/reset-password?token=secret",
      ),
    ).toThrow(/HTTPS/);
  });
});

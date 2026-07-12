import { describe, expect, it } from "vitest";

import {
  hasOnboardingErrors,
  validateBusinessIdentity,
  validateWorkspaceSelection,
} from "./onboarding";

describe("business identity onboarding validation", () => {
  it("accepts only fixed workspace intents", () => {
    const valid = new FormData();
    valid.set("intendedUse", "both");
    expect(validateWorkspaceSelection(valid)).toEqual({ intendedUse: "both", errors: {} });

    const invalid = new FormData();
    invalid.set("intendedUse", "admin");
    expect(validateWorkspaceSelection(invalid).errors.intendedUse).toBeTruthy();
  });

  it("normalizes identity fields and rejects malformed values", () => {
    const formData = new FormData();
    formData.set("companyName", "  Textile Company  ");
    formData.set("companyEmail", "  BUYER@EXAMPLE.COM  ");
    formData.set("applicantNote", "  Company note  ");

    expect(validateBusinessIdentity(formData)).toEqual({
      values: {
        companyName: "Textile Company",
        companyEmail: "buyer@example.com",
        applicantNote: "Company note",
      },
      errors: {},
    });
  });

  it("reports form errors without accepting an invalid email", () => {
    const formData = new FormData();
    formData.set("companyName", "A");
    formData.set("companyEmail", "invalid");
    formData.set("applicantNote", "x".repeat(1201));

    const result = validateBusinessIdentity(formData);
    expect(hasOnboardingErrors(result.errors)).toBe(true);
    expect(result.errors.companyName).toBeTruthy();
    expect(result.errors.companyEmail).toBeTruthy();
    expect(result.errors.applicantNote).toBeTruthy();
  });
});

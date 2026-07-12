import { describe, expect, it } from "vitest";

import { roleAllows, strongestAllowedRole } from "./platform-staff";

describe("platform staff authorization", () => {
  it("allows only reviewer and administrator roles to decide business identity", () => {
    expect(roleAllows("compliance_reviewer", "business_identity.review.decide")).toBe(true);
    expect(roleAllows("platform_admin", "business_identity.review.decide")).toBe(true);
    expect(roleAllows("super_admin", "business_identity.review.decide")).toBe(true);
    expect(roleAllows("product_rfq_moderator", "business_identity.review.decide")).toBe(false);
    expect(roleAllows("catalogue_content_editor", "business_identity.review.decide")).toBe(false);
    expect(roleAllows("privacy_support_manager", "business_identity.review.decide")).toBe(false);
  });

  it("resolves the strongest active role without inventing custom roles", () => {
    expect(
      strongestAllowedRole(
        ["compliance_reviewer", "platform_admin"],
        "business_identity.evidence.read",
      ),
    ).toBe("platform_admin");
    expect(
      strongestAllowedRole(["product_rfq_moderator"], "business_identity.review.read"),
    ).toBeNull();
  });
});

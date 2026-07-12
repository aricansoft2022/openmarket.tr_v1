import { describe, expect, it } from "vitest";

import {
  managerMayChangeRole,
  roleAllows,
  staffRoleAllows,
  strongestAllowedRole,
  strongestStaffManagerRole,
} from "./platform-staff";

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

  it("limits staff assignment management to administrators", () => {
    expect(staffRoleAllows("super_admin", "platform_staff.assignment.grant")).toBe(true);
    expect(staffRoleAllows("platform_admin", "platform_staff.assignment.revoke")).toBe(true);
    expect(staffRoleAllows("compliance_reviewer", "platform_staff.assignment.list")).toBe(false);
    expect(
      strongestStaffManagerRole(
        ["compliance_reviewer", "platform_admin"],
        "platform_staff.assignment.grant",
      ),
    ).toBe("platform_admin");
  });

  it("reserves administrator-role changes for super administrators", () => {
    expect(managerMayChangeRole("platform_admin", "compliance_reviewer")).toBe(true);
    expect(managerMayChangeRole("platform_admin", "platform_admin")).toBe(false);
    expect(managerMayChangeRole("platform_admin", "super_admin")).toBe(false);
    expect(managerMayChangeRole("super_admin", "platform_admin")).toBe(true);
    expect(managerMayChangeRole("super_admin", "super_admin")).toBe(true);
  });
});

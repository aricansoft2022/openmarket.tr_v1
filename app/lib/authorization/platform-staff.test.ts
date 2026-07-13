import { describe, expect, it } from "vitest";

import { assertNotSelfManagement, StaffAuthorizationError } from "./platform-staff.server";
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

  it("applies the same fixed reviewer boundary to Supplier company documents", () => {
    for (const role of ["compliance_reviewer", "platform_admin", "super_admin"] as const) {
      expect(roleAllows(role, "supplier_document.review.list")).toBe(true);
      expect(roleAllows(role, "supplier_document.review.read")).toBe(true);
      expect(roleAllows(role, "supplier_document.review.decide")).toBe(true);
      expect(roleAllows(role, "supplier_document.file.read")).toBe(true);
    }
    for (const role of [
      "product_rfq_moderator",
      "catalogue_content_editor",
      "privacy_support_manager",
    ] as const) {
      expect(roleAllows(role, "supplier_document.review.decide")).toBe(false);
      expect(roleAllows(role, "supplier_document.file.read")).toBe(false);
    }
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
    expect(
      strongestAllowedRole(
        ["compliance_reviewer", "super_admin"],
        "supplier_document.review.decide",
      ),
    ).toBe("super_admin");
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

  it("lets Platform Admin manage every operational role but no administrator role", () => {
    for (const role of [
      "catalogue_content_editor",
      "compliance_reviewer",
      "product_rfq_moderator",
      "privacy_support_manager",
    ] as const) {
      expect(managerMayChangeRole("platform_admin", role)).toBe(true);
    }
    expect(managerMayChangeRole("platform_admin", "platform_admin")).toBe(false);
    expect(managerMayChangeRole("platform_admin", "super_admin")).toBe(false);
  });

  it("lets Super Admin manage operational and administrator roles", () => {
    expect(managerMayChangeRole("super_admin", "compliance_reviewer")).toBe(true);
    expect(managerMayChangeRole("super_admin", "platform_admin")).toBe(true);
    expect(managerMayChangeRole("super_admin", "super_admin")).toBe(true);
  });

  it("rejects self-management before any role mutation", () => {
    expect(() => assertNotSelfManagement("same-user", "same-user")).toThrow(
      StaffAuthorizationError,
    );
    expect(() => assertNotSelfManagement("manager", "target")).not.toThrow();
  });
});

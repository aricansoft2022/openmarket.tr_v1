import { describe, expect, it } from "vitest";

import { roleAllows } from "../app/lib/authorization/platform-staff";

const activationPermissions = [
  "supplier_activation.suspend",
  "supplier_activation.reactivate",
] as const;

describe("Supplier activation administration permissions", () => {
  it.each(activationPermissions)("allows Super Admin to use %s", (permission) => {
    expect(roleAllows("super_admin", permission)).toBe(true);
  });

  it.each(activationPermissions)("allows Platform Admin to use %s", (permission) => {
    expect(roleAllows("platform_admin", permission)).toBe(true);
  });

  it.each(activationPermissions)("denies Compliance Reviewer from %s", (permission) => {
    expect(roleAllows("compliance_reviewer", permission)).toBe(false);
  });

  it.each(activationPermissions)("denies unrelated fixed roles from %s", (permission) => {
    expect(roleAllows("catalogue_content_editor", permission)).toBe(false);
    expect(roleAllows("product_rfq_moderator", permission)).toBe(false);
    expect(roleAllows("privacy_support_manager", permission)).toBe(false);
  });
});

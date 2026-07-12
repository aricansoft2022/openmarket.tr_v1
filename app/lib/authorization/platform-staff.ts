import type { PlatformStaffRole } from "../db/schema";

export const businessIdentityPermissions = [
  "business_identity.review.list",
  "business_identity.review.read",
  "business_identity.review.decide",
  "business_identity.evidence.read",
] as const;
export type BusinessIdentityPermission = (typeof businessIdentityPermissions)[number];

export const businessIdentityReviewerRoles = [
  "super_admin",
  "platform_admin",
  "compliance_reviewer",
] as const satisfies readonly PlatformStaffRole[];
export type BusinessIdentityReviewerRole = (typeof businessIdentityReviewerRoles)[number];

const permissionMatrix: Record<PlatformStaffRole, readonly BusinessIdentityPermission[]> = {
  super_admin: businessIdentityPermissions,
  platform_admin: businessIdentityPermissions,
  compliance_reviewer: businessIdentityPermissions,
  catalogue_content_editor: [],
  product_rfq_moderator: [],
  privacy_support_manager: [],
};

const rolePriority: readonly PlatformStaffRole[] = [
  "super_admin",
  "platform_admin",
  "compliance_reviewer",
  "privacy_support_manager",
  "product_rfq_moderator",
  "catalogue_content_editor",
];

export function roleAllows(
  role: PlatformStaffRole,
  permission: BusinessIdentityPermission,
): boolean {
  return permissionMatrix[role].includes(permission);
}

export function strongestAllowedRole(
  roles: readonly PlatformStaffRole[],
  permission: BusinessIdentityPermission,
): BusinessIdentityReviewerRole | null {
  for (const role of rolePriority) {
    if (roles.includes(role) && roleAllows(role, permission)) {
      return role as BusinessIdentityReviewerRole;
    }
  }
  return null;
}

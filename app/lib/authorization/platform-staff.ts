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

export const staffManagementPermissions = [
  "platform_staff.assignment.list",
  "platform_staff.assignment.grant",
  "platform_staff.assignment.revoke",
] as const;
export type StaffManagementPermission = (typeof staffManagementPermissions)[number];

export const staffManagerRoles = [
  "super_admin",
  "platform_admin",
] as const satisfies readonly PlatformStaffRole[];
export type StaffManagerRole = (typeof staffManagerRoles)[number];

const businessIdentityPermissionMatrix: Record<
  PlatformStaffRole,
  readonly BusinessIdentityPermission[]
> = {
  super_admin: businessIdentityPermissions,
  platform_admin: businessIdentityPermissions,
  compliance_reviewer: businessIdentityPermissions,
  catalogue_content_editor: [],
  product_rfq_moderator: [],
  privacy_support_manager: [],
};

const staffManagementPermissionMatrix: Record<
  PlatformStaffRole,
  readonly StaffManagementPermission[]
> = {
  super_admin: staffManagementPermissions,
  platform_admin: staffManagementPermissions,
  compliance_reviewer: [],
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
  return businessIdentityPermissionMatrix[role].includes(permission);
}

export function staffRoleAllows(
  role: PlatformStaffRole,
  permission: StaffManagementPermission,
): boolean {
  return staffManagementPermissionMatrix[role].includes(permission);
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

export function strongestStaffManagerRole(
  roles: readonly PlatformStaffRole[],
  permission: StaffManagementPermission,
): StaffManagerRole | null {
  for (const role of rolePriority) {
    if (roles.includes(role) && staffRoleAllows(role, permission)) {
      return role as StaffManagerRole;
    }
  }
  return null;
}

export function managerMayChangeRole(
  managerRole: StaffManagerRole,
  targetRole: PlatformStaffRole,
): boolean {
  if (managerRole === "super_admin") return true;
  return targetRole !== "super_admin" && targetRole !== "platform_admin";
}

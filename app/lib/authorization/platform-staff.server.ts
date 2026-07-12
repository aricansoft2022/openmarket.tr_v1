import { and, eq } from "drizzle-orm";

import type { Database } from "../db/client.server";
import { platformStaffAssignments, type PlatformStaffRole } from "../db/schema";
import {
  strongestAllowedRole,
  strongestStaffManagerRole,
  type BusinessIdentityPermission,
  type BusinessIdentityReviewerRole,
  type StaffManagementPermission,
  type StaffManagerRole,
} from "./platform-staff";

export class StaffAuthorizationError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "SELF_REVIEW" | "SELF_MANAGEMENT",
    message: string,
  ) {
    super(message);
    this.name = "StaffAuthorizationError";
  }
}

async function activeRoles(database: Database, userId: string): Promise<PlatformStaffRole[]> {
  const assignments = await database
    .select({ role: platformStaffAssignments.role })
    .from(platformStaffAssignments)
    .where(
      and(
        eq(platformStaffAssignments.userId, userId),
        eq(platformStaffAssignments.status, "active"),
      ),
    );

  return assignments.map((assignment) => assignment.role as PlatformStaffRole);
}

export async function resolveEffectiveStaffRole(
  database: Database,
  userId: string,
  permission: BusinessIdentityPermission,
): Promise<BusinessIdentityReviewerRole | null> {
  return strongestAllowedRole(await activeRoles(database, userId), permission);
}

export async function requireStaffPermission(
  database: Database,
  userId: string,
  permission: BusinessIdentityPermission,
): Promise<BusinessIdentityReviewerRole> {
  const role = await resolveEffectiveStaffRole(database, userId, permission);
  if (!role) {
    throw new StaffAuthorizationError(
      "FORBIDDEN",
      "The current account does not have permission for this staff action.",
    );
  }
  return role;
}

export async function resolveEffectiveStaffManagerRole(
  database: Database,
  userId: string,
  permission: StaffManagementPermission,
): Promise<StaffManagerRole | null> {
  return strongestStaffManagerRole(await activeRoles(database, userId), permission);
}

export async function requireStaffManagementPermission(
  database: Database,
  userId: string,
  permission: StaffManagementPermission,
): Promise<StaffManagerRole> {
  const role = await resolveEffectiveStaffManagerRole(database, userId, permission);
  if (!role) {
    throw new StaffAuthorizationError(
      "FORBIDDEN",
      "The current account does not have permission to manage platform staff assignments.",
    );
  }
  return role;
}

export function assertNotSelfReview(actorId: string, applicantId: string): void {
  if (actorId === applicantId) {
    throw new StaffAuthorizationError(
      "SELF_REVIEW",
      "Staff cannot review their own business identity application.",
    );
  }
}

export function assertNotSelfManagement(actorId: string, targetUserId: string): void {
  if (actorId === targetUserId) {
    throw new StaffAuthorizationError(
      "SELF_MANAGEMENT",
      "Staff cannot grant or revoke their own platform roles.",
    );
  }
}

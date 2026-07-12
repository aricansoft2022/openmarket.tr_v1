import { and, eq } from "drizzle-orm";

import type { Database } from "../db/client.server";
import { platformStaffAssignments, type PlatformStaffRole } from "../db/schema";
import {
  strongestAllowedRole,
  type BusinessIdentityPermission,
  type BusinessIdentityReviewerRole,
} from "./platform-staff";

export class StaffAuthorizationError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "SELF_REVIEW",
    message: string,
  ) {
    super(message);
    this.name = "StaffAuthorizationError";
  }
}

export async function resolveEffectiveStaffRole(
  database: Database,
  userId: string,
  permission: BusinessIdentityPermission,
): Promise<BusinessIdentityReviewerRole | null> {
  const assignments = await database
    .select({ role: platformStaffAssignments.role })
    .from(platformStaffAssignments)
    .where(
      and(
        eq(platformStaffAssignments.userId, userId),
        eq(platformStaffAssignments.status, "active"),
      ),
    );

  return strongestAllowedRole(
    assignments.map((assignment) => assignment.role as PlatformStaffRole),
    permission,
  );
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

export function assertNotSelfReview(actorId: string, applicantId: string): void {
  if (actorId === applicantId) {
    throw new StaffAuthorizationError(
      "SELF_REVIEW",
      "Staff cannot review their own business identity application.",
    );
  }
}

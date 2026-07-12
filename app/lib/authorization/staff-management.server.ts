import { and, asc, eq } from "drizzle-orm";

import { createAuth, type AuthEnvironment } from "../auth/create-auth.server";
import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import {
  auditLogs,
  platformStaffAssignments,
  user,
  type PlatformStaffAssignmentStatus,
  type PlatformStaffRole,
} from "../db/schema";
import {
  assertNotSelfManagement,
  requireStaffManagementPermission,
  StaffAuthorizationError,
} from "./platform-staff.server";
import { managerMayChangeRole, type StaffManagerRole } from "./platform-staff";

export type StaffManagementEnvironment = AuthEnvironment;

export type StaffAssignmentSummary = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: PlatformStaffRole;
  status: PlatformStaffAssignmentStatus;
  assignmentReason: string;
  assignedBy: string;
  assignedAt: Date;
  revokedBy: string | null;
  revokedAt: Date | null;
  revocationReason: string | null;
};

export type StaffManagementContext<T> = {
  actor: { id: string; name: string; email: string };
  effectiveRole: StaffManagerRole;
  value: T;
};

export class StaffManagementError extends Error {
  constructor(
    public readonly code:
      | "USER_NOT_FOUND"
      | "ROLE_NOT_MANAGEABLE"
      | "ASSIGNMENT_ALREADY_ACTIVE"
      | "ASSIGNMENT_NOT_FOUND"
      | "ASSIGNMENT_NOT_ACTIVE"
      | "INVALID_REASON",
    message: string,
  ) {
    super(message);
    this.name = "StaffManagementError";
  }
}

function requestId(request: Request): string | undefined {
  return request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined;
}

function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

function validatedReason(value: string): string {
  const reason = value.trim();
  if (reason.length < 3) {
    throw new StaffManagementError("INVALID_REASON", "A reason of at least three characters is required.");
  }
  return reason;
}

async function currentSession(
  database: Database,
  env: StaffManagementEnvironment,
  request: Request,
) {
  const auth = createAuth(database, env);
  return auth.api.getSession({ headers: request.headers });
}

async function authorizedSession(
  database: Database,
  env: StaffManagementEnvironment,
  request: Request,
  permission:
    | "platform_staff.assignment.list"
    | "platform_staff.assignment.grant"
    | "platform_staff.assignment.revoke",
) {
  const session = await currentSession(database, env, request);
  if (!session) {
    throw new StaffAuthorizationError("UNAUTHENTICATED", "Authentication is required.");
  }
  const effectiveRole = await requireStaffManagementPermission(
    database,
    session.user.id,
    permission,
  );
  return { session, effectiveRole };
}

function assertRoleManageable(managerRole: StaffManagerRole, targetRole: PlatformStaffRole): void {
  if (!managerMayChangeRole(managerRole, targetRole)) {
    throw new StaffManagementError(
      "ROLE_NOT_MANAGEABLE",
      "Only a Super Admin may grant or revoke administrator roles.",
    );
  }
}

async function writeAssignmentAudit(
  database: Database,
  input: {
    actorId: string;
    effectiveRole: StaffManagerRole;
    assignmentId: string;
    action: "platform_staff.assignment.granted" | "platform_staff.assignment.revoked";
    oldValue: unknown;
    newValue: unknown;
    reason: string;
    requestId?: string;
  },
) {
  await database.insert(auditLogs).values({
    actorId: input.actorId,
    effectiveRole: input.effectiveRole,
    resourceType: "platform_staff_assignment",
    resourceId: input.assignmentId,
    action: input.action,
    oldValue: input.oldValue,
    newValue: input.newValue,
    reason: input.reason,
    requestId: input.requestId,
  });
}

export async function loadStaffAssignments(
  env: StaffManagementEnvironment,
  request: Request,
): Promise<StaffManagementContext<StaffAssignmentSummary[]>> {
  return withDatabase(env, async (database) => {
    const { session, effectiveRole } = await authorizedSession(
      database,
      env,
      request,
      "platform_staff.assignment.list",
    );

    const assignments = await database
      .select({
        id: platformStaffAssignments.id,
        userId: platformStaffAssignments.userId,
        userName: user.name,
        userEmail: user.email,
        role: platformStaffAssignments.role,
        status: platformStaffAssignments.status,
        assignmentReason: platformStaffAssignments.assignmentReason,
        assignedBy: platformStaffAssignments.assignedBy,
        assignedAt: platformStaffAssignments.assignedAt,
        revokedBy: platformStaffAssignments.revokedBy,
        revokedAt: platformStaffAssignments.revokedAt,
        revocationReason: platformStaffAssignments.revocationReason,
      })
      .from(platformStaffAssignments)
      .innerJoin(user, eq(user.id, platformStaffAssignments.userId))
      .orderBy(
        asc(platformStaffAssignments.status),
        asc(platformStaffAssignments.role),
        asc(user.email),
      );

    return {
      actor: { id: session.user.id, name: session.user.name, email: session.user.email },
      effectiveRole,
      value: assignments,
    };
  });
}

export async function grantStaffAssignment(
  env: StaffManagementEnvironment,
  request: Request,
  input: { targetEmail: string; role: PlatformStaffRole; reason: string },
): Promise<StaffAssignmentSummary> {
  const reason = validatedReason(input.reason);
  const targetEmail = normalizedEmail(input.targetEmail);

  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const { session, effectiveRole } = await authorizedSession(
        scoped,
        env,
        request,
        "platform_staff.assignment.grant",
      );
      assertRoleManageable(effectiveRole, input.role);

      const [target] = await scoped
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.email, targetEmail))
        .limit(1)
        .for("update");
      if (!target) {
        throw new StaffManagementError("USER_NOT_FOUND", "No account exists for the supplied email.");
      }
      assertNotSelfManagement(session.user.id, target.id);

      const [existing] = await scoped
        .select({
          id: platformStaffAssignments.id,
          status: platformStaffAssignments.status,
          assignmentReason: platformStaffAssignments.assignmentReason,
          assignedBy: platformStaffAssignments.assignedBy,
          assignedAt: platformStaffAssignments.assignedAt,
          revokedBy: platformStaffAssignments.revokedBy,
          revokedAt: platformStaffAssignments.revokedAt,
          revocationReason: platformStaffAssignments.revocationReason,
        })
        .from(platformStaffAssignments)
        .where(
          and(
            eq(platformStaffAssignments.userId, target.id),
            eq(platformStaffAssignments.role, input.role),
          ),
        )
        .limit(1)
        .for("update");

      if (existing?.status === "active") {
        throw new StaffManagementError(
          "ASSIGNMENT_ALREADY_ACTIVE",
          "The account already has this active platform role.",
        );
      }

      const now = new Date();
      const [assignment] = existing
        ? await scoped
            .update(platformStaffAssignments)
            .set({
              status: "active",
              assignedBy: session.user.id,
              assignmentReason: reason,
              assignedAt: now,
              revokedBy: null,
              revokedAt: null,
              revocationReason: null,
              updatedAt: now,
            })
            .where(eq(platformStaffAssignments.id, existing.id))
            .returning()
        : await scoped
            .insert(platformStaffAssignments)
            .values({
              userId: target.id,
              role: input.role,
              status: "active",
              assignedBy: session.user.id,
              assignmentReason: reason,
              assignedAt: now,
              updatedAt: now,
            })
            .returning();

      await writeAssignmentAudit(scoped, {
        actorId: session.user.id,
        effectiveRole,
        assignmentId: assignment!.id,
        action: "platform_staff.assignment.granted",
        oldValue: existing
          ? {
              status: existing.status,
              assignedBy: existing.assignedBy,
              assignmentReason: existing.assignmentReason,
              assignedAt: existing.assignedAt,
              revokedBy: existing.revokedBy,
              revokedAt: existing.revokedAt,
              revocationReason: existing.revocationReason,
            }
          : null,
        newValue: { userId: target.id, role: input.role, status: "active" },
        reason,
        requestId: requestId(request),
      });

      return {
        id: assignment!.id,
        userId: target.id,
        userName: target.name,
        userEmail: target.email,
        role: assignment!.role,
        status: assignment!.status,
        assignmentReason: assignment!.assignmentReason,
        assignedBy: assignment!.assignedBy,
        assignedAt: assignment!.assignedAt,
        revokedBy: assignment!.revokedBy,
        revokedAt: assignment!.revokedAt,
        revocationReason: assignment!.revocationReason,
      };
    }),
  );
}

export async function revokeStaffAssignment(
  env: StaffManagementEnvironment,
  request: Request,
  input: { assignmentId: string; reason: string },
): Promise<void> {
  const reason = validatedReason(input.reason);

  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const { session, effectiveRole } = await authorizedSession(
        scoped,
        env,
        request,
        "platform_staff.assignment.revoke",
      );

      const [assignment] = await scoped
        .select({
          id: platformStaffAssignments.id,
          userId: platformStaffAssignments.userId,
          role: platformStaffAssignments.role,
          status: platformStaffAssignments.status,
          assignmentReason: platformStaffAssignments.assignmentReason,
          assignedBy: platformStaffAssignments.assignedBy,
          assignedAt: platformStaffAssignments.assignedAt,
        })
        .from(platformStaffAssignments)
        .where(eq(platformStaffAssignments.id, input.assignmentId))
        .limit(1)
        .for("update");
      if (!assignment) {
        throw new StaffManagementError("ASSIGNMENT_NOT_FOUND", "The staff assignment was not found.");
      }
      if (assignment.status !== "active") {
        throw new StaffManagementError(
          "ASSIGNMENT_NOT_ACTIVE",
          "Only an active staff assignment can be revoked.",
        );
      }

      assertNotSelfManagement(session.user.id, assignment.userId);
      assertRoleManageable(effectiveRole, assignment.role);

      const now = new Date();
      await scoped
        .update(platformStaffAssignments)
        .set({
          status: "revoked",
          revokedBy: session.user.id,
          revokedAt: now,
          revocationReason: reason,
          updatedAt: now,
        })
        .where(
          and(
            eq(platformStaffAssignments.id, assignment.id),
            eq(platformStaffAssignments.status, "active"),
          ),
        );

      await writeAssignmentAudit(scoped, {
        actorId: session.user.id,
        effectiveRole,
        assignmentId: assignment.id,
        action: "platform_staff.assignment.revoked",
        oldValue: {
          userId: assignment.userId,
          role: assignment.role,
          status: assignment.status,
          assignedBy: assignment.assignedBy,
          assignmentReason: assignment.assignmentReason,
          assignedAt: assignment.assignedAt,
        },
        newValue: { userId: assignment.userId, role: assignment.role, status: "revoked" },
        reason,
        requestId: requestId(request),
      });
    }),
  );
}

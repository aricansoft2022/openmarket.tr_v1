import { and, eq, inArray } from "drizzle-orm";

import { createAuth, type AuthEnvironment } from "../auth/create-auth.server";
import {
  StaffAuthorizationError,
  requireStaffPermission,
} from "../authorization/platform-staff.server";
import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import {
  auditLogs,
  outboxEvents,
  supplierCompanies,
  supplierMemberships,
  type SupplierWorkspaceStatus,
} from "../db/schema";
import { evaluateSupplierActivation } from "./activation";
import { loadSupplierActivationEvidence } from "./activation.server";

const activationOutboxLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export type SupplierActivationAdminEnvironment = AuthEnvironment;

export class SupplierActivationActionError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "COMPANY_NOT_FOUND"
      | "INVALID_TRANSITION"
      | "REASON_REQUIRED",
    message: string,
  ) {
    super(message);
    this.name = "SupplierActivationActionError";
  }
}

function requestId(request: Request): string | undefined {
  return request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined;
}

function validatedReason(value: string): string {
  const reason = value.trim();
  if (reason.length < 3 || reason.length > 2000) {
    throw new SupplierActivationActionError(
      "REASON_REQUIRED",
      "Supplier suspension and reactivation require a reason of 3–2000 characters.",
    );
  }
  return reason;
}

async function activeOwnerAndAdminIds(database: Database, companyId: string): Promise<string[]> {
  const rows = await database
    .select({ userId: supplierMemberships.userId })
    .from(supplierMemberships)
    .where(
      and(
        eq(supplierMemberships.companyId, companyId),
        eq(supplierMemberships.status, "active"),
        inArray(supplierMemberships.role, ["owner", "admin"]),
      ),
    );
  return rows.map((row) => row.userId);
}

async function writeAdministrativeTransition(
  database: Database,
  input: {
    companyId: string;
    previousStatus: SupplierWorkspaceStatus;
    nextStatus: SupplierWorkspaceStatus;
    actorId: string;
    effectiveRole: string;
    reason: string;
    requestId?: string;
    blockerCodes?: string[];
    now: Date;
  },
): Promise<void> {
  await database
    .update(supplierCompanies)
    .set({ status: input.nextStatus, updatedAt: input.now })
    .where(eq(supplierCompanies.id, input.companyId));
  await database.insert(auditLogs).values({
    actorId: input.actorId,
    effectiveRole: input.effectiveRole,
    resourceType: "supplier_company",
    resourceId: input.companyId,
    action:
      input.nextStatus === "suspended_supplier"
        ? "supplier.activation.suspended"
        : "supplier.activation.reactivated",
    oldValue: { status: input.previousStatus },
    newValue: { status: input.nextStatus, blockers: input.blockerCodes ?? [] },
    reason: input.reason,
    requestId: input.requestId,
  });
  await database.insert(outboxEvents).values({
    aggregateType: "supplier_company",
    aggregateId: input.companyId,
    eventType:
      input.nextStatus === "suspended_supplier"
        ? "supplier.activation.suspended"
        : "supplier.activation.reactivated",
    payload: {
      companyId: input.companyId,
      previousStatus: input.previousStatus,
      nextStatus: input.nextStatus,
      blockerCodes: input.blockerCodes ?? [],
      recipientUserIds: await activeOwnerAndAdminIds(database, input.companyId),
    },
    expiresAt: new Date(input.now.getTime() + activationOutboxLifetimeMs),
  });
}

export async function suspendSupplierCompany(
  env: SupplierActivationAdminEnvironment,
  request: Request,
  companyId: string,
  reasonInput: string,
): Promise<SupplierWorkspaceStatus> {
  const reason = validatedReason(reasonInput);
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await createAuth(scoped, env).api.getSession({ headers: request.headers });
      if (!session) {
        throw new SupplierActivationActionError("UNAUTHENTICATED", "Authentication is required.");
      }
      const actorRole = await requireStaffPermission(
        scoped,
        session.user.id,
        "supplier_activation.suspend",
      );
      const [company] = await scoped
        .select({ status: supplierCompanies.status })
        .from(supplierCompanies)
        .where(eq(supplierCompanies.id, companyId))
        .limit(1)
        .for("update");
      if (!company) {
        throw new SupplierActivationActionError("COMPANY_NOT_FOUND", "Supplier company was not found.");
      }
      if (company.status === "suspended_supplier") return company.status;

      const now = new Date();
      await writeAdministrativeTransition(scoped, {
        companyId,
        previousStatus: company.status,
        nextStatus: "suspended_supplier",
        actorId: session.user.id,
        effectiveRole: actorRole,
        reason,
        requestId: requestId(request),
        now,
      });
      return "suspended_supplier";
    }),
  );
}

export async function reactivateSupplierCompany(
  env: SupplierActivationAdminEnvironment,
  request: Request,
  companyId: string,
  reasonInput: string,
): Promise<SupplierWorkspaceStatus> {
  const reason = validatedReason(reasonInput);
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await createAuth(scoped, env).api.getSession({ headers: request.headers });
      if (!session) {
        throw new SupplierActivationActionError("UNAUTHENTICATED", "Authentication is required.");
      }
      const actorRole = await requireStaffPermission(
        scoped,
        session.user.id,
        "supplier_activation.reactivate",
      );
      const [company] = await scoped
        .select({ status: supplierCompanies.status })
        .from(supplierCompanies)
        .where(eq(supplierCompanies.id, companyId))
        .limit(1)
        .for("update");
      if (!company) {
        throw new SupplierActivationActionError("COMPANY_NOT_FOUND", "Supplier company was not found.");
      }
      if (company.status !== "suspended_supplier") {
        throw new SupplierActivationActionError(
          "INVALID_TRANSITION",
          "Only a suspended Supplier may be explicitly reactivated.",
        );
      }

      const now = new Date();
      const evidence = await loadSupplierActivationEvidence(scoped, companyId, now);
      if (!evidence) {
        throw new SupplierActivationActionError("COMPANY_NOT_FOUND", "Supplier company was not found.");
      }
      const evaluation = evaluateSupplierActivation({
        ...evidence,
        currentStatus: "reactivation_required",
      });
      const blockerCodes = [...new Set(evaluation.blockers.map((blocker) => blocker.code))];
      await writeAdministrativeTransition(scoped, {
        companyId,
        previousStatus: company.status,
        nextStatus: evaluation.nextStatus,
        actorId: session.user.id,
        effectiveRole: actorRole,
        reason,
        requestId: requestId(request),
        blockerCodes,
        now,
      });
      return evaluation.nextStatus;
    }),
  );
}

export function isSupplierActivationAuthorizationError(
  error: unknown,
): error is StaffAuthorizationError {
  return error instanceof StaffAuthorizationError;
}

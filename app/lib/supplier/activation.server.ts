import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

import type { Database } from "../db/client.server";
import {
  auditLogs,
  businessIdentityReviews,
  outboxEvents,
  supplierApplicationContexts,
  supplierCompanies,
  supplierCompanyDocuments,
  supplierCompanyTypes,
  supplierDocumentRequirementRules,
  supplierMemberships,
  type SupplierWorkspaceStatus,
} from "../db/schema";
import {
  evaluateSupplierActivation,
  type SupplierActivationEvaluation,
  type SupplierActivationInput,
} from "./activation";
import { launchSupplierTypeKeys, type LaunchSupplierTypeKey } from "./catalogue";
import {
  deriveSupplierDocumentState,
  resolveSupplierDocumentRequirements,
  type SupplierDocumentDerivedState,
} from "./documents/policy";
import { evaluateSupplierProfileCompleteness } from "./profile";

const activationOutboxLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export type SupplierActivationEvidence = SupplierActivationInput & {
  companyId: string;
};

export type SupplierActivationReconciliation = {
  evidence: SupplierActivationEvidence;
  evaluation: SupplierActivationEvaluation;
  changed: boolean;
};

export type SupplierActivationActor = {
  actorId: string | null;
  effectiveRole: string;
  reason: string;
  requestId?: string;
  now?: Date;
};

function selectedLaunchSupplierTypes(keys: readonly string[]): LaunchSupplierTypeKey[] {
  return keys.filter((key): key is LaunchSupplierTypeKey =>
    launchSupplierTypeKeys.includes(key as LaunchSupplierTypeKey),
  );
}

function currentRequirementState(
  rows: readonly {
    storageStatus: "uploading" | "stored_private" | "failed" | "removed";
    evidenceStatus:
      "uploaded" | "pending_review" | "approved" | "rejected" | "expired" | "replacement_required";
    scanStatus: "pending" | "clean" | "rejected" | "failed";
    expiresAt: Date | null;
  }[],
  now: Date,
): SupplierDocumentDerivedState {
  const states = rows.map((row) => deriveSupplierDocumentState({ ...row, now }));
  if (states.includes("approved")) return "approved";
  return states[0] ?? "missing";
}

export async function loadSupplierActivationEvidence(
  database: Database,
  companyId: string,
  now = new Date(),
): Promise<SupplierActivationEvidence | null> {
  const [company] = await database
    .select({
      id: supplierCompanies.id,
      status: supplierCompanies.status,
      identityStatus: businessIdentityReviews.status,
      legalName: supplierCompanies.legalName,
      tradingName: supplierCompanies.tradingName,
      countryCode: supplierCompanies.countryCode,
      city: supplierCompanies.city,
      website: supplierCompanies.website,
      description: supplierCompanies.description,
      foundedYear: supplierCompanies.foundedYear,
    })
    .from(supplierCompanies)
    .innerJoin(
      businessIdentityReviews,
      eq(businessIdentityReviews.id, supplierCompanies.businessIdentityReviewId),
    )
    .where(eq(supplierCompanies.id, companyId))
    .limit(1);
  if (!company) return null;

  const [typeRows, contextRows, documentRows, activeRuleRows] = await Promise.all([
    database
      .select({ key: supplierCompanyTypes.supplierTypeKey })
      .from(supplierCompanyTypes)
      .where(eq(supplierCompanyTypes.companyId, companyId))
      .orderBy(asc(supplierCompanyTypes.supplierTypeKey)),
    database
      .select({ key: supplierApplicationContexts.contextKey })
      .from(supplierApplicationContexts)
      .where(eq(supplierApplicationContexts.companyId, companyId))
      .orderBy(asc(supplierApplicationContexts.contextKey)),
    database
      .select({
        documentTypeKey: supplierCompanyDocuments.documentTypeKey,
        storageStatus: supplierCompanyDocuments.storageStatus,
        evidenceStatus: supplierCompanyDocuments.evidenceStatus,
        scanStatus: supplierCompanyDocuments.scanStatus,
        expiresAt: supplierCompanyDocuments.expiresAt,
      })
      .from(supplierCompanyDocuments)
      .where(
        and(
          eq(supplierCompanyDocuments.companyId, companyId),
          ne(supplierCompanyDocuments.storageStatus, "removed"),
        ),
      )
      .orderBy(
        asc(supplierCompanyDocuments.documentTypeKey),
        desc(supplierCompanyDocuments.version),
      ),
    database
      .select({ key: supplierDocumentRequirementRules.key })
      .from(supplierDocumentRequirementRules)
      .where(eq(supplierDocumentRequirementRules.active, true)),
  ]);

  const supplierTypeKeys = selectedLaunchSupplierTypes(typeRows.map((row) => row.key));
  const applicationContextKeys = contextRows.map((row) => row.key);
  const profile = evaluateSupplierProfileCompleteness({
    legalName: company.legalName,
    tradingName: company.tradingName,
    countryCode: company.countryCode,
    city: company.city,
    website: company.website,
    description: company.description,
    foundedYear: company.foundedYear,
    supplierTypeKeys,
    applicationContextKeys,
    productionCapabilityKeys: [],
    exportMarketCountryCodes: [],
  });
  const activeRuleKeys = new Set(activeRuleRows.map((row) => row.key));
  const mandatoryRequirements = resolveSupplierDocumentRequirements(supplierTypeKeys)
    .filter(
      (requirement) =>
        requirement.level === "mandatory" &&
        requirement.sourceRuleKeys.every((key) => activeRuleKeys.has(key)),
    )
    .map((requirement) => ({
      documentTypeKey: requirement.documentTypeKey,
      state: currentRequirementState(
        documentRows.filter((row) => row.documentTypeKey === requirement.documentTypeKey),
        now,
      ),
    }));

  return {
    companyId,
    currentStatus: company.status,
    identityVerified: company.identityStatus === "verified",
    profile,
    mandatoryRequirements,
  };
}

export async function evaluateSupplierActivationForCompany(
  database: Database,
  companyId: string,
  now = new Date(),
): Promise<SupplierActivationReconciliation | null> {
  const evidence = await loadSupplierActivationEvidence(database, companyId, now);
  if (!evidence) return null;
  return {
    evidence,
    evaluation: evaluateSupplierActivation(evidence),
    changed: evidence.currentStatus !== evaluateSupplierActivation(evidence).nextStatus,
  };
}

export async function reconcileSupplierActivationWithinTransaction(
  database: Database,
  companyId: string,
  actor: SupplierActivationActor,
): Promise<SupplierActivationReconciliation | null> {
  const now = actor.now ?? new Date();
  const [locked] = await database
    .select({ status: supplierCompanies.status })
    .from(supplierCompanies)
    .where(eq(supplierCompanies.id, companyId))
    .limit(1)
    .for("update");
  if (!locked) return null;

  const evidence = await loadSupplierActivationEvidence(database, companyId, now);
  if (!evidence) return null;
  const evaluation = evaluateSupplierActivation({ ...evidence, currentStatus: locked.status });
  if (locked.status === evaluation.nextStatus) {
    return { evidence, evaluation, changed: false };
  }

  await database
    .update(supplierCompanies)
    .set({ status: evaluation.nextStatus, updatedAt: now })
    .where(eq(supplierCompanies.id, companyId));

  const recipientRows = await database
    .select({ userId: supplierMemberships.userId })
    .from(supplierMemberships)
    .where(
      and(
        eq(supplierMemberships.companyId, companyId),
        eq(supplierMemberships.status, "active"),
        inArray(supplierMemberships.role, ["owner", "admin"]),
      ),
    );
  const blockerCodes = [...new Set(evaluation.blockers.map((blocker) => blocker.code))];
  await database.insert(auditLogs).values({
    actorId: actor.actorId,
    effectiveRole: actor.effectiveRole,
    resourceType: "supplier_company",
    resourceId: companyId,
    action: "supplier.activation.status_changed",
    oldValue: { status: locked.status },
    newValue: {
      status: evaluation.nextStatus,
      eligibleForActivation: evaluation.eligibleForActivation,
      commercialAccess: evaluation.commercialAccess,
      blockers: evaluation.blockers,
    },
    reason: actor.reason,
    requestId: actor.requestId,
  });
  await database.insert(outboxEvents).values({
    aggregateType: "supplier_company",
    aggregateId: companyId,
    eventType: "supplier.activation.status_changed",
    payload: {
      companyId,
      previousStatus: locked.status,
      nextStatus: evaluation.nextStatus,
      blockerCodes,
      recipientUserIds: recipientRows.map((row) => row.userId),
    },
    expiresAt: new Date(now.getTime() + activationOutboxLifetimeMs),
  });

  return { evidence, evaluation, changed: true };
}

export function requireActiveSupplierStatus(status: SupplierWorkspaceStatus): void {
  if (status !== "active_supplier") {
    throw new SupplierActivationPermissionError(status);
  }
}

export class SupplierActivationPermissionError extends Error {
  constructor(public readonly status: SupplierWorkspaceStatus) {
    super("An active Supplier workspace is required for this commercial action.");
    this.name = "SupplierActivationPermissionError";
  }
}

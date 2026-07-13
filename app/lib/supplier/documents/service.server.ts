import { and, asc, desc, eq, inArray, max, ne, or, sql } from "drizzle-orm";

import { createAuth, type AuthEnvironment } from "../../auth/create-auth.server";
import {
  StaffAuthorizationError,
  requireStaffPermission,
} from "../../authorization/platform-staff.server";
import { launchSupplierTypeKeys, type LaunchSupplierTypeKey } from "../catalogue";
import { membershipCanEditSupplierProfile } from "../profile";
import { validateEvidenceFile } from "../../business-identity/evidence";
import type { Database } from "../../db/client.server";
import { withDatabase } from "../../db/client.server";
import {
  auditLogs,
  supplierCompanies,
  supplierCompanyDocuments,
  supplierCompanyDocumentTypes,
  supplierDocumentAccessGrants,
  supplierDocumentRequirementRules,
  supplierDocumentReviewEvents,
  supplierMemberships,
  supplierCompanyTypes,
  type PlatformStaffRole,
  type SupplierDocumentEvidenceStatus,
  type SupplierDocumentReviewDecision,
  type SupplierDocumentScanStatus,
  type SupplierDocumentStorageStatus,
  type SupplierMembershipRole,
  type SupplierWorkspaceStatus,
} from "../../db/schema";
import {
  deriveSupplierDocumentState,
  resolveSupplierDocumentRequirements,
  validateSupplierDocumentMetadata,
  validatedSupplierDocumentReason,
  type SupplierDocumentDerivedState,
} from "./policy";

export type SupplierDocumentEnvironment = AuthEnvironment & {
  PRIVATE_DOCUMENTS: R2Bucket;
};

export type SupplierDocumentSummary = {
  id: string;
  companyId: string;
  documentTypeKey: string;
  version: number;
  replacesDocumentId: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string | null;
  storageStatus: SupplierDocumentStorageStatus;
  evidenceStatus: SupplierDocumentEvidenceStatus;
  scanStatus: SupplierDocumentScanStatus;
  scanNote: string | null;
  issueDate: Date | null;
  expiresAt: Date | null;
  publicVisible: boolean;
  retentionUntil: Date | null;
  storedAt: Date | null;
  submittedAt: Date | null;
  createdAt: Date;
  derivedState: SupplierDocumentDerivedState;
};

export type SupplierDocumentRequirementSummary = {
  documentTypeKey: string;
  labelTr: string;
  labelEn: string;
  descriptionTr: string;
  descriptionEn: string;
  publicEligible: boolean;
  expiryExpected: boolean;
  level: "mandatory" | "conditional" | "optional";
  noteTr: string;
  noteEn: string;
  documents: SupplierDocumentSummary[];
  currentState: SupplierDocumentDerivedState;
  satisfied: boolean;
};

export type SupplierDocumentWorkspace = {
  company: { id: string; legalName: string; status: SupplierWorkspaceStatus };
  membershipRole: SupplierMembershipRole;
  canEdit: boolean;
  supplierTypeKeys: string[];
  requirements: SupplierDocumentRequirementSummary[];
};

export class SupplierDocumentActionError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "COMPANY_NOT_FOUND"
      | "FORBIDDEN"
      | "DOCUMENT_TYPE_NOT_FOUND"
      | "DOCUMENT_NOT_FOUND"
      | "REPLACEMENT_INVALID"
      | "SCAN_PENDING"
      | "SCAN_FAILED"
      | "INVALID_TRANSITION"
      | "PUBLIC_VISIBILITY_FORBIDDEN"
      | "ACCESS_GRANT_INVALID",
    message: string,
  ) {
    super(message);
    this.name = "SupplierDocumentActionError";
  }
}

function requestId(request: Request): string | undefined {
  return request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined;
}

async function currentSession(database: Database, env: AuthEnvironment, request: Request) {
  return createAuth(database, env).api.getSession({ headers: request.headers });
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function randomToken(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function extensionForMime(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/jpeg") return "jpg";
  return "png";
}

async function activeMembership(database: Database, userId: string, companyId?: string) {
  const conditions = [
    eq(supplierMemberships.userId, userId),
    eq(supplierMemberships.status, "active"),
  ];
  if (companyId) conditions.push(eq(supplierMemberships.companyId, companyId));
  const [membership] = await database
    .select({
      companyId: supplierMemberships.companyId,
      role: supplierMemberships.role,
      legalName: supplierCompanies.legalName,
      companyStatus: supplierCompanies.status,
    })
    .from(supplierMemberships)
    .innerJoin(supplierCompanies, eq(supplierCompanies.id, supplierMemberships.companyId))
    .where(and(...conditions))
    .orderBy(asc(supplierMemberships.assignedAt), asc(supplierMemberships.id))
    .limit(1);
  return membership ?? null;
}

async function requireSupplierMembership(
  database: Database,
  env: AuthEnvironment,
  request: Request,
  companyId: string,
) {
  const session = await currentSession(database, env, request);
  if (!session) {
    throw new SupplierDocumentActionError("UNAUTHENTICATED", "Authentication is required.");
  }
  const membership = await activeMembership(database, session.user.id, companyId);
  if (!membership) {
    throw new SupplierDocumentActionError(
      "COMPANY_NOT_FOUND",
      "Supplier company was not found for the current account.",
    );
  }
  return { session, membership };
}

async function companySupplierTypeKeys(
  database: Database,
  companyId: string,
): Promise<LaunchSupplierTypeKey[]> {
  const rows = await database
    .select({ key: supplierCompanyTypes.supplierTypeKey })
    .from(supplierCompanyTypes)
    .where(eq(supplierCompanyTypes.companyId, companyId))
    .orderBy(asc(supplierCompanyTypes.supplierTypeKey));
  return rows
    .map((row) => row.key)
    .filter((key): key is LaunchSupplierTypeKey =>
      launchSupplierTypeKeys.includes(key as LaunchSupplierTypeKey),
    );
}

function documentProjection(row: {
  id: string;
  companyId: string;
  documentTypeKey: string;
  version: number;
  replacesDocumentId: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string | null;
  storageStatus: SupplierDocumentStorageStatus;
  evidenceStatus: SupplierDocumentEvidenceStatus;
  scanStatus: SupplierDocumentScanStatus;
  scanNote: string | null;
  issueDate: Date | null;
  expiresAt: Date | null;
  publicVisible: boolean;
  retentionUntil: Date | null;
  storedAt: Date | null;
  submittedAt: Date | null;
  createdAt: Date;
}): SupplierDocumentSummary {
  return {
    ...row,
    derivedState: deriveSupplierDocumentState({
      storageStatus: row.storageStatus,
      evidenceStatus: row.evidenceStatus,
      scanStatus: row.scanStatus,
      expiresAt: row.expiresAt,
    }),
  };
}

async function companyDocuments(
  database: Database,
  companyId: string,
): Promise<SupplierDocumentSummary[]> {
  const rows = await database
    .select({
      id: supplierCompanyDocuments.id,
      companyId: supplierCompanyDocuments.companyId,
      documentTypeKey: supplierCompanyDocuments.documentTypeKey,
      version: supplierCompanyDocuments.version,
      replacesDocumentId: supplierCompanyDocuments.replacesDocumentId,
      originalFilename: supplierCompanyDocuments.originalFilename,
      mimeType: supplierCompanyDocuments.mimeType,
      sizeBytes: supplierCompanyDocuments.sizeBytes,
      sha256: supplierCompanyDocuments.sha256,
      storageStatus: supplierCompanyDocuments.storageStatus,
      evidenceStatus: supplierCompanyDocuments.evidenceStatus,
      scanStatus: supplierCompanyDocuments.scanStatus,
      scanNote: supplierCompanyDocuments.scanNote,
      issueDate: supplierCompanyDocuments.issueDate,
      expiresAt: supplierCompanyDocuments.expiresAt,
      publicVisible: supplierCompanyDocuments.publicVisible,
      retentionUntil: supplierCompanyDocuments.retentionUntil,
      storedAt: supplierCompanyDocuments.storedAt,
      submittedAt: supplierCompanyDocuments.submittedAt,
      createdAt: supplierCompanyDocuments.createdAt,
    })
    .from(supplierCompanyDocuments)
    .where(
      and(
        eq(supplierCompanyDocuments.companyId, companyId),
        ne(supplierCompanyDocuments.storageStatus, "removed"),
      ),
    )
    .orderBy(asc(supplierCompanyDocuments.documentTypeKey), desc(supplierCompanyDocuments.version));
  return rows.map(documentProjection);
}

export async function loadSupplierDocumentWorkspace(
  env: SupplierDocumentEnvironment,
  request: Request,
  companyId?: string,
): Promise<SupplierDocumentWorkspace | null> {
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;
    const membership = await activeMembership(database, session.user.id, companyId);
    if (!membership) return null;

    const [supplierTypeKeys, documents, typeRows, ruleRows] = await Promise.all([
      companySupplierTypeKeys(database, membership.companyId),
      companyDocuments(database, membership.companyId),
      database
        .select()
        .from(supplierCompanyDocumentTypes)
        .where(eq(supplierCompanyDocumentTypes.active, true)),
      database
        .select()
        .from(supplierDocumentRequirementRules)
        .where(eq(supplierDocumentRequirementRules.active, true)),
    ]);

    const codeResolved = resolveSupplierDocumentRequirements(supplierTypeKeys);
    const typeByKey = new Map(typeRows.map((row) => [row.key, row]));
    const activeRuleKeys = new Set(ruleRows.map((row) => row.key));
    const requirements = codeResolved
      .filter((requirement) => requirement.sourceRuleKeys.every((key) => activeRuleKeys.has(key)))
      .map((requirement): SupplierDocumentRequirementSummary | null => {
        const type = typeByKey.get(requirement.documentTypeKey);
        if (!type) return null;
        const matching = documents.filter(
          (document) => document.documentTypeKey === requirement.documentTypeKey,
        );
        const currentState = matching[0]?.derivedState ?? "missing";
        const approvedEvidenceRemains = matching.some(
          (document) => document.derivedState === "approved",
        );
        return {
          documentTypeKey: requirement.documentTypeKey,
          labelTr: type.labelTr,
          labelEn: type.labelEn,
          descriptionTr: type.descriptionTr,
          descriptionEn: type.descriptionEn,
          publicEligible: type.publicEligible,
          expiryExpected: type.expiryExpected,
          level: requirement.level,
          noteTr: requirement.noteTr,
          noteEn: requirement.noteEn,
          documents: matching,
          currentState,
          satisfied: requirement.level !== "mandatory" || approvedEvidenceRemains,
        };
      })
      .filter(
        (requirement): requirement is SupplierDocumentRequirementSummary => requirement !== null,
      );

    return {
      company: {
        id: membership.companyId,
        legalName: membership.legalName,
        status: membership.companyStatus,
      },
      membershipRole: membership.role,
      canEdit: membershipCanEditSupplierProfile(membership.role),
      supplierTypeKeys,
      requirements,
    };
  });
}

export async function uploadSupplierCompanyDocument(
  env: SupplierDocumentEnvironment,
  request: Request,
  input: {
    companyId: string;
    documentTypeKey: string;
    file: File;
    issueDate?: Date | null;
    expiresAt?: Date | null;
    retentionUntil?: Date | null;
    replacesDocumentId?: string | null;
  },
): Promise<SupplierDocumentSummary> {
  const validatedFile = validateEvidenceFile({
    name: input.file.name,
    type: input.file.type,
    size: input.file.size,
  });
  const validatedMetadata = validateSupplierDocumentMetadata(input);
  await withDatabase(env, async (database) => {
    const { membership } = await requireSupplierMembership(database, env, request, input.companyId);
    if (!membershipCanEditSupplierProfile(membership.role)) {
      throw new SupplierDocumentActionError(
        "FORBIDDEN",
        "The current membership cannot upload Supplier company documents.",
      );
    }
  });
  const bytes = await input.file.arrayBuffer();
  const sha256 = await sha256Hex(bytes);
  const documentId = crypto.randomUUID();
  const now = new Date();
  const extension = extensionForMime(validatedFile.mimeType);

  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const { session, membership } = await requireSupplierMembership(
        scoped,
        env,
        request,
        input.companyId,
      );
      if (!membershipCanEditSupplierProfile(membership.role)) {
        throw new SupplierDocumentActionError(
          "FORBIDDEN",
          "The current membership cannot upload Supplier company documents.",
        );
      }

      const [documentType] = await scoped
        .select({ key: supplierCompanyDocumentTypes.key })
        .from(supplierCompanyDocumentTypes)
        .where(
          and(
            eq(supplierCompanyDocumentTypes.key, validatedMetadata.documentTypeKey),
            eq(supplierCompanyDocumentTypes.active, true),
          ),
        )
        .limit(1);
      if (!documentType) {
        throw new SupplierDocumentActionError(
          "DOCUMENT_TYPE_NOT_FOUND",
          "Document type is not active in the Supplier catalogue.",
        );
      }

      let replaces: { id: string; documentTypeKey: string; version: number } | null = null;
      if (input.replacesDocumentId) {
        const [row] = await scoped
          .select({
            id: supplierCompanyDocuments.id,
            documentTypeKey: supplierCompanyDocuments.documentTypeKey,
            version: supplierCompanyDocuments.version,
          })
          .from(supplierCompanyDocuments)
          .where(
            and(
              eq(supplierCompanyDocuments.id, input.replacesDocumentId),
              eq(supplierCompanyDocuments.companyId, input.companyId),
            ),
          )
          .limit(1)
          .for("update");
        replaces = row ?? null;
        if (!replaces || replaces.documentTypeKey !== validatedMetadata.documentTypeKey) {
          throw new SupplierDocumentActionError(
            "REPLACEMENT_INVALID",
            "Replacement must reference a document of the same company and type.",
          );
        }
      }

      const [versionRow] = await scoped
        .select({ value: max(supplierCompanyDocuments.version) })
        .from(supplierCompanyDocuments)
        .where(
          and(
            eq(supplierCompanyDocuments.companyId, input.companyId),
            eq(supplierCompanyDocuments.documentTypeKey, validatedMetadata.documentTypeKey),
          ),
        );
      const latestVersion = versionRow?.value ?? 0;
      if (replaces && replaces.version !== latestVersion) {
        throw new SupplierDocumentActionError(
          "REPLACEMENT_INVALID",
          "Replacement must reference the latest document version.",
        );
      }
      const version = latestVersion + 1;
      const typeSegment = validatedMetadata.documentTypeKey.replace(/^company_document\./, "");
      const objectKey = `supplier-company/${input.companyId}/${typeSegment}/${documentId}/v${version}.${extension}`;

      const [inserted] = await scoped
        .insert(supplierCompanyDocuments)
        .values({
          id: documentId,
          companyId: input.companyId,
          documentTypeKey: validatedMetadata.documentTypeKey,
          replacesDocumentId: replaces?.id ?? null,
          version,
          originalFilename: validatedFile.filename,
          mimeType: validatedFile.mimeType,
          sizeBytes: validatedFile.sizeBytes,
          sha256: null,
          objectKey,
          storageStatus: "uploading",
          evidenceStatus: "uploaded",
          scanStatus: "pending",
          issueDate: validatedMetadata.issueDate,
          expiresAt: validatedMetadata.expiresAt,
          retentionUntil: input.retentionUntil ?? null,
          uploadedBy: session.user.id,
          updatedAt: now,
        })
        .returning();

      try {
        await env.PRIVATE_DOCUMENTS.put(objectKey, bytes, {
          httpMetadata: { contentType: validatedFile.mimeType },
          customMetadata: {
            documentId,
            companyId: input.companyId,
            documentTypeKey: validatedMetadata.documentTypeKey,
            sha256,
          },
        });
      } catch (error) {
        await scoped
          .update(supplierCompanyDocuments)
          .set({
            storageStatus: "failed",
            scanStatus: "failed",
            scanNote: "Private object storage failed",
            failureReason: "Private object storage failed",
            updatedAt: new Date(),
          })
          .where(eq(supplierCompanyDocuments.id, documentId));
        throw error;
      }

      const storedAt = new Date();
      const [stored] = await scoped
        .update(supplierCompanyDocuments)
        .set({ storageStatus: "stored_private", sha256, storedAt, updatedAt: storedAt })
        .where(eq(supplierCompanyDocuments.id, documentId))
        .returning();
      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole: `supplier_${membership.role}`,
        resourceType: "supplier_company_document",
        resourceId: documentId,
        action: "supplier.document.stored_private",
        newValue: {
          companyId: input.companyId,
          documentTypeKey: validatedMetadata.documentTypeKey,
          version,
          sha256,
          storageStatus: "stored_private",
        },
        reason: replaces
          ? "Supplier member uploaded a replacement document version"
          : "Supplier member uploaded a private company document",
        requestId: requestId(request),
      });
      return documentProjection(stored!);
    }),
  );
}

export async function recordSupplierDocumentScanResult(
  database: Database,
  input: {
    documentId: string;
    result: "clean" | "rejected" | "failed";
    note?: string;
    now?: Date;
  },
): Promise<void> {
  const now = input.now ?? new Date();
  const note = input.note?.trim() || null;
  if ((input.result === "rejected" || input.result === "failed") && (!note || note.length < 3)) {
    throw new SupplierDocumentActionError(
      "SCAN_FAILED",
      "Rejected or failed scan results require a reason.",
    );
  }

  return database.transaction(async (transaction) => {
    const scoped = transaction as unknown as Database;
    const [current] = await scoped
      .select({
        storageStatus: supplierCompanyDocuments.storageStatus,
        evidenceStatus: supplierCompanyDocuments.evidenceStatus,
        scanStatus: supplierCompanyDocuments.scanStatus,
      })
      .from(supplierCompanyDocuments)
      .where(eq(supplierCompanyDocuments.id, input.documentId))
      .limit(1)
      .for("update");
    if (!current) {
      throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
    }
    if (current.storageStatus !== "stored_private" || current.evidenceStatus !== "uploaded") {
      throw new SupplierDocumentActionError(
        "INVALID_TRANSITION",
        "Only newly stored document versions may receive a scan result.",
      );
    }

    const evidenceStatus = input.result === "rejected" ? "replacement_required" : "uploaded";
    await scoped
      .update(supplierCompanyDocuments)
      .set({
        scanStatus: input.result,
        scanNote: input.result === "clean" ? null : note,
        evidenceStatus,
        submittedAt: input.result === "rejected" ? now : null,
        publicVisible: false,
        updatedAt: now,
      })
      .where(eq(supplierCompanyDocuments.id, input.documentId));
    await scoped.insert(auditLogs).values({
      actorId: null,
      effectiveRole: "document_scanner",
      resourceType: "supplier_company_document",
      resourceId: input.documentId,
      action: `supplier.document.scan_${input.result}`,
      oldValue: {
        scanStatus: current.scanStatus,
        evidenceStatus: current.evidenceStatus,
      },
      newValue: { scanStatus: input.result, evidenceStatus },
      reason: note ?? "Automated document scan completed",
    });
  });
}

export async function submitSupplierCompanyDocumentForReview(
  env: SupplierDocumentEnvironment,
  request: Request,
  documentId: string,
): Promise<void> {
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new SupplierDocumentActionError("UNAUTHENTICATED", "Authentication is required.");
      }
      const [document] = await scoped
        .select({
          companyId: supplierCompanyDocuments.companyId,
          storageStatus: supplierCompanyDocuments.storageStatus,
          evidenceStatus: supplierCompanyDocuments.evidenceStatus,
          scanStatus: supplierCompanyDocuments.scanStatus,
        })
        .from(supplierCompanyDocuments)
        .where(eq(supplierCompanyDocuments.id, documentId))
        .limit(1)
        .for("update");
      if (!document) {
        throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
      }
      const membership = await activeMembership(scoped, session.user.id, document.companyId);
      if (!membership || !membershipCanEditSupplierProfile(membership.role)) {
        throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
      }
      if (document.storageStatus !== "stored_private") {
        throw new SupplierDocumentActionError(
          "INVALID_TRANSITION",
          "Only privately stored documents may enter review.",
        );
      }
      if (document.scanStatus === "pending") {
        throw new SupplierDocumentActionError("SCAN_PENDING", "Document scanning is not complete.");
      }
      if (document.scanStatus !== "clean") {
        throw new SupplierDocumentActionError(
          "SCAN_FAILED",
          "Document did not pass content scanning.",
        );
      }
      if (document.evidenceStatus !== "uploaded") {
        throw new SupplierDocumentActionError(
          "INVALID_TRANSITION",
          "Document is not in a submittable state.",
        );
      }
      const now = new Date();
      await scoped
        .update(supplierCompanyDocuments)
        .set({
          evidenceStatus: "pending_review",
          submittedAt: now,
          publicVisible: false,
          updatedAt: now,
        })
        .where(eq(supplierCompanyDocuments.id, documentId));
      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole: `supplier_${membership.role}`,
        resourceType: "supplier_company_document",
        resourceId: documentId,
        action: "supplier.document.submitted_for_review",
        oldValue: { evidenceStatus: document.evidenceStatus },
        newValue: { evidenceStatus: "pending_review" },
        reason: "Authorized Supplier member submitted a clean private document for review",
        requestId: requestId(request),
      });
    }),
  );
}

export async function decideSupplierCompanyDocument(
  env: SupplierDocumentEnvironment,
  request: Request,
  input: {
    documentId: string;
    decision: SupplierDocumentReviewDecision;
    reason?: string;
    reviewNote?: string | null;
  },
): Promise<void> {
  const reason =
    input.decision === "approved"
      ? input.reason?.trim()
        ? validatedSupplierDocumentReason(input.reason)
        : null
      : validatedSupplierDocumentReason(input.reason ?? "");
  const reviewNote = input.reviewNote?.trim() || null;
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new StaffAuthorizationError("UNAUTHENTICATED", "Authentication is required.");
      }
      const actorRole = await requireStaffPermission(
        scoped,
        session.user.id,
        "supplier_document.review.decide",
      );
      const [document] = await scoped
        .select({
          companyId: supplierCompanyDocuments.companyId,
          uploadedBy: supplierCompanyDocuments.uploadedBy,
          evidenceStatus: supplierCompanyDocuments.evidenceStatus,
          documentTypeKey: supplierCompanyDocuments.documentTypeKey,
          publicVisible: supplierCompanyDocuments.publicVisible,
        })
        .from(supplierCompanyDocuments)
        .where(eq(supplierCompanyDocuments.id, input.documentId))
        .limit(1)
        .for("update");
      if (!document) {
        throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
      }
      const reviewerMembership = await activeMembership(
        scoped,
        session.user.id,
        document.companyId,
      );
      if (document.uploadedBy === session.user.id || reviewerMembership) {
        throw new StaffAuthorizationError(
          "SELF_REVIEW",
          "Staff cannot decide a company document for a company they belong to.",
        );
      }
      if (document.evidenceStatus !== "pending_review") {
        throw new SupplierDocumentActionError(
          "INVALID_TRANSITION",
          "Only pending documents may be decided.",
        );
      }
      const [type] = await scoped
        .select({ publicEligible: supplierCompanyDocumentTypes.publicEligible })
        .from(supplierCompanyDocumentTypes)
        .where(eq(supplierCompanyDocumentTypes.key, document.documentTypeKey))
        .limit(1);
      const now = new Date();
      const statusByDecision: Record<
        SupplierDocumentReviewDecision,
        SupplierDocumentEvidenceStatus
      > = {
        approved: "approved",
        rejected: "rejected",
        replacement_required: "replacement_required",
      };
      const nextStatus = statusByDecision[input.decision];
      await scoped
        .update(supplierCompanyDocuments)
        .set({
          evidenceStatus: nextStatus,
          publicVisible:
            input.decision === "approved" && type?.publicEligible ? document.publicVisible : false,
          updatedAt: now,
        })
        .where(eq(supplierCompanyDocuments.id, input.documentId));
      await scoped.insert(supplierDocumentReviewEvents).values({
        documentId: input.documentId,
        decision: input.decision,
        reason,
        reviewNote,
        reviewerId: session.user.id,
        effectiveRole: actorRole as PlatformStaffRole,
        createdAt: now,
      });
      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole: actorRole,
        resourceType: "supplier_company_document",
        resourceId: input.documentId,
        action: `supplier.document.${input.decision}`,
        oldValue: { evidenceStatus: document.evidenceStatus },
        newValue: { evidenceStatus: nextStatus },
        reason,
        requestId: requestId(request),
      });
    }),
  );
}

export async function setSupplierDocumentPublicVisibility(
  env: SupplierDocumentEnvironment,
  request: Request,
  input: { documentId: string; visible: boolean },
): Promise<void> {
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new SupplierDocumentActionError("UNAUTHENTICATED", "Authentication is required.");
      }
      const [document] = await scoped
        .select({
          companyId: supplierCompanyDocuments.companyId,
          documentTypeKey: supplierCompanyDocuments.documentTypeKey,
          evidenceStatus: supplierCompanyDocuments.evidenceStatus,
          publicVisible: supplierCompanyDocuments.publicVisible,
        })
        .from(supplierCompanyDocuments)
        .where(eq(supplierCompanyDocuments.id, input.documentId))
        .limit(1)
        .for("update");
      if (!document) {
        throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
      }
      const membership = await activeMembership(scoped, session.user.id, document.companyId);
      if (!membership || !membershipCanEditSupplierProfile(membership.role)) {
        throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
      }
      const [type] = await scoped
        .select({ publicEligible: supplierCompanyDocumentTypes.publicEligible })
        .from(supplierCompanyDocumentTypes)
        .where(eq(supplierCompanyDocumentTypes.key, document.documentTypeKey))
        .limit(1);
      if (input.visible && (document.evidenceStatus !== "approved" || !type?.publicEligible)) {
        throw new SupplierDocumentActionError(
          "PUBLIC_VISIBILITY_FORBIDDEN",
          "Only approved public-eligible document types may be visible publicly.",
        );
      }
      await scoped
        .update(supplierCompanyDocuments)
        .set({ publicVisible: input.visible, updatedAt: new Date() })
        .where(eq(supplierCompanyDocuments.id, input.documentId));
      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole: `supplier_${membership.role}`,
        resourceType: "supplier_company_document",
        resourceId: input.documentId,
        action: "supplier.document.public_visibility_changed",
        oldValue: { publicVisible: document.publicVisible },
        newValue: { publicVisible: input.visible },
        reason: input.visible
          ? "Supplier exposed approved public-eligible evidence"
          : "Supplier hid public evidence",
        requestId: requestId(request),
      });
    }),
  );
}

async function readableDocument(
  database: Database,
  env: SupplierDocumentEnvironment,
  request: Request,
  documentId: string,
) {
  const session = await currentSession(database, env, request);
  if (!session) {
    throw new SupplierDocumentActionError("UNAUTHENTICATED", "Authentication is required.");
  }
  const [document] = await database
    .select({
      id: supplierCompanyDocuments.id,
      companyId: supplierCompanyDocuments.companyId,
      objectKey: supplierCompanyDocuments.objectKey,
      originalFilename: supplierCompanyDocuments.originalFilename,
      mimeType: supplierCompanyDocuments.mimeType,
      storageStatus: supplierCompanyDocuments.storageStatus,
      evidenceStatus: supplierCompanyDocuments.evidenceStatus,
    })
    .from(supplierCompanyDocuments)
    .where(eq(supplierCompanyDocuments.id, documentId))
    .limit(1);
  if (!document || document.storageStatus !== "stored_private") {
    throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
  }
  const membership = await activeMembership(database, session.user.id, document.companyId);
  if (membership) return { session, document, effectiveRole: `supplier_${membership.role}` };
  try {
    const staffRole = await requireStaffPermission(
      database,
      session.user.id,
      "supplier_document.file.read",
    );
    return { session, document, effectiveRole: staffRole };
  } catch (error) {
    if (error instanceof StaffAuthorizationError && error.code === "FORBIDDEN") {
      throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
    }
    throw error;
  }
}

export async function createSupplierDocumentAccessGrant(
  env: SupplierDocumentEnvironment,
  request: Request,
  documentId: string,
  ttlSeconds = 300,
): Promise<{ token: string; expiresAt: Date }> {
  const token = await randomToken();
  const tokenHash = await sha256Hex(new TextEncoder().encode(token).buffer as ArrayBuffer);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.max(30, Math.min(ttlSeconds, 600)) * 1000);
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const { session, document, effectiveRole } = await readableDocument(
        scoped,
        env,
        request,
        documentId,
      );
      await scoped.insert(supplierDocumentAccessGrants).values({
        documentId,
        issuedTo: session.user.id,
        tokenHash,
        expiresAt,
      });
      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole,
        resourceType: "supplier_company_document",
        resourceId: document.id,
        action: "supplier.document.access_granted",
        newValue: { expiresAt },
        reason: "Authorized private document access grant created",
        requestId: requestId(request),
      });
      return { token, expiresAt };
    }),
  );
}

export async function downloadSupplierDocumentWithGrant(
  env: SupplierDocumentEnvironment,
  request: Request,
  token: string,
): Promise<Response> {
  const tokenHash = await sha256Hex(new TextEncoder().encode(token).buffer as ArrayBuffer);
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) {
      throw new SupplierDocumentActionError("UNAUTHENTICATED", "Authentication is required.");
    }
    const [grant] = await database
      .select({
        documentId: supplierDocumentAccessGrants.documentId,
        expiresAt: supplierDocumentAccessGrants.expiresAt,
        issuedTo: supplierDocumentAccessGrants.issuedTo,
        revokedAt: supplierDocumentAccessGrants.revokedAt,
        lastAccessedAt: supplierDocumentAccessGrants.lastAccessedAt,
      })
      .from(supplierDocumentAccessGrants)
      .where(eq(supplierDocumentAccessGrants.tokenHash, tokenHash))
      .limit(1)
      .for("update");
    if (
      !grant ||
      grant.issuedTo !== session.user.id ||
      grant.revokedAt ||
      grant.expiresAt <= new Date()
    ) {
      throw new SupplierDocumentActionError(
        "ACCESS_GRANT_INVALID",
        "Document access grant is invalid.",
      );
    }
    const { document } = await readableDocument(database, env, request, grant.documentId);
    const object = await env.PRIVATE_DOCUMENTS.get(document.objectKey);
    if (!object) {
      throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document object was not found.");
    }
    const usedAt = new Date();
    await database
      .update(supplierDocumentAccessGrants)
      .set({ revokedAt: usedAt, lastAccessedAt: usedAt })
      .where(eq(supplierDocumentAccessGrants.tokenHash, tokenHash));
    await database.insert(auditLogs).values({
      actorId: session.user.id,
      effectiveRole: "private_document_reader",
      resourceType: "supplier_company_document",
      resourceId: document.id,
      action: "supplier.document.downloaded",
      newValue: { usedAt },
      reason: "Authorized private Supplier document downloaded",
      requestId: requestId(request),
    });
    const headers = new Headers({
      "content-type": document.mimeType,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.originalFilename)}`,
      "cache-control": "private, no-store, max-age=0",
      pragma: "no-cache",
      expires: "0",
    });
    return new Response(object.body, { status: 200, headers });
  });
}

export async function loadSupplierDocumentReviewQueue(
  env: SupplierDocumentEnvironment,
  request: Request,
): Promise<{
  actor: { id: string; role: PlatformStaffRole };
  documents: Array<
    SupplierDocumentSummary & {
      companyName: string;
      uploadedBy: string;
    }
  >;
} | null> {
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;
    const actorRole = await requireStaffPermission(
      database,
      session.user.id,
      "supplier_document.review.list",
    );
    const rows = await database
      .select({
        id: supplierCompanyDocuments.id,
        companyId: supplierCompanyDocuments.companyId,
        documentTypeKey: supplierCompanyDocuments.documentTypeKey,
        version: supplierCompanyDocuments.version,
        replacesDocumentId: supplierCompanyDocuments.replacesDocumentId,
        originalFilename: supplierCompanyDocuments.originalFilename,
        mimeType: supplierCompanyDocuments.mimeType,
        sizeBytes: supplierCompanyDocuments.sizeBytes,
        sha256: supplierCompanyDocuments.sha256,
        storageStatus: supplierCompanyDocuments.storageStatus,
        evidenceStatus: supplierCompanyDocuments.evidenceStatus,
        scanStatus: supplierCompanyDocuments.scanStatus,
        scanNote: supplierCompanyDocuments.scanNote,
        issueDate: supplierCompanyDocuments.issueDate,
        expiresAt: supplierCompanyDocuments.expiresAt,
        publicVisible: supplierCompanyDocuments.publicVisible,
        retentionUntil: supplierCompanyDocuments.retentionUntil,
        storedAt: supplierCompanyDocuments.storedAt,
        submittedAt: supplierCompanyDocuments.submittedAt,
        createdAt: supplierCompanyDocuments.createdAt,
        companyName: supplierCompanies.legalName,
        uploadedBy: supplierCompanyDocuments.uploadedBy,
      })
      .from(supplierCompanyDocuments)
      .innerJoin(supplierCompanies, eq(supplierCompanies.id, supplierCompanyDocuments.companyId))
      .where(eq(supplierCompanyDocuments.evidenceStatus, "pending_review"))
      .orderBy(asc(supplierCompanyDocuments.submittedAt), asc(supplierCompanyDocuments.id));
    return {
      actor: { id: session.user.id, role: actorRole as PlatformStaffRole },
      documents: rows.map((row) => ({
        ...documentProjection(row),
        companyName: row.companyName,
        uploadedBy: row.uploadedBy,
      })),
    };
  });
}

export async function loadSupplierDocumentReviewDetail(
  env: SupplierDocumentEnvironment,
  request: Request,
  documentId: string,
): Promise<{
  actor: { id: string; role: PlatformStaffRole };
  document: SupplierDocumentSummary & { companyName: string; uploadedBy: string };
  timeline: Array<{
    id: string;
    decision: SupplierDocumentReviewDecision;
    reason: string | null;
    reviewNote: string | null;
    reviewerId: string;
    effectiveRole: PlatformStaffRole;
    createdAt: Date;
  }>;
} | null> {
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;
    const actorRole = await requireStaffPermission(
      database,
      session.user.id,
      "supplier_document.review.read",
    );
    const [row] = await database
      .select({
        id: supplierCompanyDocuments.id,
        companyId: supplierCompanyDocuments.companyId,
        documentTypeKey: supplierCompanyDocuments.documentTypeKey,
        version: supplierCompanyDocuments.version,
        replacesDocumentId: supplierCompanyDocuments.replacesDocumentId,
        originalFilename: supplierCompanyDocuments.originalFilename,
        mimeType: supplierCompanyDocuments.mimeType,
        sizeBytes: supplierCompanyDocuments.sizeBytes,
        sha256: supplierCompanyDocuments.sha256,
        storageStatus: supplierCompanyDocuments.storageStatus,
        evidenceStatus: supplierCompanyDocuments.evidenceStatus,
        scanStatus: supplierCompanyDocuments.scanStatus,
        scanNote: supplierCompanyDocuments.scanNote,
        issueDate: supplierCompanyDocuments.issueDate,
        expiresAt: supplierCompanyDocuments.expiresAt,
        publicVisible: supplierCompanyDocuments.publicVisible,
        retentionUntil: supplierCompanyDocuments.retentionUntil,
        storedAt: supplierCompanyDocuments.storedAt,
        submittedAt: supplierCompanyDocuments.submittedAt,
        createdAt: supplierCompanyDocuments.createdAt,
        companyName: supplierCompanies.legalName,
        uploadedBy: supplierCompanyDocuments.uploadedBy,
      })
      .from(supplierCompanyDocuments)
      .innerJoin(supplierCompanies, eq(supplierCompanies.id, supplierCompanyDocuments.companyId))
      .where(eq(supplierCompanyDocuments.id, documentId))
      .limit(1);
    if (!row) return null;
    const timeline = await database
      .select({
        id: supplierDocumentReviewEvents.id,
        decision: supplierDocumentReviewEvents.decision,
        reason: supplierDocumentReviewEvents.reason,
        reviewNote: supplierDocumentReviewEvents.reviewNote,
        reviewerId: supplierDocumentReviewEvents.reviewerId,
        effectiveRole: supplierDocumentReviewEvents.effectiveRole,
        createdAt: supplierDocumentReviewEvents.createdAt,
      })
      .from(supplierDocumentReviewEvents)
      .where(eq(supplierDocumentReviewEvents.documentId, documentId))
      .orderBy(asc(supplierDocumentReviewEvents.createdAt), asc(supplierDocumentReviewEvents.id));
    return {
      actor: { id: session.user.id, role: actorRole as PlatformStaffRole },
      document: {
        ...documentProjection(row),
        companyName: row.companyName,
        uploadedBy: row.uploadedBy,
      },
      timeline,
    };
  });
}

export async function purgeExpiredSupplierDocumentAccessGrants(
  database: Database,
  now = new Date(),
): Promise<number> {
  const result = await database
    .delete(supplierDocumentAccessGrants)
    .where(
      or(
        sql`${supplierDocumentAccessGrants.expiresAt} <= ${now}`,
        sql`${supplierDocumentAccessGrants.revokedAt} is not null`,
      ),
    )
    .returning({ id: supplierDocumentAccessGrants.id });
  return result.length;
}

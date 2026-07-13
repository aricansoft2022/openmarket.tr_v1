import { and, asc, desc, eq, inArray, max, ne, or, sql } from "drizzle-orm";

import { requireStaffPermission, StaffAuthorizationError } from "../../authorization/platform-staff.server";
import { createAuth, type AuthEnvironment } from "../../auth/create-auth.server";
import { safeDownloadFilename } from "../../business-identity/evidence";
import type { Database } from "../../db/client.server";
import { withDatabase } from "../../db/client.server";
import {
  auditLogs,
  supplierCompanyDocuments,
  supplierCompanyDocumentTypes,
  supplierCompanyTypes,
  supplierDocumentAccessGrants,
  supplierDocumentRequirementRules,
  supplierDocumentReviewEvents,
  supplierMemberships,
  type PlatformStaffRole,
  type SupplierDocumentEvidenceStatus,
  type SupplierDocumentReviewDecision,
  type SupplierDocumentScanStatus,
  type SupplierMembershipRole,
} from "../../db/schema";
import { membershipCanEditSupplierProfile } from "../profile";
import type { LaunchSupplierTypeKey } from "../catalogue";
import {
  deriveSupplierDocumentState,
  resolveSupplierDocumentRequirements,
  supplierDocumentAccessGrantMinutes,
  validateSupplierDocumentFile,
  validateSupplierDocumentMetadata,
  validatedSupplierDocumentReason,
  type SupplierDocumentDerivedState,
} from "./policy";

export type SupplierDocumentEnvironment = AuthEnvironment & Pick<Env, "PRIVATE_DOCUMENTS">;

export class SupplierDocumentActionError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "SUPPLIER_COMPANY_NOT_FOUND"
      | "FORBIDDEN"
      | "DOCUMENT_NOT_FOUND"
      | "DOCUMENT_TYPE_UNKNOWN"
      | "REPLACEMENT_INVALID"
      | "STORAGE_FAILED"
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
  storageStatus: "uploading" | "stored_private" | "failed" | "removed";
  evidenceStatus: SupplierDocumentEvidenceStatus;
  derivedState: SupplierDocumentDerivedState;
  scanStatus: SupplierDocumentScanStatus;
  scanNote: string | null;
  issueDate: Date | null;
  expiresAt: Date | null;
  publicVisible: boolean;
  retentionUntil: Date | null;
  storedAt: Date | null;
  submittedAt: Date | null;
  createdAt: Date;
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
  company: { id: string; legalName: string; status: string };
  membershipRole: SupplierMembershipRole;
  canEdit: boolean;
  supplierTypeKeys: LaunchSupplierTypeKey[];
  requirements: SupplierDocumentRequirementSummary[];
};

function requestId(request: Request): string | undefined {
  return request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined;
}

async function currentSession(
  database: Database,
  env: SupplierDocumentEnvironment,
  request: Request,
) {
  const auth = createAuth(database, env);
  return auth.api.getSession({ headers: request.headers });
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function tokenHash(token: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(token).buffer as ArrayBuffer);
}

function randomAccessToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function activeMembership(
  database: Database,
  userId: string,
  companyId?: string,
): Promise<{
  companyId: string;
  role: SupplierMembershipRole;
  legalName: string;
  companyStatus: string;
} | null> {
  const where = companyId
    ? and(
        eq(supplierMemberships.userId, userId),
        eq(supplierMemberships.companyId, companyId),
        eq(supplierMemberships.status, "active"),
      )
    : and(eq(supplierMemberships.userId, userId), eq(supplierMemberships.status, "active"));

  const [row] = await database
    .select({
      companyId: supplierMemberships.companyId,
      role: supplierMemberships.role,
      legalName: sql<string>`supplier_companies.legal_name`,
      companyStatus: sql<string>`supplier_companies.status`,
    })
    .from(supplierMemberships)
    .innerJoin(
      sql`"supplier_companies"`,
      sql`"supplier_companies"."id" = ${supplierMemberships.companyId}`,
    )
    .where(where)
    .orderBy(asc(supplierMemberships.assignedAt), asc(supplierMemberships.id))
    .limit(1);

  return row ?? null;
}

async function requireSupplierMembership(
  database: Database,
  env: SupplierDocumentEnvironment,
  request: Request,
  companyId?: string,
) {
  const session = await currentSession(database, env, request);
  if (!session) {
    throw new SupplierDocumentActionError("UNAUTHENTICATED", "Authentication is required.");
  }
  const membership = await activeMembership(database, session.user.id, companyId);
  if (!membership) {
    throw new SupplierDocumentActionError(
      "SUPPLIER_COMPANY_NOT_FOUND",
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
  return rows.map((row) => row.key as LaunchSupplierTypeKey);
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
  storageStatus: "uploading" | "stored_private" | "failed" | "removed";
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
    .orderBy(
      asc(supplierCompanyDocuments.documentTypeKey),
      desc(supplierCompanyDocuments.version),
    );
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
      .map((requirement) => {
        const type = typeByKey.get(requirement.documentTypeKey);
        if (!type) return null;
        const matching = documents.filter(
          (document) => document.documentTypeKey === requirement.documentTypeKey,
        );
        const currentState = matching[0]?.derivedState ?? "missing";
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
          satisfied: requirement.level !== "mandatory" || currentState === "approved",
        } satisfies SupplierDocumentRequirementSummary;
      })
      .filter((requirement): requirement is SupplierDocumentRequirementSummary => Boolean(requirement));

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
    replacesDocumentId?: string | null;
    retentionUntil?: Date | null;
  },
): Promise<SupplierDocumentSummary> {
  const validatedFile = validateSupplierDocumentFile(input.file);
  const validatedMetadata = validateSupplierDocumentMetadata(input);
  const bytes = await input.file.arrayBuffer();
  const sha256 = await sha256Hex(bytes);
  const documentId = crypto.randomUUID();

  const reservation = await withDatabase(env, (database) =>
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
          "DOCUMENT_TYPE_UNKNOWN",
          "Document type is not active.",
        );
      }

      await scoped.execute(
        sql`select id from supplier_companies where id = ${membership.companyId} for update`,
      );

      let replaces: { id: string; documentTypeKey: string } | null = null;
      if (input.replacesDocumentId) {
        const [row] = await scoped
          .select({
            id: supplierCompanyDocuments.id,
            documentTypeKey: supplierCompanyDocuments.documentTypeKey,
          })
          .from(supplierCompanyDocuments)
          .where(
            and(
              eq(supplierCompanyDocuments.id, input.replacesDocumentId),
              eq(supplierCompanyDocuments.companyId, membership.companyId),
              ne(supplierCompanyDocuments.storageStatus, "removed"),
            ),
          )
          .limit(1);
        replaces = row ?? null;
        if (!replaces || replaces.documentTypeKey !== validatedMetadata.documentTypeKey) {
          throw new SupplierDocumentActionError(
            "REPLACEMENT_INVALID",
            "Replacement must reference an existing document of the same type and company.",
          );
        }
      }

      const [versionRow] = await scoped
        .select({ value: max(supplierCompanyDocuments.version) })
        .from(supplierCompanyDocuments)
        .where(
          and(
            eq(supplierCompanyDocuments.companyId, membership.companyId),
            eq(supplierCompanyDocuments.documentTypeKey, validatedMetadata.documentTypeKey),
          ),
        );
      const version = (versionRow?.value ?? 0) + 1;
      const typeSegment = validatedMetadata.documentTypeKey.replace("company_document.", "");
      const objectKey = `supplier-company/${membership.companyId}/${typeSegment}/${documentId}`;

      const [document] = await scoped
        .insert(supplierCompanyDocuments)
        .values({
          id: documentId,
          companyId: membership.companyId,
          documentTypeKey: validatedMetadata.documentTypeKey,
          version,
          replacesDocumentId: replaces?.id ?? null,
          uploadedBy: session.user.id,
          objectKey,
          originalFilename: validatedFile.filename,
          mimeType: validatedFile.mimeType,
          sizeBytes: validatedFile.sizeBytes,
          storageStatus: "uploading",
          evidenceStatus: "uploaded",
          scanStatus: "pending",
          issueDate: validatedMetadata.issueDate,
          expiresAt: validatedMetadata.expiresAt,
          retentionUntil: input.retentionUntil ?? null,
        })
        .returning({
          id: supplierCompanyDocuments.id,
          companyId: supplierCompanyDocuments.companyId,
          documentTypeKey: supplierCompanyDocuments.documentTypeKey,
          version: supplierCompanyDocuments.version,
          replacesDocumentId: supplierCompanyDocuments.replacesDocumentId,
          objectKey: supplierCompanyDocuments.objectKey,
          originalFilename: supplierCompanyDocuments.originalFilename,
          mimeType: supplierCompanyDocuments.mimeType,
          sizeBytes: supplierCompanyDocuments.sizeBytes,
          issueDate: supplierCompanyDocuments.issueDate,
          expiresAt: supplierCompanyDocuments.expiresAt,
          publicVisible: supplierCompanyDocuments.publicVisible,
          retentionUntil: supplierCompanyDocuments.retentionUntil,
          createdAt: supplierCompanyDocuments.createdAt,
        });

      return { ...document!, actorId: session.user.id, sha256 };
    }),
  );

  try {
    await env.PRIVATE_DOCUMENTS.put(reservation.objectKey, bytes, {
      httpMetadata: { contentType: reservation.mimeType },
      customMetadata: {
        documentId: reservation.id,
        companyId: reservation.companyId,
        documentTypeKey: reservation.documentTypeKey,
        sha256,
      },
    });
  } catch {
    await withDatabase(env, (database) =>
      database
        .update(supplierCompanyDocuments)
        .set({
          storageStatus: "failed",
          failureReason: "Private object storage write failed.",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(supplierCompanyDocuments.id, reservation.id),
            eq(supplierCompanyDocuments.storageStatus, "uploading"),
          ),
        ),
    );
    throw new SupplierDocumentActionError("STORAGE_FAILED", "Private document storage failed.");
  }

  try {
    return await withDatabase(env, (database) =>
      database.transaction(async (transaction) => {
        const scoped = transaction as unknown as Database;
        const now = new Date();
        const [stored] = await scoped
          .update(supplierCompanyDocuments)
          .set({
            storageStatus: "stored_private",
            sha256,
            storedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(supplierCompanyDocuments.id, reservation.id),
              eq(supplierCompanyDocuments.storageStatus, "uploading"),
            ),
          )
          .returning({
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
          });
        if (!stored) {
          throw new SupplierDocumentActionError(
            "STORAGE_FAILED",
            "Document reservation was not finalized.",
          );
        }

        await scoped.insert(auditLogs).values({
          actorId: reservation.actorId,
          effectiveRole: "supplier_member",
          resourceType: "supplier_company_document",
          resourceId: reservation.id,
          action: "supplier.document.stored_private",
          newValue: {
            companyId: reservation.companyId,
            documentTypeKey: reservation.documentTypeKey,
            version: reservation.version,
            replacesDocumentId: reservation.replacesDocumentId,
            mimeType: reservation.mimeType,
            sizeBytes: reservation.sizeBytes,
            sha256,
            scanStatus: "pending",
          },
          reason: "Authorized Supplier member stored a private company document",
          requestId: requestId(request),
        });

        return documentProjection(stored!);
      }),
    );
  } catch (error) {
    await env.PRIVATE_DOCUMENTS.delete(reservation.objectKey).catch(() => undefined);
    await withDatabase(env, (database) =>
      database
        .update(supplierCompanyDocuments)
        .set({
          storageStatus: "failed",
          failureReason: "Metadata finalization failed after object storage write.",
          updatedAt: new Date(),
        })
        .where(eq(supplierCompanyDocuments.id, reservation.id)),
    ).catch(() => undefined);
    throw error;
  }
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
  const [current] = await database
    .select({ scanStatus: supplierCompanyDocuments.scanStatus })
    .from(supplierCompanyDocuments)
    .where(eq(supplierCompanyDocuments.id, input.documentId))
    .limit(1)
    .for("update");
  if (!current) {
    throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
  }
  await database
    .update(supplierCompanyDocuments)
    .set({
      scanStatus: input.result,
      scanNote: input.result === "clean" ? null : note,
      evidenceStatus:
        input.result === "clean" ? "uploaded" : ("replacement_required" as const),
      submittedAt: input.result === "clean" ? null : now,
      publicVisible: false,
      updatedAt: now,
    })
    .where(eq(supplierCompanyDocuments.id, input.documentId));
  await database.insert(auditLogs).values({
    actorId: null,
    effectiveRole: "document_scanner",
    resourceType: "supplier_company_document",
    resourceId: input.documentId,
    action: `supplier.document.scan_${input.result}`,
    oldValue: { scanStatus: current.scanStatus },
    newValue: { scanStatus: input.result },
    reason: note ?? "Automated document scan completed",
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
      const { session, membership } = await requireSupplierMembership(scoped, env, request);
      if (!membershipCanEditSupplierProfile(membership.role)) {
        throw new SupplierDocumentActionError(
          "FORBIDDEN",
          "The current membership cannot submit Supplier company documents.",
        );
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
      if (!document || document.companyId !== membership.companyId) {
        throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
      }
      if (document.storageStatus !== "stored_private") {
        throw new SupplierDocumentActionError(
          "INVALID_TRANSITION",
          "Only stored private documents can be submitted.",
        );
      }
      if (document.scanStatus === "pending") {
        throw new SupplierDocumentActionError(
          "SCAN_PENDING",
          "Document scan must finish before review submission.",
        );
      }
      if (document.scanStatus !== "clean") {
        throw new SupplierDocumentActionError(
          "SCAN_FAILED",
          "Unsafe or failed document scans cannot be submitted.",
        );
      }
      if (!inArray(["uploaded", "rejected", "replacement_required"], document.evidenceStatus)) {
        throw new SupplierDocumentActionError(
          "INVALID_TRANSITION",
          "Document is not eligible for review submission.",
        );
      }
      const now = new Date();
      await scoped
        .update(supplierCompanyDocuments)
        .set({ evidenceStatus: "pending_review", submittedAt: now, updatedAt: now })
        .where(eq(supplierCompanyDocuments.id, documentId));
      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole: `supplier_${membership.role}`,
        resourceType: "supplier_company_document",
        resourceId: documentId,
        action: "supplier.document.submitted_for_review",
        oldValue: { evidenceStatus: document.evidenceStatus },
        newValue: { evidenceStatus: "pending_review" },
        reason: "Authorized Supplier member submitted a scanned company document",
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
    reason: string;
    reviewNote?: string | null;
  },
): Promise<void> {
  const reason = validatedSupplierDocumentReason(input.reason);
  const reviewNote = input.reviewNote?.trim() || null;
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new StaffAuthorizationError("UNAUTHENTICATED", "Authentication is required.");
      }
      const effectiveRole = await requireStaffPermission(
        scoped,
        session.user.id,
        "supplier_document.review.decide",
      );
      const [document] = await scoped
        .select({
          uploadedBy: supplierCompanyDocuments.uploadedBy,
          evidenceStatus: supplierCompanyDocuments.evidenceStatus,
          scanStatus: supplierCompanyDocuments.scanStatus,
          storageStatus: supplierCompanyDocuments.storageStatus,
        })
        .from(supplierCompanyDocuments)
        .where(eq(supplierCompanyDocuments.id, input.documentId))
        .limit(1)
        .for("update");
      if (!document) {
        throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
      }
      if (document.uploadedBy === session.user.id) {
        throw new StaffAuthorizationError(
          "SELF_REVIEW",
          "Staff cannot decide a company document they uploaded.",
        );
      }
      if (
        document.storageStatus !== "stored_private" ||
        document.scanStatus !== "clean" ||
        document.evidenceStatus !== "pending_review"
      ) {
        throw new SupplierDocumentActionError(
          "INVALID_TRANSITION",
          "Only clean pending-review documents can be decided.",
        );
      }

      const now = new Date();
      await scoped
        .update(supplierCompanyDocuments)
        .set({
          evidenceStatus: input.decision,
          publicVisible: false,
          updatedAt: now,
        })
        .where(eq(supplierCompanyDocuments.id, input.documentId));
      await scoped.insert(supplierDocumentReviewEvents).values({
        documentId: input.documentId,
        reviewerId: session.user.id,
        effectiveRole,
        decision: input.decision,
        reason,
        reviewNote,
      });
      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole,
        resourceType: "supplier_company_document",
        resourceId: input.documentId,
        action: `supplier.document.${input.decision}`,
        oldValue: { evidenceStatus: document.evidenceStatus },
        newValue: { evidenceStatus: input.decision },
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
      const { session, membership } = await requireSupplierMembership(scoped, env, request);
      if (membership.role !== "owner" && membership.role !== "admin") {
        throw new SupplierDocumentActionError(
          "FORBIDDEN",
          "Only Supplier owners and admins may change document visibility.",
        );
      }
      const [document] = await scoped
        .select({
          companyId: supplierCompanyDocuments.companyId,
          evidenceStatus: supplierCompanyDocuments.evidenceStatus,
          publicVisible: supplierCompanyDocuments.publicVisible,
          publicEligible: supplierCompanyDocumentTypes.publicEligible,
        })
        .from(supplierCompanyDocuments)
        .innerJoin(
          supplierCompanyDocumentTypes,
          eq(supplierCompanyDocumentTypes.key, supplierCompanyDocuments.documentTypeKey),
        )
        .where(eq(supplierCompanyDocuments.id, input.documentId))
        .limit(1)
        .for("update");
      if (!document || document.companyId !== membership.companyId) {
        throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
      }
      if (input.visible && (!document.publicEligible || document.evidenceStatus !== "approved")) {
        throw new SupplierDocumentActionError(
          "PUBLIC_VISIBILITY_FORBIDDEN",
          "Only approved publicly eligible document types may be visible.",
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
        action: "supplier.document.visibility_changed",
        oldValue: { publicVisible: document.publicVisible },
        newValue: { publicVisible: input.visible },
        reason: "Authorized Supplier administrator changed approved document visibility",
        requestId: requestId(request),
      });
    }),
  );
}

async function authorizedDocumentForAccess(
  database: Database,
  env: SupplierDocumentEnvironment,
  request: Request,
  documentId: string,
): Promise<{ userId: string; role: string; document: { objectKey: string; originalFilename: string; mimeType: string } } | null> {
  const session = await currentSession(database, env, request);
  if (!session) return null;
  const [document] = await database
    .select({
      companyId: supplierCompanyDocuments.companyId,
      objectKey: supplierCompanyDocuments.objectKey,
      originalFilename: supplierCompanyDocuments.originalFilename,
      mimeType: supplierCompanyDocuments.mimeType,
    })
    .from(supplierCompanyDocuments)
    .where(
      and(
        eq(supplierCompanyDocuments.id, documentId),
        eq(supplierCompanyDocuments.storageStatus, "stored_private"),
      ),
    )
    .limit(1);
  if (!document) return null;

  const membership = await activeMembership(database, session.user.id, document.companyId);
  if (membership) {
    return { userId: session.user.id, role: `supplier_${membership.role}`, document };
  }
  try {
    const role = await requireStaffPermission(
      database,
      session.user.id,
      "supplier_document.file.read",
    );
    return { userId: session.user.id, role, document };
  } catch {
    return null;
  }
}

export async function createSupplierDocumentAccessGrant(
  env: SupplierDocumentEnvironment,
  request: Request,
  documentId: string,
): Promise<{ token: string; expiresAt: Date }> {
  return withDatabase(env, async (database) => {
    const authorized = await authorizedDocumentForAccess(database, env, request, documentId);
    if (!authorized) {
      throw new SupplierDocumentActionError("DOCUMENT_NOT_FOUND", "Document was not found.");
    }
    const token = randomAccessToken();
    const hash = await tokenHash(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + supplierDocumentAccessGrantMinutes * 60_000);
    await database.insert(supplierDocumentAccessGrants).values({
      documentId,
      issuedTo: authorized.userId,
      tokenHash: hash,
      expiresAt,
    });
    await database.insert(auditLogs).values({
      actorId: authorized.userId,
      effectiveRole: authorized.role,
      resourceType: "supplier_company_document",
      resourceId: documentId,
      action: "supplier.document.access_grant_issued",
      newValue: { expiresAt },
      reason: "Authorized private document access grant issued",
      requestId: requestId(request),
    });
    return { token, expiresAt };
  });
}

export async function downloadSupplierDocumentWithGrant(
  env: SupplierDocumentEnvironment,
  request: Request,
  token: string,
): Promise<Response> {
  const hash = await tokenHash(token);
  const authorized = await withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;
    const now = new Date();
    const [row] = await database
      .select({
        grantId: supplierDocumentAccessGrants.id,
        documentId: supplierCompanyDocuments.id,
        objectKey: supplierCompanyDocuments.objectKey,
        originalFilename: supplierCompanyDocuments.originalFilename,
        mimeType: supplierCompanyDocuments.mimeType,
      })
      .from(supplierDocumentAccessGrants)
      .innerJoin(
        supplierCompanyDocuments,
        eq(supplierCompanyDocuments.id, supplierDocumentAccessGrants.documentId),
      )
      .where(
        and(
          eq(supplierDocumentAccessGrants.tokenHash, hash),
          eq(supplierDocumentAccessGrants.issuedTo, session.user.id),
          eq(supplierCompanyDocuments.storageStatus, "stored_private"),
          sql`${supplierDocumentAccessGrants.expiresAt} > ${now}`,
          sql`${supplierDocumentAccessGrants.revokedAt} is null`,
        ),
      )
      .limit(1);
    if (!row) return null;
    await database
      .update(supplierDocumentAccessGrants)
      .set({ lastAccessedAt: now })
      .where(eq(supplierDocumentAccessGrants.id, row.grantId));
    return row;
  });
  if (!authorized) {
    throw new SupplierDocumentActionError(
      "ACCESS_GRANT_INVALID",
      "Document access grant is invalid or expired.",
    );
  }

  const object = await env.PRIVATE_DOCUMENTS.get(authorized.objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  const filename = safeDownloadFilename(authorized.originalFilename);
  return new Response(object.body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type": authorized.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function loadSupplierDocumentReviewQueue(
  env: SupplierDocumentEnvironment,
  request: Request,
): Promise<
  | {
      actor: { id: string; role: PlatformStaffRole };
      documents: Array<{
        id: string;
        companyId: string;
        companyName: string;
        documentTypeKey: string;
        originalFilename: string;
        submittedAt: Date | null;
      }>;
    }
  | null
> {
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;
    const role = await requireStaffPermission(
      database,
      session.user.id,
      "supplier_document.review.list",
    );
    const documents = await database
      .select({
        id: supplierCompanyDocuments.id,
        companyId: supplierCompanyDocuments.companyId,
        companyName: sql<string>`supplier_companies.legal_name`,
        documentTypeKey: supplierCompanyDocuments.documentTypeKey,
        originalFilename: supplierCompanyDocuments.originalFilename,
        submittedAt: supplierCompanyDocuments.submittedAt,
      })
      .from(supplierCompanyDocuments)
      .innerJoin(
        sql`"supplier_companies"`,
        sql`"supplier_companies"."id" = ${supplierCompanyDocuments.companyId}`,
      )
      .where(
        and(
          eq(supplierCompanyDocuments.evidenceStatus, "pending_review"),
          eq(supplierCompanyDocuments.storageStatus, "stored_private"),
          eq(supplierCompanyDocuments.scanStatus, "clean"),
        ),
      )
      .orderBy(asc(supplierCompanyDocuments.submittedAt), asc(supplierCompanyDocuments.id));
    return { actor: { id: session.user.id, role }, documents };
  });
}

export async function loadSupplierDocumentReviewDetail(
  env: SupplierDocumentEnvironment,
  request: Request,
  documentId: string,
) {
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;
    const role = await requireStaffPermission(
      database,
      session.user.id,
      "supplier_document.review.read",
    );
    const [document] = await database
      .select({
        id: supplierCompanyDocuments.id,
        companyId: supplierCompanyDocuments.companyId,
        companyName: sql<string>`supplier_companies.legal_name`,
        documentTypeKey: supplierCompanyDocuments.documentTypeKey,
        originalFilename: supplierCompanyDocuments.originalFilename,
        mimeType: supplierCompanyDocuments.mimeType,
        sizeBytes: supplierCompanyDocuments.sizeBytes,
        sha256: supplierCompanyDocuments.sha256,
        evidenceStatus: supplierCompanyDocuments.evidenceStatus,
        scanStatus: supplierCompanyDocuments.scanStatus,
        issueDate: supplierCompanyDocuments.issueDate,
        expiresAt: supplierCompanyDocuments.expiresAt,
        submittedAt: supplierCompanyDocuments.submittedAt,
      })
      .from(supplierCompanyDocuments)
      .innerJoin(
        sql`"supplier_companies"`,
        sql`"supplier_companies"."id" = ${supplierCompanyDocuments.companyId}`,
      )
      .where(eq(supplierCompanyDocuments.id, documentId))
      .limit(1);
    if (!document) return { actor: { id: session.user.id, role }, document: null, timeline: [] };
    const timeline = await database
      .select({
        id: supplierDocumentReviewEvents.id,
        reviewerId: supplierDocumentReviewEvents.reviewerId,
        effectiveRole: supplierDocumentReviewEvents.effectiveRole,
        decision: supplierDocumentReviewEvents.decision,
        reason: supplierDocumentReviewEvents.reason,
        reviewNote: supplierDocumentReviewEvents.reviewNote,
        createdAt: supplierDocumentReviewEvents.createdAt,
      })
      .from(supplierDocumentReviewEvents)
      .where(eq(supplierDocumentReviewEvents.documentId, documentId))
      .orderBy(asc(supplierDocumentReviewEvents.createdAt), asc(supplierDocumentReviewEvents.id));
    return { actor: { id: session.user.id, role }, document, timeline };
  });
}

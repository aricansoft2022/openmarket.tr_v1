import { asc, eq } from "drizzle-orm";

import type { AuthEnvironment } from "../../auth/create-auth.server";
import { withDatabase } from "../../db/client.server";
import {
  supplierCompanyDocuments,
  supplierCompanyDocumentTypes,
  supplierDocumentReviewEvents,
} from "../../db/schema";
import {
  loadSupplierDocumentWorkspace,
  type SupplierDocumentEnvironment,
} from "./service.server";
import { deriveSupplierDocumentState } from "./policy";

export async function loadSupplierMemberDocumentDetail(
  env: SupplierDocumentEnvironment & AuthEnvironment,
  request: Request,
  documentId: string,
  companyId?: string,
) {
  const workspace = await loadSupplierDocumentWorkspace(env, request, companyId);
  if (!workspace) return null;

  return withDatabase(env, async (database) => {
    const [document] = await database
      .select({
        id: supplierCompanyDocuments.id,
        companyId: supplierCompanyDocuments.companyId,
        documentTypeKey: supplierCompanyDocuments.documentTypeKey,
        labelTr: supplierCompanyDocumentTypes.labelTr,
        labelEn: supplierCompanyDocumentTypes.labelEn,
        descriptionTr: supplierCompanyDocumentTypes.descriptionTr,
        descriptionEn: supplierCompanyDocumentTypes.descriptionEn,
        publicEligible: supplierCompanyDocumentTypes.publicEligible,
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
      .innerJoin(
        supplierCompanyDocumentTypes,
        eq(supplierCompanyDocumentTypes.key, supplierCompanyDocuments.documentTypeKey),
      )
      .where(eq(supplierCompanyDocuments.id, documentId))
      .limit(1);

    if (!document || document.companyId !== workspace.company.id) return null;

    const timeline = await database
      .select({
        id: supplierDocumentReviewEvents.id,
        effectiveRole: supplierDocumentReviewEvents.effectiveRole,
        decision: supplierDocumentReviewEvents.decision,
        reason: supplierDocumentReviewEvents.reason,
        reviewNote: supplierDocumentReviewEvents.reviewNote,
        createdAt: supplierDocumentReviewEvents.createdAt,
      })
      .from(supplierDocumentReviewEvents)
      .where(eq(supplierDocumentReviewEvents.documentId, documentId))
      .orderBy(asc(supplierDocumentReviewEvents.createdAt), asc(supplierDocumentReviewEvents.id));

    return {
      workspace,
      document: {
        ...document,
        derivedState: deriveSupplierDocumentState({
          storageStatus: document.storageStatus,
          evidenceStatus: document.evidenceStatus,
          scanStatus: document.scanStatus,
          expiresAt: document.expiresAt,
        }),
      },
      timeline,
    };
  });
}

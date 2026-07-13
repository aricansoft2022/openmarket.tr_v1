import { readFileSync, writeFileSync } from "node:fs";

function patch(path, edits) {
  let source = readFileSync(path, "utf8");
  for (const [search, replacement] of edits) {
    if (!source.includes(search)) {
      throw new Error(`Patch target not found in ${path}:\n${search}`);
    }
    source = source.replace(search, replacement);
  }
  writeFileSync(path, source);
}

patch("app/lib/db/schema/supplier-documents.ts", [
  [
    `import { platformStaffRoles, type PlatformStaffRole } from "./platform-staff";`,
    `import type { PlatformStaffRole } from "./platform-staff";`,
  ],
  [
    `    uniqueIndex("supplier_company_documents_object_key_idx").on(table.objectKey),`,
    `    uniqueIndex("supplier_company_documents_object_key_idx").on(table.objectKey),
    uniqueIndex("supplier_company_documents_replaces_once_idx").on(table.replacesDocumentId),`,
  ],
  [
    `    check(
      "supplier_document_review_events_role_check",
      sql\`\${table.effectiveRole} in (\${sql.join(
        platformStaffRoles.map((role) => sql\`\${role}\`),
        sql\`, \`,
      )})\`,
    ),`,
    `    check(
      "supplier_document_review_events_role_check",
      sql\`\${table.effectiveRole} in ('super_admin', 'platform_admin', 'catalogue_content_editor', 'compliance_reviewer', 'product_rfq_moderator', 'privacy_support_manager')\`,
    ),`,
  ],
]);

patch("app/lib/supplier/documents/service.server.ts", [
  [
    `import { and, asc, desc, eq, inArray, max, ne, or, sql } from "drizzle-orm";`,
    `import { and, asc, desc, eq, max, ne, sql } from "drizzle-orm";`,
  ],
  [
    `export async function recordSupplierDocumentScanResult(
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
    action: \`supplier.document.scan_\${input.result}\`,
    oldValue: { scanStatus: current.scanStatus },
    newValue: { scanStatus: input.result },
    reason: note ?? "Automated document scan completed",
  });
}`,
    `export async function recordSupplierDocumentScanResult(
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
      action: \`supplier.document.scan_\${input.result}\`,
      oldValue: {
        scanStatus: current.scanStatus,
        evidenceStatus: current.evidenceStatus,
      },
      newValue: { scanStatus: input.result, evidenceStatus },
      reason: note ?? "Automated document scan completed",
    });
  });
}`,
  ],
  [
    `      if (!inArray(["uploaded", "rejected", "replacement_required"], document.evidenceStatus)) {`,
    `      if (document.evidenceStatus !== "uploaded") {`,
  ],
  [
    `    reason: string;`,
    `    reason?: string;`,
  ],
  [
    `  const reason = validatedSupplierDocumentReason(input.reason);`,
    `  const reason =
    input.decision === "approved"
      ? input.reason?.trim()
        ? validatedSupplierDocumentReason(input.reason)
        : null
      : validatedSupplierDocumentReason(input.reason ?? "");`,
  ],
  [
    `          uploadedBy: supplierCompanyDocuments.uploadedBy,
          evidenceStatus: supplierCompanyDocuments.evidenceStatus,`,
    `          companyId: supplierCompanyDocuments.companyId,
          uploadedBy: supplierCompanyDocuments.uploadedBy,
          evidenceStatus: supplierCompanyDocuments.evidenceStatus,`,
  ],
  [
    `      if (document.uploadedBy === session.user.id) {
        throw new StaffAuthorizationError(
          "SELF_REVIEW",
          "Staff cannot decide a company document they uploaded.",
        );
      }`,
    `      const reviewerMembership = await activeMembership(
        scoped,
        session.user.id,
        document.companyId,
      );
      if (document.uploadedBy === session.user.id || reviewerMembership) {
        throw new StaffAuthorizationError(
          "SELF_REVIEW",
          "Staff cannot decide a company document for a company they belong to.",
        );
      }`,
  ],
]);

patch("package.json", [
  [
    `    "db:verify:supplier-company": "tsx scripts/verify-supplier-company-foundation.ts",`,
    `    "db:verify:supplier-company": "tsx scripts/verify-supplier-company-foundation.ts",
    "db:seed:supplier-documents": "tsx scripts/seed-supplier-document-catalogue.ts",
    "db:verify:supplier-documents": "tsx scripts/verify-supplier-document-catalogue.ts",`,
  ],
]);

patch(".github/workflows/ci.yml", [
  [
    `      - name: Verify supplier company profile foundation
        run: npm run db:verify:supplier-company`,
    `      - name: Verify supplier company profile foundation
        run: npm run db:verify:supplier-company

      - name: Seed Supplier company-document catalogue
        run: npm run db:seed:supplier-documents

      - name: Verify Supplier company-document foundation
        run: npm run db:verify:supplier-documents`,
  ],
]);

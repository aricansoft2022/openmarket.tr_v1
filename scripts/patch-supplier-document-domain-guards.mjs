import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

patch("app/lib/supplier/documents/service.server.ts", [
  [
    `        const currentState = matching[0]?.derivedState ?? "missing";
        return {`,
    `        const currentState = matching[0]?.derivedState ?? "missing";
        const approvedEvidenceRemains = matching.some(
          (document) => document.derivedState === "approved",
        );
        return {`,
  ],
  [
    `          satisfied: requirement.level !== "mandatory" || currentState === "approved",`,
    `          satisfied: requirement.level !== "mandatory" || approvedEvidenceRemains,`,
  ],
  [
    `  const validatedFile = validateSupplierDocumentFile(input.file);
  const validatedMetadata = validateSupplierDocumentMetadata(input);
  const bytes = await input.file.arrayBuffer();`,
    `  const validatedFile = validateSupplierDocumentFile(input.file);
  const validatedMetadata = validateSupplierDocumentMetadata(input);
  await withDatabase(env, async (database) => {
    const { membership } = await requireSupplierMembership(
      database,
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
  });
  const bytes = await input.file.arrayBuffer();`,
  ],
  [
    `      let replaces: { id: string; documentTypeKey: string } | null = null;`,
    `      let replaces: { id: string; documentTypeKey: string; version: number } | null = null;`,
  ],
  [
    `            documentTypeKey: supplierCompanyDocuments.documentTypeKey,
          })`,
    `            documentTypeKey: supplierCompanyDocuments.documentTypeKey,
            version: supplierCompanyDocuments.version,
          })`,
  ],
  [
    `      const version = (versionRow?.value ?? 0) + 1;
      const typeSegment`,
    `      const latestVersion = versionRow?.value ?? 0;
      if (replaces && replaces.version !== latestVersion) {
        throw new SupplierDocumentActionError(
          "REPLACEMENT_INVALID",
          "Replacement must reference the latest document version.",
        );
      }
      const version = latestVersion + 1;
      const typeSegment`,
  ],
  [
    `      if (
        !(["uploaded", "rejected", "replacement_required"] as const).includes(
          document.evidenceStatus as "uploaded" | "rejected" | "replacement_required",
        )
      ) {`,
    `      if (document.evidenceStatus !== "uploaded") {`,
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
    `      const conflictedMembership = await activeMembership(
        scoped,
        session.user.id,
        document.companyId,
      );
      if (document.uploadedBy === session.user.id || conflictedMembership) {
        throw new StaffAuthorizationError(
          "SELF_REVIEW",
          "Staff cannot decide a company document they uploaded or a company they belong to.",
        );
      }`,
  ],
]);

patch("app/routes/supplier.documents.$documentId.tsx", [
  [
    `    document.scanStatus === "clean" &&
    (["uploaded", "rejected", "replacement_required"] as const).includes(
      document.evidenceStatus as "uploaded" | "rejected" | "replacement_required",
    );`,
    `    document.scanStatus === "clean" &&
    document.evidenceStatus === "uploaded";`,
  ],
]);

patch("app/routes/supplier.documents.upload.tsx", [
  [
    `      retentionUntil: optionalDate(formData.get("retentionUntil")),
`,
    "",
  ],
  [
    `                <label className="supplier-field supplier-field--wide">
                  <span>{copy.upload.retentionDate}</span>
                  <input name="retentionUntil" type="date" />
                  <small>{copy.upload.retentionHint}</small>
                </label>
`,
    "",
  ],
]);

patch("scripts/verify-supplier-document-lifecycle.ts", [
  [
    `  const reviewer = await registerFixture("Document Reviewer", "document-reviewer");`,
    `  const reviewer = await registerFixture("Document Reviewer", "document-reviewer");
  const conflictedReviewer = await registerFixture(
    "Conflicted Document Reviewer",
    "conflicted-document-reviewer",
  );`,
  ],
  [
    `  await database.insert(schema.platformStaffAssignments).values({
    userId: reviewer.id,
    role: "compliance_reviewer",
    assignedBy: owner.id,
    assignmentReason: "Supplier company-document review verification",
  });`,
    `  await database.insert(schema.platformStaffAssignments).values([
    {
      userId: reviewer.id,
      role: "compliance_reviewer",
      assignedBy: owner.id,
      assignmentReason: "Supplier company-document review verification",
    },
    {
      userId: conflictedReviewer.id,
      role: "compliance_reviewer",
      assignedBy: owner.id,
      assignmentReason: "Supplier company-document conflict verification",
    },
  ]);
  await database.insert(schema.supplierMemberships).values({
    companyId: company.company.id,
    userId: conflictedReviewer.id,
    role: "viewer",
    assignedBy: owner.id,
  });`,
  ],
  [
    `  await decideSupplierCompanyDocument(
    environment,
    request("/admin/supplier-documents", reviewer.cookie, "document-review-approve"),`,
    `  await assert.rejects(
    decideSupplierCompanyDocument(
      environment,
      request("/admin/supplier-documents", conflictedReviewer.cookie),
      {
        documentId: uploaded.id,
        decision: "approved",
        reason: "A company member must not review their own Supplier company",
      },
    ),
    (error: unknown) =>
      error instanceof StaffAuthorizationError && error.code === "SELF_REVIEW",
  );

  await decideSupplierCompanyDocument(
    environment,
    request("/admin/supplier-documents", reviewer.cookie, "document-review-approve"),`,
  ],
  [
    `  assert.equal(replacement.version, 2);
  assert.equal(replacement.replacesDocumentId, uploaded.id);`,
    `  assert.equal(replacement.version, 2);
  assert.equal(replacement.replacesDocumentId, uploaded.id);
  const workspaceWithPendingReplacement = await loadSupplierDocumentWorkspace(
    environment,
    request("/supplier/documents", owner.cookie),
    company.company.id,
  );
  assert.equal(
    workspaceWithPendingReplacement?.requirements.find(
      (requirement) =>
        requirement.documentTypeKey === "company_document.chamber_activity",
    )?.satisfied,
    true,
  );`,
  ],
]);

unlinkSync(fileURLToPath(import.meta.url));

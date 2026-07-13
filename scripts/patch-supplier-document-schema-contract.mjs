import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = "app/lib/supplier/documents/service.server.ts";
let source = readFileSync(path, "utf8");

function replace(search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Supplier document schema patch target not found:\n${search}`);
  }
  source = source.replace(search, replacement);
}

replace(
  `import { validateSupplierDocumentFile } from "../../business-identity/evidence";`,
  `import { validateEvidenceFile } from "../../business-identity/evidence";`,
);
replace(`  supplierTypeSelections,`, `  supplierCompanyTypes,`);
replace(
  `import { membershipCanEditSupplierProfile } from "../profile";`,
  `import { launchSupplierTypeKeys, type LaunchSupplierTypeKey } from "../catalogue";\nimport { membershipCanEditSupplierProfile } from "../profile";`,
);

source = source.replaceAll("sha256: string;", "sha256: string | null;");
source = source.replaceAll("supplierTypeSelections.supplierTypeKey", "supplierCompanyTypes.supplierTypeKey");
source = source.replaceAll("supplierTypeSelections", "supplierCompanyTypes");
replace(
  `async function companySupplierTypeKeys(database: Database, companyId: string): Promise<string[]> {`,
  `async function companySupplierTypeKeys(\n  database: Database,\n  companyId: string,\n): Promise<LaunchSupplierTypeKey[]> {`,
);
replace(
  `  return rows.map((row) => row.key);`,
  `  return rows\n    .map((row) => row.key)\n    .filter((key): key is LaunchSupplierTypeKey =>\n      launchSupplierTypeKeys.includes(key as LaunchSupplierTypeKey),\n    );`,
);
replace(
  `  const validatedFile = validateSupplierDocumentFile(input.file);`,
  `  const validatedFile = validateEvidenceFile({\n    name: input.file.name,\n    type: input.file.type,\n    size: input.file.size,\n  });`,
);
source = source.replaceAll("validatedFile.originalFilename", "validatedFile.filename");
source = source.replaceAll(`storageStatus: "reserved"`, `storageStatus: "uploading"`);
replace(
  `.set({ storageStatus: "failed", scanStatus: "failed", updatedAt: new Date() })`,
  `.set({\n            storageStatus: "failed",\n            scanStatus: "failed",\n            scanNote: "Private object storage failed",\n            failureReason: "Private object storage failed",\n            updatedAt: new Date(),\n          })`,
);
source = source.replaceAll(` || document.scanStatus === "not_started"`, "");

replace(
  `      const { session, actor } = await requireStaffPermission(\n        scoped,\n        env,\n        request,\n        "supplier_document.review.decide",\n      );`,
  `      const session = await currentSession(scoped, env, request);\n      if (!session) {\n        throw new StaffAuthorizationError("UNAUTHENTICATED", "Authentication is required.");\n      }\n      const actorRole = await requireStaffPermission(\n        scoped,\n        session.user.id,\n        "supplier_document.review.decide",\n      );`,
);
source = source.replaceAll("actor.role as PlatformStaffRole", "actorRole as PlatformStaffRole");
source = source.replaceAll("effectiveRole: actor.role,", "effectiveRole: actorRole,");
source = source.replace(/\n\s*reviewedAt: now,\n\s*reviewedBy: session\.user\.id,/g, "");
source = source.replaceAll("reviewedBy: session.user.id,", "reviewerId: session.user.id,");
source = source.replace(/\n\s*requestId: requestId\(request\),\n\s*createdAt: now,/g, "\n        createdAt: now,");

replace(
  `  const staff = await requireStaffPermission(database, env, request, "supplier_document.file.read");\n  return { session, document, effectiveRole: staff.actor.role };`,
  `  const staffRole = await requireStaffPermission(\n    database,\n    session.user.id,\n    "supplier_document.file.read",\n  );\n  return { session, document, effectiveRole: staffRole };`,
);

source = source.replaceAll("grantedTo: session.user.id,", "issuedTo: session.user.id,");
source = source.replaceAll(
  "grantedTo: supplierDocumentAccessGrants.grantedTo,",
  "issuedTo: supplierDocumentAccessGrants.issuedTo,",
);
source = source.replaceAll(
  "usedAt: supplierDocumentAccessGrants.usedAt,",
  "revokedAt: supplierDocumentAccessGrants.revokedAt,\n        lastAccessedAt: supplierDocumentAccessGrants.lastAccessedAt,",
);
source = source.replaceAll("grant.grantedTo", "grant.issuedTo");
source = source.replaceAll("grant.usedAt", "grant.revokedAt");
replace(
  `.set({ usedAt })`,
  `.set({ revokedAt: usedAt, lastAccessedAt: usedAt })`,
);
source = source.replaceAll(
  `sql\`${"${supplierDocumentAccessGrants.usedAt}"} is not null\``,
  `sql\`${"${supplierDocumentAccessGrants.revokedAt}"} is not null\``,
);

replace(
  `    const result = await requireStaffPermission(database, env, request, "supplier_document.review.list");`,
  `    const session = await currentSession(database, env, request);\n    if (!session) return null;\n    const actorRole = await requireStaffPermission(\n      database,\n      session.user.id,\n      "supplier_document.review.list",\n    );`,
);
source = source.replaceAll(
  `actor: { id: result.actor.id, role: result.actor.role as PlatformStaffRole },`,
  `actor: { id: session.user.id, role: actorRole as PlatformStaffRole },`,
);
replace(
  `    const result = await requireStaffPermission(database, env, request, "supplier_document.review.read");`,
  `    const session = await currentSession(database, env, request);\n    if (!session) return null;\n    const actorRole = await requireStaffPermission(\n      database,\n      session.user.id,\n      "supplier_document.review.read",\n    );`,
);

source = source.replaceAll(
  "reviewedBy: supplierDocumentReviewEvents.reviewedBy,",
  "reviewerId: supplierDocumentReviewEvents.reviewerId,",
);
source = source.replace(/\n\s*requestId: supplierDocumentReviewEvents\.requestId,/g, "");
source = source.replaceAll("reviewedBy: string;", "reviewerId: string;");
source = source.replaceAll("reason: string;", "reason: string | null;");
source = source.replace(/\n\s*requestId: string \| null;/g, "");

writeFileSync(path, source);
unlinkSync(fileURLToPath(import.meta.url));

import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = "scripts/verify-supplier-document-lifecycle.ts";
let source = readFileSync(path, "utf8");

function replaceOnce(search, replacement) {
  if (!source.includes(search)) throw new Error(`Patch target not found:\n${search}`);
  source = source.replace(search, replacement);
}

replaceOnce(
  'import { Client } from "pg";\n',
  'import { Client } from "pg";\n\nimport type { Database } from "../app/lib/db/client.server";\n',
);
replaceOnce(
  '          body: new Blob([stored.bytes]).stream(),',
  '          body: new Blob([stored.bytes.slice().buffer]).stream(),',
);
replaceOnce(
  '    await recordSupplierDocumentScanResult(transaction as unknown as typeof database, {',
  '    await recordSupplierDocumentScanResult(transaction as unknown as Database, {',
);
replaceOnce(
  '    await recordSupplierDocumentScanResult(transaction as unknown as typeof database, {',
  '    await recordSupplierDocumentScanResult(transaction as unknown as Database, {',
);
replaceOnce(
  `  await database
    .update(schema.supplierDocumentAccessGrants)
    .set({ expiresAt: new Date("2026-01-01T00:00:00.000Z") })
    .where(eq(schema.supplierDocumentAccessGrants.tokenHash, await (async () => {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(expiringGrant.token),
      );
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    })()));`,
  `  const expiringGrantDigest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(expiringGrant.token),
  );
  const expiringGrantHash = Array.from(
    new Uint8Array(expiringGrantDigest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
  await client.query(
    \`update supplier_document_access_grants
       set expires_at = created_at + interval '1 millisecond'
       where token_hash = $1\`,
    [expiringGrantHash],
  );`,
);
replaceOnce(
  `} finally {
  if (createdCompanyIds.length > 0) {
    await database
      .delete(schema.supplierCompanies)
      .where(inArray(schema.supplierCompanies.id, createdCompanyIds));
  }`,
  `} finally {
  if (createdCompanyIds.length > 0) {
    const documentIds = await database
      .select({ id: schema.supplierCompanyDocuments.id })
      .from(schema.supplierCompanyDocuments)
      .where(inArray(schema.supplierCompanyDocuments.companyId, createdCompanyIds));
    const ids = documentIds.map((row) => row.id);
    if (ids.length > 0) {
      await database
        .delete(schema.supplierDocumentAccessGrants)
        .where(inArray(schema.supplierDocumentAccessGrants.documentId, ids));
      await database
        .delete(schema.supplierDocumentReviewEvents)
        .where(inArray(schema.supplierDocumentReviewEvents.documentId, ids));
      await database
        .delete(schema.supplierCompanyDocuments)
        .where(inArray(schema.supplierCompanyDocuments.id, ids));
    }
    await database
      .delete(schema.supplierCompanies)
      .where(inArray(schema.supplierCompanies.id, createdCompanyIds));
  }`,
);

writeFileSync(path, source);
unlinkSync(fileURLToPath(import.meta.url));

import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = "app/lib/supplier/documents/service.server.ts";
let source = readFileSync(path, "utf8");

function replaceOnce(search, replacement) {
  if (!source.includes(search)) throw new Error(`Patch target not found:\n${search}`);
  source = source.replace(search, replacement);
}

replaceOnce(
  'import { and, asc, desc, eq, inArray, max, ne, or, sql } from "drizzle-orm";',
  'import { and, asc, desc, eq, max, ne, sql } from "drizzle-orm";',
);
replaceOnce(
  '  supplierCompanyDocuments,\n  supplierCompanyDocumentTypes,',
  '  supplierCompanies,\n  supplierCompanyDocuments,\n  supplierCompanyDocumentTypes,',
);
replaceOnce(
  '      legalName: sql<string>`supplier_companies.legal_name`,\n      companyStatus: sql<string>`supplier_companies.status`,',
  '      legalName: supplierCompanies.legalName,\n      companyStatus: supplierCompanies.status,',
);
replaceOnce(
  '    .innerJoin(\n      sql`"supplier_companies"`,\n      sql`"supplier_companies"."id" = ${supplierMemberships.companyId}`,\n    )',
  '    .innerJoin(supplierCompanies, eq(supplierCompanies.id, supplierMemberships.companyId))',
);
replaceOnce(
  '      if (!inArray(["uploaded", "rejected", "replacement_required"], document.evidenceStatus)) {',
  '      if (!(["uploaded", "rejected", "replacement_required"] as const).includes(document.evidenceStatus as "uploaded" | "rejected" | "replacement_required")) {',
);
replaceOnce(
  '        companyName: sql<string>`supplier_companies.legal_name`,',
  '        companyName: supplierCompanies.legalName,',
);
replaceOnce(
  '      .innerJoin(\n        sql`"supplier_companies"`,\n        sql`"supplier_companies"."id" = ${supplierCompanyDocuments.companyId}`,\n      )',
  '      .innerJoin(supplierCompanies, eq(supplierCompanies.id, supplierCompanyDocuments.companyId))',
);
replaceOnce(
  '        companyName: sql<string>`supplier_companies.legal_name`,',
  '        companyName: supplierCompanies.legalName,',
);
replaceOnce(
  '      .innerJoin(\n        sql`"supplier_companies"`,\n        sql`"supplier_companies"."id" = ${supplierCompanyDocuments.companyId}`,\n      )',
  '      .innerJoin(supplierCompanies, eq(supplierCompanies.id, supplierCompanyDocuments.companyId))',
);

writeFileSync(path, source);
unlinkSync(fileURLToPath(import.meta.url));

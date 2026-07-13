import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import * as schema from "../app/lib/db/schema";
import { seedSupplierLaunchCatalogue } from "../app/lib/supplier/catalogue.server";
import {
  supplierCompanyDocumentTypes as launchDocumentTypes,
  supplierDocumentRequirementRules as launchRequirementRules,
} from "../app/lib/supplier/documents/catalogue";
import { seedSupplierDocumentCatalogue } from "../app/lib/supplier/documents/catalogue.server";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for Supplier document catalogue verification.");
}

const client = new Client({ connectionString });
await client.connect();
const database = drizzle(client, { schema });
const suffix = randomUUID().replaceAll("-", "_");
const legacyDocumentTypeKey = `company_document.legacy_${suffix}`;
const legacyRuleKey = `company_document_rule.legacy.${suffix}`;

try {
  await seedSupplierLaunchCatalogue(database);
  await database.insert(schema.supplierCompanyDocumentTypes).values({
    key: legacyDocumentTypeKey,
    labelTr: "Eski şirket belgesi",
    labelEn: "Legacy company document",
    descriptionTr: "Yalnız arşivleme davranışını doğrulamak için kullanılan eski belge türü.",
    descriptionEn: "Legacy document type used only to verify archival behaviour.",
    active: true,
    sortOrder: 999,
  });
  await database.insert(schema.supplierDocumentRequirementRules).values({
    key: legacyRuleKey,
    documentTypeKey: legacyDocumentTypeKey,
    supplierTypeKey: null,
    level: "optional",
    noteTr: "Yalnız arşivleme davranışını doğrulamak için kullanılan eski kural.",
    noteEn: "Legacy rule used only to verify archival behaviour.",
    active: true,
    sortOrder: 999,
  });

  const first = await seedSupplierDocumentCatalogue(database);
  assert.deepEqual(first, {
    documentTypes: launchDocumentTypes.length,
    requirementRules: launchRequirementRules.length,
  });

  const activeDocumentTypes = await database
    .select({
      key: schema.supplierCompanyDocumentTypes.key,
      labelTr: schema.supplierCompanyDocumentTypes.labelTr,
      labelEn: schema.supplierCompanyDocumentTypes.labelEn,
      descriptionTr: schema.supplierCompanyDocumentTypes.descriptionTr,
      descriptionEn: schema.supplierCompanyDocumentTypes.descriptionEn,
      publicEligible: schema.supplierCompanyDocumentTypes.publicEligible,
      expiryExpected: schema.supplierCompanyDocumentTypes.expiryExpected,
      sortOrder: schema.supplierCompanyDocumentTypes.sortOrder,
      active: schema.supplierCompanyDocumentTypes.active,
    })
    .from(schema.supplierCompanyDocumentTypes)
    .where(eq(schema.supplierCompanyDocumentTypes.active, true))
    .orderBy(
      asc(schema.supplierCompanyDocumentTypes.sortOrder),
      asc(schema.supplierCompanyDocumentTypes.key),
    );
  assert.deepEqual(
    activeDocumentTypes,
    launchDocumentTypes.map((entry) => ({ ...entry, active: true })),
  );

  const activeRules = await database
    .select({
      key: schema.supplierDocumentRequirementRules.key,
      documentTypeKey: schema.supplierDocumentRequirementRules.documentTypeKey,
      supplierTypeKey: schema.supplierDocumentRequirementRules.supplierTypeKey,
      level: schema.supplierDocumentRequirementRules.level,
      noteTr: schema.supplierDocumentRequirementRules.noteTr,
      noteEn: schema.supplierDocumentRequirementRules.noteEn,
      sortOrder: schema.supplierDocumentRequirementRules.sortOrder,
      active: schema.supplierDocumentRequirementRules.active,
    })
    .from(schema.supplierDocumentRequirementRules)
    .where(eq(schema.supplierDocumentRequirementRules.active, true))
    .orderBy(
      asc(schema.supplierDocumentRequirementRules.sortOrder),
      asc(schema.supplierDocumentRequirementRules.key),
    );
  assert.deepEqual(
    activeRules,
    [...launchRequirementRules]
      .sort((left, right) => left.sortOrder - right.sortOrder || left.key.localeCompare(right.key))
      .map((entry) => ({ ...entry, active: true })),
  );

  const [archivedType] = await database
    .select({ active: schema.supplierCompanyDocumentTypes.active })
    .from(schema.supplierCompanyDocumentTypes)
    .where(eq(schema.supplierCompanyDocumentTypes.key, legacyDocumentTypeKey));
  const [archivedRule] = await database
    .select({ active: schema.supplierDocumentRequirementRules.active })
    .from(schema.supplierDocumentRequirementRules)
    .where(eq(schema.supplierDocumentRequirementRules.key, legacyRuleKey));
  assert.equal(archivedType?.active, false);
  assert.equal(archivedRule?.active, false);

  await database
    .update(schema.supplierCompanyDocumentTypes)
    .set({ labelTr: "Bozuk etiket", active: false, sortOrder: 777 })
    .where(eq(schema.supplierCompanyDocumentTypes.key, launchDocumentTypes[0].key));
  await database
    .update(schema.supplierDocumentRequirementRules)
    .set({ level: "optional", noteEn: "Broken canonical rule", active: false, sortOrder: 777 })
    .where(eq(schema.supplierDocumentRequirementRules.key, launchRequirementRules[0].key));

  await seedSupplierDocumentCatalogue(database);
  await seedSupplierDocumentCatalogue(database);

  const [restoredType] = await database
    .select({
      key: schema.supplierCompanyDocumentTypes.key,
      labelTr: schema.supplierCompanyDocumentTypes.labelTr,
      labelEn: schema.supplierCompanyDocumentTypes.labelEn,
      descriptionTr: schema.supplierCompanyDocumentTypes.descriptionTr,
      descriptionEn: schema.supplierCompanyDocumentTypes.descriptionEn,
      publicEligible: schema.supplierCompanyDocumentTypes.publicEligible,
      expiryExpected: schema.supplierCompanyDocumentTypes.expiryExpected,
      sortOrder: schema.supplierCompanyDocumentTypes.sortOrder,
      active: schema.supplierCompanyDocumentTypes.active,
    })
    .from(schema.supplierCompanyDocumentTypes)
    .where(eq(schema.supplierCompanyDocumentTypes.key, launchDocumentTypes[0].key));
  assert.deepEqual(restoredType, { ...launchDocumentTypes[0], active: true });

  const [restoredRule] = await database
    .select({
      key: schema.supplierDocumentRequirementRules.key,
      documentTypeKey: schema.supplierDocumentRequirementRules.documentTypeKey,
      supplierTypeKey: schema.supplierDocumentRequirementRules.supplierTypeKey,
      level: schema.supplierDocumentRequirementRules.level,
      noteTr: schema.supplierDocumentRequirementRules.noteTr,
      noteEn: schema.supplierDocumentRequirementRules.noteEn,
      sortOrder: schema.supplierDocumentRequirementRules.sortOrder,
      active: schema.supplierDocumentRequirementRules.active,
    })
    .from(schema.supplierDocumentRequirementRules)
    .where(eq(schema.supplierDocumentRequirementRules.key, launchRequirementRules[0].key));
  assert.deepEqual(restoredRule, { ...launchRequirementRules[0], active: true });

  const triggerRows = await database.execute(sql`
    select tgname
    from pg_trigger
    where tgrelid = 'supplier_document_review_events'::regclass
      and not tgisinternal
      and tgname = 'supplier_document_review_events_immutable'
  `);
  assert.equal(triggerRows.rows.length, 1, "review history must have an immutable trigger");

  const replacementIndexRows = await database.execute(sql`
    select indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'supplier_company_documents'
      and indexname = 'supplier_company_documents_replaces_once_idx'
  `);
  assert.equal(replacementIndexRows.rows.length, 1, "each document version may be replaced once");

  console.log(
    "Supplier document foundation verified: exact active catalogue and rules, deterministic ordering, archival, repair, idempotent seeding, immutable review history and single replacement lineage passed.",
  );
} finally {
  await database
    .delete(schema.supplierDocumentRequirementRules)
    .where(eq(schema.supplierDocumentRequirementRules.key, legacyRuleKey));
  await database
    .delete(schema.supplierCompanyDocumentTypes)
    .where(eq(schema.supplierCompanyDocumentTypes.key, legacyDocumentTypeKey));
  await client.end();
}

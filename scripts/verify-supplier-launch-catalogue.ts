import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import * as schema from "../app/lib/db/schema";
import {
  launchProductionCapabilities,
  launchSupplierTypes,
  type SupplierCatalogueEntry,
} from "../app/lib/supplier/catalogue";
import { seedSupplierLaunchCatalogue } from "../app/lib/supplier/catalogue.server";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for Supplier launch catalogue verification.");
}

function expectedRows(entries: readonly SupplierCatalogueEntry[]) {
  return entries.map((entry) => ({ ...entry, active: true }));
}

const client = new Client({ connectionString });
await client.connect();
const database = drizzle(client, { schema });
const suffix = randomUUID().replaceAll("-", "_");
const legacySupplierTypeKey = `supplier_type.legacy_${suffix}`;
const legacyCapabilityKey = `production_capability.legacy_${suffix}`;

try {
  await database.insert(schema.supplierTypes).values({
    key: legacySupplierTypeKey,
    labelTr: "Eski özel tedarikçi tipi",
    labelEn: "Legacy custom supplier type",
    active: true,
    sortOrder: 999,
  });
  await database.insert(schema.productionCapabilities).values({
    key: legacyCapabilityKey,
    labelTr: "Eski özel üretim kabiliyeti",
    labelEn: "Legacy custom production capability",
    active: true,
    sortOrder: 999,
  });

  const first = await seedSupplierLaunchCatalogue(database);
  assert.deepEqual(first, {
    supplierTypes: launchSupplierTypes.length,
    productionCapabilities: launchProductionCapabilities.length,
  });

  const activeSupplierTypes = await database
    .select({
      key: schema.supplierTypes.key,
      labelTr: schema.supplierTypes.labelTr,
      labelEn: schema.supplierTypes.labelEn,
      sortOrder: schema.supplierTypes.sortOrder,
      active: schema.supplierTypes.active,
    })
    .from(schema.supplierTypes)
    .where(eq(schema.supplierTypes.active, true))
    .orderBy(asc(schema.supplierTypes.sortOrder), asc(schema.supplierTypes.key));
  assert.deepEqual(activeSupplierTypes, expectedRows(launchSupplierTypes));

  const activeCapabilities = await database
    .select({
      key: schema.productionCapabilities.key,
      labelTr: schema.productionCapabilities.labelTr,
      labelEn: schema.productionCapabilities.labelEn,
      sortOrder: schema.productionCapabilities.sortOrder,
      active: schema.productionCapabilities.active,
    })
    .from(schema.productionCapabilities)
    .where(eq(schema.productionCapabilities.active, true))
    .orderBy(
      asc(schema.productionCapabilities.sortOrder),
      asc(schema.productionCapabilities.key),
    );
  assert.deepEqual(activeCapabilities, expectedRows(launchProductionCapabilities));

  const [archivedType] = await database
    .select({ active: schema.supplierTypes.active })
    .from(schema.supplierTypes)
    .where(eq(schema.supplierTypes.key, legacySupplierTypeKey));
  assert.equal(archivedType?.active, false);

  const [archivedCapability] = await database
    .select({ active: schema.productionCapabilities.active })
    .from(schema.productionCapabilities)
    .where(eq(schema.productionCapabilities.key, legacyCapabilityKey));
  assert.equal(archivedCapability?.active, false);

  await database
    .update(schema.supplierTypes)
    .set({ labelTr: "Bozuk etiket", active: false, sortOrder: 777 })
    .where(eq(schema.supplierTypes.key, launchSupplierTypes[0].key));
  await database
    .update(schema.productionCapabilities)
    .set({ labelEn: "Broken label", active: false, sortOrder: 777 })
    .where(eq(schema.productionCapabilities.key, launchProductionCapabilities[0].key));

  await seedSupplierLaunchCatalogue(database);
  await seedSupplierLaunchCatalogue(database);

  const [restoredType] = await database
    .select({
      key: schema.supplierTypes.key,
      labelTr: schema.supplierTypes.labelTr,
      labelEn: schema.supplierTypes.labelEn,
      sortOrder: schema.supplierTypes.sortOrder,
      active: schema.supplierTypes.active,
    })
    .from(schema.supplierTypes)
    .where(eq(schema.supplierTypes.key, launchSupplierTypes[0].key));
  assert.deepEqual(restoredType, { ...launchSupplierTypes[0], active: true });

  const [restoredCapability] = await database
    .select({
      key: schema.productionCapabilities.key,
      labelTr: schema.productionCapabilities.labelTr,
      labelEn: schema.productionCapabilities.labelEn,
      sortOrder: schema.productionCapabilities.sortOrder,
      active: schema.productionCapabilities.active,
    })
    .from(schema.productionCapabilities)
    .where(eq(schema.productionCapabilities.key, launchProductionCapabilities[0].key));
  assert.deepEqual(restoredCapability, {
    ...launchProductionCapabilities[0],
    active: true,
  });

  console.log(
    "Supplier launch catalogue verified: exact active inventory, bilingual labels, deterministic ordering, legacy-value archival, repair and repeated idempotent seeding passed.",
  );
} finally {
  await database
    .delete(schema.supplierTypes)
    .where(eq(schema.supplierTypes.key, legacySupplierTypeKey));
  await database
    .delete(schema.productionCapabilities)
    .where(eq(schema.productionCapabilities.key, legacyCapabilityKey));
  await client.end();
}

import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = "scripts/verify-supplier-company-foundation.ts";
let source = readFileSync(path, "utf8");

function replaceOnce(search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Expected Supplier foundation patch target was not found:\n${search}`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  'import * as schema from "../app/lib/db/schema";\nimport {\n',
  'import * as schema from "../app/lib/db/schema";\nimport {\n  launchProductionCapabilities,\n  launchSupplierTypes,\n} from "../app/lib/supplier/catalogue";\nimport { seedSupplierLaunchCatalogue } from "../app/lib/supplier/catalogue.server";\nimport {\n',
);

replaceOnce(
  'const createdCompanyIds: string[] = [];\nconst fixtureSupplierTypeKey = `supplier_type.fixture_${suffix.replaceAll("-", "_")}`;\nconst fixtureCapabilityKey = `production_capability.fixture_${suffix.replaceAll("-", "_")}`;\n',
  'const createdCompanyIds: string[] = [];\nconst launchSupplierTypeKey = launchSupplierTypes[0].key;\nconst launchCapabilityKey = launchProductionCapabilities[0].key;\n',
);

replaceOnce('supplierTypeKeys: [fixtureSupplierTypeKey],', 'supplierTypeKeys: [launchSupplierTypeKey],');
replaceOnce(
  'productionCapabilityKeys: [fixtureCapabilityKey],',
  'productionCapabilityKeys: [launchCapabilityKey],',
);

replaceOnce(
  'try {\n  await assert.rejects(',
  'try {\n  await seedSupplierLaunchCatalogue(database);\n\n  await assert.rejects(',
);

replaceOnce(
  `\n  await database.insert(schema.supplierTypes).values({\n    key: fixtureSupplierTypeKey,\n    labelTr: "Doğrulama tedarikçi tipi",\n    labelEn: "Verification supplier type",\n    sortOrder: 999,\n  });\n  await database.insert(schema.productionCapabilities).values({\n    key: fixtureCapabilityKey,\n    labelTr: "Doğrulama üretim kabiliyeti",\n    labelEn: "Verification production capability",\n    sortOrder: 999,\n  });\n`,
  "",
);

replaceOnce(
  'missing: ["description", "supplier_type", "production_capability"],',
  'missing: ["description", "supplier_type"],',
);
replaceOnce(
  'assert.deepEqual(editorAudit.old_value.supplierTypeKeys, [fixtureSupplierTypeKey]);',
  'assert.deepEqual(editorAudit.old_value.supplierTypeKeys, [launchSupplierTypeKey]);',
);

replaceOnce(
  `  await database\n    .delete(schema.supplierTypes)\n    .where(eq(schema.supplierTypes.key, fixtureSupplierTypeKey));\n  await database\n    .delete(schema.productionCapabilities)\n    .where(eq(schema.productionCapabilities.key, fixtureCapabilityKey));\n`,
  "",
);

writeFileSync(path, source);
unlinkSync(fileURLToPath(import.meta.url));

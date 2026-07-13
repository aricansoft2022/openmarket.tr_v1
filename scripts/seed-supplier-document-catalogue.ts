import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import * as schema from "../app/lib/db/schema";
import { seedSupplierLaunchCatalogue } from "../app/lib/supplier/catalogue.server";
import { seedSupplierDocumentCatalogue } from "../app/lib/supplier/documents/catalogue.server";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for Supplier document catalogue seeding.");
}

const client = new Client({ connectionString });
await client.connect();

try {
  const database = drizzle(client, { schema });
  // Seed the referenced Supplier types first so requirement-rule foreign keys
  // remain deterministic on a fresh database as well as an existing one.
  await seedSupplierLaunchCatalogue(database);
  const result = await seedSupplierDocumentCatalogue(database);
  console.log(
    `Supplier document catalogue seeded: ${result.documentTypes} document types and ${result.requirementRules} requirement rules are active.`,
  );
} finally {
  await client.end();
}

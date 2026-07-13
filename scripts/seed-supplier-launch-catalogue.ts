import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { seedSupplierLaunchCatalogue } from "../app/lib/supplier/catalogue.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for Supplier launch catalogue seeding.");
}

const client = new Client({ connectionString });
await client.connect();

try {
  const database = drizzle(client, { schema });
  const result = await seedSupplierLaunchCatalogue(database);
  console.log(
    `Supplier launch catalogue seeded: ${result.supplierTypes} Supplier types and ${result.productionCapabilities} production capabilities are active.`,
  );
} finally {
  await client.end();
}

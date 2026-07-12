import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

export async function withDatabase<T>(
  env: Pick<Env, "HYPERDRIVE">,
  operation: (database: Database) => Promise<T>,
): Promise<T> {
  const client = new Client({
    connectionString: env.HYPERDRIVE.connectionString,
  });

  await client.connect();

  try {
    const database = drizzle(client, { schema });
    return await operation(database);
  } finally {
    await client.end();
  }
}

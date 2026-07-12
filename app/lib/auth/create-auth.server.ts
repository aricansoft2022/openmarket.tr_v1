import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import type { Database } from "~/lib/db/client.server";
import { withDatabase } from "~/lib/db/client.server";
import * as authSchema from "~/lib/db/schema/auth";

export type AuthEnvironment = Pick<
  Env,
  "HYPERDRIVE" | "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL"
>;

export function createAuth(database: Database, env: AuthEnvironment) {
  return betterAuth({
    appName: "OpenMarket.tr",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(database, {
      provider: "pg",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

export function withAuth<T>(
  env: AuthEnvironment,
  operation: (auth: Auth) => Promise<T>,
): Promise<T> {
  return withDatabase(env, (database) => operation(createAuth(database, env)));
}

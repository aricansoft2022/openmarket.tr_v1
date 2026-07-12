import assert from "node:assert/strict";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import {
  createAuth,
  type AuthEnvironment,
} from "../app/lib/auth/create-auth.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for auth persistence verification.");
}

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("BEGIN");

  try {
    const database = drizzle(client, { schema });
    const auth = createAuth(database, {
      HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
      BETTER_AUTH_SECRET:
        "openmarket-local-auth-verification-secret-2026-07-12",
      BETTER_AUTH_URL: "http://localhost:3000",
    });
    const email = "auth.persistence@example.test";
    const password = "OpenMarket-Auth-Verification-2026";

    const signUp = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: "Auth Persistence Test",
      },
    });

    assert.equal(signUp.user.email, email);
    assert.equal(signUp.user.emailVerified, false);

    const userResult = await client.query(
      'select id, email, email_verified from "user" where email = $1',
      [email],
    );
    assert.equal(userResult.rowCount, 1, "Signup must persist one user.");
    assert.equal(userResult.rows[0]?.email_verified, false);

    const userId = userResult.rows[0]?.id;
    assert(userId, "The persisted user must have an ID.");

    const accountResult = await client.query(
      `
        select account_id, provider_id, password
        from account
        where user_id = $1
      `,
      [userId],
    );
    assert.equal(
      accountResult.rowCount,
      1,
      "Signup must persist one credential account.",
    );
    assert.equal(accountResult.rows[0]?.provider_id, "credential");
    assert.equal(accountResult.rows[0]?.account_id, userId);
    assert.notEqual(
      accountResult.rows[0]?.password,
      password,
      "The stored password must not be plaintext.",
    );

    const signIn = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    assert.equal(signIn.user.email, email);

    const sessionResult = await client.query(
      `
        select token, expires_at
        from session
        where user_id = $1
      `,
      [userId],
    );
    assert(
      (sessionResult.rowCount ?? 0) >= 1,
      "Signup/signin must persist at least one session.",
    );
    assert(
      sessionResult.rows.every(
        (row) =>
          typeof row.token === "string" &&
          row.token.length > 0 &&
          row.expires_at instanceof Date,
      ),
      "Persisted sessions must have tokens and expiration timestamps.",
    );

    console.log(
      "Better Auth persistence verified: signup, credential account, signin and session storage passed.",
    );
  } finally {
    await client.query("ROLLBACK");
  }
} finally {
  await client.end();
}

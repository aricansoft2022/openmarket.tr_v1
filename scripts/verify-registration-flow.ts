import assert from "node:assert/strict";

import "dotenv/config";
import { Client } from "pg";

import { registerWithPreferences } from "../app/lib/auth/registration.server";
import type { AuthEnvironment } from "../app/lib/auth/create-auth.server";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for registration verification.");
}

const env: AuthEnvironment = {
  HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
  BETTER_AUTH_SECRET: "openmarket-registration-verification-secret-2026-07-12",
  BETTER_AUTH_URL: "http://localhost:3000",
};

function request(): Request {
  return new Request("http://localhost:3000/kayit", {
    method: "POST",
    headers: { "user-agent": "openmarket-registration-verifier" },
  });
}

const validEmail = "registration.preferences@example.test";
const rollbackEmail = "registration.rollback@example.test";

const response = await registerWithPreferences(env, request(), {
  name: "Registration Preference Test",
  email: validEmail,
  password: "OpenMarket-Registration-2026",
  country: "Türkiye",
  preferredLanguage: "tr",
  intendedUse: "both",
});

assert.equal(response.status, 200, "Valid registration must succeed.");

const client = new Client({ connectionString });
await client.connect();

try {
  const preferenceResult = await client.query(
    `
      select
        u.email,
        p.country,
        p.preferred_language,
        p.intended_use
      from "user" u
      join user_preferences p on p.user_id = u.id
      where u.email = $1
    `,
    [validEmail],
  );

  assert.equal(preferenceResult.rowCount, 1, "Registration must persist one preference row.");
  assert.deepEqual(preferenceResult.rows[0], {
    email: validEmail,
    country: "Türkiye",
    preferred_language: "tr",
    intended_use: "both",
  });

  await assert.rejects(
    registerWithPreferences(env, request(), {
      name: "Rollback Test",
      email: rollbackEmail,
      password: "OpenMarket-Rollback-2026",
      country: "X",
      preferredLanguage: "en",
      intendedUse: "buyer",
    }),
    /user_preferences_country_length_check/,
    "A preference constraint failure must reject the whole registration transaction.",
  );

  const rollbackResult = await client.query(
    `
      select
        count(*) filter (where u.email = $1)::int as user_count,
        count(a.id) filter (where u.email = $1)::int as account_count
      from "user" u
      left join account a on a.user_id = u.id
    `,
    [rollbackEmail],
  );

  assert.deepEqual(
    rollbackResult.rows[0],
    { user_count: 0, account_count: 0 },
    "Failed preference persistence must not leave a user or credential account.",
  );

  console.log(
    "Registration verified: required preferences persisted and preference failure rolled back user/account writes.",
  );
} finally {
  await client.end();
}

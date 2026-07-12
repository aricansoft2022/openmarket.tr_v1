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
  return new Request("http://localhost:3000/auth/register", {
    method: "POST",
    headers: { "user-agent": "openmarket-registration-verifier" },
  });
}

function containsConstraint(error: unknown, expectedConstraint: string): boolean {
  let current: unknown = error;
  const visited = new Set<unknown>();

  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);
    const record = current as {
      cause?: unknown;
      constraint?: unknown;
      message?: unknown;
    };

    if (record.constraint === expectedConstraint) return true;
    if (typeof record.message === "string" && record.message.includes(expectedConstraint)) {
      return true;
    }

    current = record.cause;
  }

  return false;
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

  const validOutbox = await client.query(
    `
      select event_type, payload
      from outbox_events
      where payload->>'recipient' = $1
    `,
    [validEmail],
  );
  assert.equal(validOutbox.rowCount, 1, "Registration must atomically enqueue verification.");
  assert.equal(validOutbox.rows[0]?.event_type, "auth.email-verification.requested");
  assert.equal(validOutbox.rows[0]?.payload?.locale, "tr");

  const duplicate = await registerWithPreferences(env, request(), {
    name: "Duplicate Registration Attempt",
    email: validEmail,
    password: "OpenMarket-Duplicate-2026",
    country: "Germany",
    preferredLanguage: "en",
    intendedUse: "buyer",
  });
  assert.equal(duplicate.status, 200, "Existing-email signup must keep a generic success response.");

  const unchangedPreference = await client.query(
    `
      select country, preferred_language, intended_use
      from user_preferences p
      join "user" u on u.id = p.user_id
      where u.email = $1
    `,
    [validEmail],
  );
  assert.deepEqual(
    unchangedPreference.rows[0],
    { country: "Türkiye", preferred_language: "tr", intended_use: "both" },
    "A duplicate signup must not overwrite existing preferences.",
  );

  await assert.rejects(
    registerWithPreferences(env, request(), {
      name: "Rollback Test",
      email: rollbackEmail,
      password: "OpenMarket-Rollback-2026",
      country: "X",
      preferredLanguage: "en",
      intendedUse: "buyer",
    }),
    (error) => containsConstraint(error, "user_preferences_country_length_check"),
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

  const rollbackOutbox = await client.query(
    `select count(*)::int as count from outbox_events where payload->>'recipient' = $1`,
    [rollbackEmail],
  );
  assert.equal(
    rollbackOutbox.rows[0]?.count,
    0,
    "Failed preference persistence must roll back the verification outbox event.",
  );

  console.log(
    "Registration verified: preferences and verification outbox are atomic; duplicate signup is non-destructive.",
  );
} finally {
  await client.end();
}

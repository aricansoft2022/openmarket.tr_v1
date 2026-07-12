import assert from "node:assert/strict";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";

if (!connectionString) {
  throw new Error("DATABASE_URL is required for Google OAuth verification.");
}

function socialRequest(): Request {
  return new Request(`${baseUrl}/api/auth/sign-in/social`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: baseUrl,
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL: `${baseUrl}/auth/callback?status=success`,
      errorCallbackURL: `${baseUrl}/auth/callback?status=error`,
    }),
  });
}

async function authorizationUrl(response: Response): Promise<URL | null> {
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    return location ? new URL(location) : null;
  }

  try {
    const payload = (await response.clone().json()) as { url?: unknown };
    return typeof payload.url === "string" ? new URL(payload.url) : null;
  } catch {
    return null;
  }
}

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("BEGIN");

  try {
    const database = drizzle(client, { schema });
    const baseEnvironment: AuthEnvironment = {
      HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
      BETTER_AUTH_SECRET: "openmarket-google-policy-verification-secret-2026-07-12",
      BETTER_AUTH_URL: baseUrl,
    };

    const unavailableAuth = createAuth(database, baseEnvironment);
    const unavailableResponse = await unavailableAuth.handler(socialRequest());
    assert.notEqual(
      unavailableResponse.status,
      200,
      "Google OAuth must remain unavailable when credentials are incomplete.",
    );
    assert.equal(
      await authorizationUrl(unavailableResponse),
      null,
      "Unavailable Google OAuth must not produce an authorization URL.",
    );

    const configuredAuth = createAuth(database, {
      ...baseEnvironment,
      GOOGLE_CLIENT_ID: "openmarket-ci.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: "openmarket-ci-google-secret",
    });
    const configuredResponse = await configuredAuth.handler(socialRequest());
    const url = await authorizationUrl(configuredResponse);

    assert(url, "Configured Google OAuth must produce an authorization URL.");
    assert.equal(url.protocol, "https:");
    assert.equal(url.hostname, "accounts.google.com");
    assert.equal(url.searchParams.get("client_id"), "openmarket-ci.apps.googleusercontent.com");
    assert.equal(
      url.searchParams.get("redirect_uri"),
      `${baseUrl}/api/auth/callback/google`,
      "Google must return through Better Auth's provider callback.",
    );
    assert.equal(url.searchParams.get("response_type"), "code");
    assert(url.searchParams.get("state"), "OAuth authorization must include state protection.");
    assert.equal(url.searchParams.get("prompt"), "select_account");

    const scopes = new Set((url.searchParams.get("scope") ?? "").split(" "));
    for (const requiredScope of ["openid", "email", "profile"]) {
      assert(scopes.has(requiredScope), `Missing required Google scope: ${requiredScope}`);
    }
    assert.equal(
      url.searchParams.has("client_secret"),
      false,
      "The Google client secret must never appear in the browser authorization URL.",
    );

    const persistedAuthRows = await client.query(`
      select
        (select count(*)::int from "user") as users,
        (select count(*)::int from account) as accounts,
        (select count(*)::int from session) as sessions
    `);
    assert.deepEqual(
      persistedAuthRows.rows[0],
      { users: 0, accounts: 0, sessions: 0 },
      "Starting Google OAuth must not create an identity or session before callback validation.",
    );

    console.log(
      "Google OAuth policy verified: credential gating, minimal authorization URL, callback, state, scope and secret protection passed.",
    );
  } finally {
    await client.query("ROLLBACK");
  }
} finally {
  await client.end();
}

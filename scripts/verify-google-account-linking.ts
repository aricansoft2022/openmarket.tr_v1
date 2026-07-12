import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import {
  beginGoogleAccountLink,
  loadAccountSecurity,
  unlinkGoogleAccount,
} from "../app/lib/auth/account-linking.server";
import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import { authRequest } from "../app/lib/auth/registration.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";

if (!connectionString) {
  throw new Error("DATABASE_URL is required for Google account-linking verification.");
}

function requestCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  assert(setCookie, "Signin must return a session cookie.");
  return setCookie.split(";")[0]!;
}

function incomingRequest(path: string, cookie?: string): Request {
  const headers = new Headers({
    origin: baseUrl,
    "user-agent": "openmarket-linking-verification",
    "cf-connecting-ip": "203.0.113.44",
    "cf-ray": `link-test-${randomUUID()}`,
  });
  if (cookie) headers.set("cookie", cookie);
  return new Request(new URL(path, baseUrl), { headers });
}

const client = new Client({ connectionString });
await client.connect();

const suffix = randomUUID();
const email = `google-linking-${suffix}@example.test`;
const password = "OpenMarket-Google-Linking-2026";
let userId: string | undefined;

try {
  const database = drizzle(client, { schema });
  const environment: AuthEnvironment = {
    HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
    BETTER_AUTH_SECRET: "openmarket-google-linking-verification-secret-2026-07-12",
    BETTER_AUTH_URL: baseUrl,
    GOOGLE_CLIENT_ID: "openmarket-linking-ci.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "openmarket-linking-ci-google-secret",
  };
  const auth = createAuth(database, environment);
  const publicRequest = incomingRequest("/auth/register");

  const signupResponse = await auth.handler(
    authRequest(publicRequest, "/api/auth/sign-up/email", {
      email,
      password,
      name: "Google Linking Test",
      callbackURL: `${baseUrl}/auth/verify-email/result?verified=1`,
    }),
  );
  assert(signupResponse.ok, `Signup failed with ${signupResponse.status}.`);

  const userResult = await client.query('select id from "user" where email = $1', [email]);
  userId = userResult.rows[0]?.id;
  assert(userId, "Signup must persist a user.");
  await client.query('update "user" set email_verified = true where id = $1', [userId]);

  const signinResponse = await auth.handler(
    authRequest(publicRequest, "/api/auth/sign-in/email", { email, password }),
  );
  assert(signinResponse.ok, `Signin failed with ${signinResponse.status}.`);
  const cookie = requestCookie(signinResponse);
  const authenticatedRequest = incomingRequest("/account/security", cookie);

  const initial = await loadAccountSecurity(environment, authenticatedRequest);
  assert(initial, "Authenticated account-security loader must resolve a session.");
  assert.equal(initial.googleLinked, false);
  assert.equal(initial.methods.length, 1);
  assert.equal(initial.methods[0]?.providerId, "credential");

  const wrongPassword = await beginGoogleAccountLink(environment, authenticatedRequest, "wrong-password");
  assert.equal(wrongPassword.status, 403, "Linking must require the current password.");

  const linkResponse = await beginGoogleAccountLink(environment, authenticatedRequest, password);
  assert.equal(linkResponse.status, 302, "Explicit linking must produce a provider redirect.");
  const authorizationUrl = new URL(linkResponse.headers.get("location")!);
  assert.equal(authorizationUrl.hostname, "accounts.google.com");
  assert.equal(
    authorizationUrl.searchParams.get("redirect_uri"),
    `${baseUrl}/api/auth/callback/google`,
  );
  assert(authorizationUrl.searchParams.get("state"), "Linking must include OAuth state.");
  assert.equal(authorizationUrl.searchParams.has("client_secret"), false);

  const beforeCallback = await client.query(
    "select count(*)::int as count from account where user_id = $1 and provider_id = 'google'",
    [userId],
  );
  assert.equal(
    beforeCallback.rows[0]?.count,
    0,
    "Starting explicit linking must not persist a Google account before callback validation.",
  );

  const googleAccountId = `google-sub-${suffix}`;
  const googleInternalId = randomUUID();
  await client.query(
    `
      insert into account (id, user_id, account_id, provider_id)
      values ($1, $2, $3, 'google')
    `,
    [googleInternalId, userId, googleAccountId],
  );

  const completedRequest = incomingRequest("/account/security?linked=success", cookie);
  const linked = await loadAccountSecurity(environment, completedRequest);
  assert(linked?.googleLinked, "Completed link must appear in the account-security snapshot.");
  assert.equal(linked?.canUnlinkGoogle, true, "Credential access must keep Google removable.");

  const linkedAudit = await client.query(
    `
      select action, new_value
      from audit_logs
      where actor_id = $1 and resource_id = $2 and action = 'auth.account.linked'
    `,
    [userId, googleInternalId],
  );
  assert.equal(linkedAudit.rowCount, 1, "Completed linking must be audited once.");
  assert.equal(linkedAudit.rows[0]?.new_value?.providerId, "google");

  const unlinkResponse = await unlinkGoogleAccount(environment, authenticatedRequest, password);
  assert(unlinkResponse.ok, `Unlink failed with ${unlinkResponse.status}.`);

  const remaining = await client.query(
    "select provider_id from account where user_id = $1 order by provider_id",
    [userId],
  );
  assert.deepEqual(
    remaining.rows.map((row) => row.provider_id),
    ["credential"],
    "Unlinking Google must preserve the credential login method.",
  );

  const unlinkedAudit = await client.query(
    `
      select action, old_value
      from audit_logs
      where actor_id = $1 and resource_id = $2 and action = 'auth.account.unlinked'
    `,
    [userId, googleInternalId],
  );
  assert.equal(unlinkedAudit.rowCount, 1, "Unlinking must be audited once.");
  assert.equal(unlinkedAudit.rows[0]?.old_value?.providerId, "google");

  const afterUnlink = await loadAccountSecurity(environment, authenticatedRequest);
  assert.equal(afterUnlink?.googleLinked, false);
  assert.equal(afterUnlink?.canUnlinkGoogle, false);

  console.log(
    "Google account linking verified: session and password gates, provider redirect, pre-callback zero write, list, unlink, last-method preservation and audit evidence passed.",
  );
} finally {
  if (userId) {
    await client.query('delete from "user" where id = $1', [userId]);
  }
  await client.end();
}

import assert from "node:assert/strict";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";

if (!connectionString) {
  throw new Error("DATABASE_URL is required for auth recovery verification.");
}

function post(path: string, body: unknown, locale?: "tr" | "en"): Request {
  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/json",
    origin: baseUrl,
  });
  if (locale) headers.set("x-openmarket-locale", locale);

  return new Request(new URL(path, baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function isRedirect(response: Response): boolean {
  return [301, 302, 303, 307, 308].includes(response.status);
}

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("BEGIN");

  try {
    const database = drizzle(client, { schema });
    const auth = createAuth(database, {
      HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
      BETTER_AUTH_SECRET: "openmarket-recovery-verification-secret-2026-07-12",
      BETTER_AUTH_URL: baseUrl,
    });
    const email = "auth.recovery@example.test";
    const password = "OpenMarket-Recovery-Old-2026";
    const newPassword = "OpenMarket-Recovery-New-2026";

    const signUpResponse = await auth.handler(
      post(
        "/api/auth/sign-up/email",
        {
          email,
          password,
          name: "Auth Recovery Test",
          callbackURL: `${baseUrl}/auth/verify-email/result?verified=1`,
        },
        "en",
      ),
    );
    assert.equal(signUpResponse.status, 200, "Signup must succeed before verification.");

    const userResult = await client.query(
      'select id, email_verified from "user" where email = $1',
      [email],
    );
    const userId = userResult.rows[0]?.id;
    assert(userId, "Recovery test user must exist.");
    assert.equal(userResult.rows[0]?.email_verified, false);

    const initialVerificationOutbox = await client.query(
      `
        select payload, expires_at
        from outbox_events
        where aggregate_id = $1
          and event_type = 'auth.email-verification.requested'
        order by created_at desc
        limit 1
      `,
      [userId],
    );
    assert.equal(initialVerificationOutbox.rowCount, 1);
    assert.equal(initialVerificationOutbox.rows[0]?.payload?.locale, "en");
    assert.equal(initialVerificationOutbox.rows[0]?.payload?.template, "auth.verify-email");
    assert(initialVerificationOutbox.rows[0]?.expires_at > new Date());

    const unverifiedSignIn = await auth.handler(
      post("/api/auth/sign-in/email", { email, password }),
    );
    assert.equal(unverifiedSignIn.status, 403, "Unverified users must not receive a session.");

    const latestVerificationOutbox = await client.query(
      `
        select payload
        from outbox_events
        where aggregate_id = $1
          and event_type = 'auth.email-verification.requested'
        order by created_at desc
        limit 1
      `,
      [userId],
    );
    const verificationActionUrl = latestVerificationOutbox.rows[0]?.payload?.actionUrl;
    assert.equal(typeof verificationActionUrl, "string");

    const verificationResponse = await auth.handler(new Request(verificationActionUrl));
    assert(isRedirect(verificationResponse), "Verification action must redirect to the result route.");
    const verificationLocation = verificationResponse.headers.get("location");
    assert(verificationLocation?.includes("/auth/verify-email/result"));

    const verifiedUser = await client.query(
      'select email_verified from "user" where id = $1',
      [userId],
    );
    assert.equal(verifiedUser.rows[0]?.email_verified, true);

    const verifiedSignIn = await auth.handler(
      post("/api/auth/sign-in/email", { email, password }),
    );
    assert.equal(verifiedSignIn.status, 200, "Verified users must be able to sign in.");

    const activeSessions = await client.query(
      "select count(*)::int as count from session where user_id = $1",
      [userId],
    );
    assert((activeSessions.rows[0]?.count ?? 0) >= 1);

    const unknownReset = await auth.handler(
      post(
        "/api/auth/request-password-reset",
        {
          email: "unknown.recovery@example.test",
          redirectTo: `${baseUrl}/auth/reset-password`,
        },
        "tr",
      ),
    );
    assert.equal(unknownReset.status, 200, "Unknown email reset requests must be generic success.");
    const unknownOutbox = await client.query(
      `select count(*)::int as count from outbox_events where payload->>'recipient' = $1`,
      ["unknown.recovery@example.test"],
    );
    assert.equal(unknownOutbox.rows[0]?.count, 0);

    const resetRequest = await auth.handler(
      post(
        "/api/auth/request-password-reset",
        { email, redirectTo: `${baseUrl}/auth/reset-password` },
        "tr",
      ),
    );
    assert.equal(resetRequest.status, 200);

    const resetOutbox = await client.query(
      `
        select payload
        from outbox_events
        where aggregate_id = $1
          and event_type = 'auth.password-reset.requested'
        order by created_at desc
        limit 1
      `,
      [userId],
    );
    assert.equal(resetOutbox.rows[0]?.payload?.locale, "tr");
    const resetActionUrl = resetOutbox.rows[0]?.payload?.actionUrl;
    assert.equal(typeof resetActionUrl, "string");

    const resetRedirect = await auth.handler(new Request(resetActionUrl));
    assert(isRedirect(resetRedirect), "Reset action link must redirect to the reset form.");
    const resetLocation = resetRedirect.headers.get("location");
    assert(resetLocation, "Reset action redirect must include a location.");
    const resetToken = new URL(resetLocation, baseUrl).searchParams.get("token");
    assert(resetToken, "Reset form redirect must include a valid token.");

    const resetResponse = await auth.handler(
      post("/api/auth/reset-password", { token: resetToken, newPassword }),
    );
    assert.equal(resetResponse.status, 200, "A valid reset token must update the password.");

    const sessionsAfterReset = await client.query(
      "select count(*)::int as count from session where user_id = $1",
      [userId],
    );
    assert.equal(sessionsAfterReset.rows[0]?.count, 0, "Password reset must revoke sessions.");

    const oldPasswordSignIn = await auth.handler(
      post("/api/auth/sign-in/email", { email, password }),
    );
    assert.notEqual(oldPasswordSignIn.status, 200, "The previous password must stop working.");

    const newPasswordSignIn = await auth.handler(
      post("/api/auth/sign-in/email", { email, password: newPassword }),
    );
    assert.equal(newPasswordSignIn.status, 200, "The new password must work.");

    const replayResponse = await auth.handler(
      post("/api/auth/reset-password", { token: resetToken, newPassword: password }),
    );
    assert.notEqual(replayResponse.status, 200, "A reset token must be single-use.");

    const expiringRequest = await auth.handler(
      post("/api/auth/request-password-reset", {
        email,
        redirectTo: `${baseUrl}/auth/reset-password`,
      }),
    );
    assert.equal(expiringRequest.status, 200);
    const expiringOutbox = await client.query(
      `
        select payload
        from outbox_events
        where aggregate_id = $1
          and event_type = 'auth.password-reset.requested'
        order by created_at desc
        limit 1
      `,
      [userId],
    );
    const expiringActionUrl = expiringOutbox.rows[0]?.payload?.actionUrl;
    assert.equal(typeof expiringActionUrl, "string");

    await client.query("update verification set expires_at = now() - interval '1 minute'");
    const expiredRedirect = await auth.handler(new Request(expiringActionUrl));
    assert(isRedirect(expiredRedirect));
    assert(
      expiredRedirect.headers.get("location")?.toLowerCase().includes("error"),
      "Expired token redirects must expose only a token-error state.",
    );

    console.log(
      "Auth recovery verified: verification gate, bilingual outbox, reset revocation, replay and expiry checks passed.",
    );
  } finally {
    await client.query("ROLLBACK");
  }
} finally {
  await client.end();
}

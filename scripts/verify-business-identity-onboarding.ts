import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import { authRequest, registerWithPreferences } from "../app/lib/auth/registration.server";
import {
  chooseWorkspace,
  loadOnboardingState,
  OnboardingActionError,
  submitOnboardingIdentity,
} from "../app/lib/business-identity/onboarding.server";
import { decideBusinessIdentityReview } from "../app/lib/business-identity/transitions.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";

if (!connectionString) {
  throw new Error("DATABASE_URL is required for business identity onboarding verification.");
}

function request(path: string, cookie?: string): Request {
  const headers = new Headers({
    origin: baseUrl,
    "user-agent": "openmarket-onboarding-verification",
    "cf-connecting-ip": "203.0.113.55",
    "cf-ray": `onboarding-${randomUUID()}`,
  });
  if (cookie) headers.set("cookie", cookie);
  return new Request(new URL(path, baseUrl), { headers });
}

function cookieFrom(response: Response): string {
  const cookie = response.headers.get("set-cookie");
  assert(cookie, "Signin must issue a session cookie.");
  return cookie.split(";")[0]!;
}

const client = new Client({ connectionString });
await client.connect();
const database = drizzle(client, { schema });

const suffix = randomUUID();
const email = `onboarding-${suffix}@gmail.com`;
const reviewerId = randomUUID();
let userId: string | undefined;

const environment: AuthEnvironment = {
  HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
  BETTER_AUTH_SECRET: "openmarket-business-identity-onboarding-test-secret-2026",
  BETTER_AUTH_URL: baseUrl,
};

try {
  await database.insert(schema.user).values({
    id: reviewerId,
    name: "Identity Reviewer Fixture",
    email: `reviewer-${suffix}@openmarket.test`,
    emailVerified: true,
  });
  await database
    .insert(schema.emailDomainPolicies)
    .values({
      domain: "gmail.com",
      kind: "public_email",
      reason: "Public provider fixture",
      createdBy: reviewerId,
    })
    .onConflictDoNothing();

  const publicRequest = request("/auth/register");
  const registration = await registerWithPreferences(environment, publicRequest, {
    name: "Onboarding Buyer",
    email,
    password: "OpenMarket-Onboarding-2026",
    country: "Türkiye",
    preferredLanguage: "tr",
    intendedUse: "buyer",
  });
  assert(registration.ok, `Registration failed with ${registration.status}.`);

  const userResult = await client.query('select id from "user" where email = $1', [email]);
  userId = userResult.rows[0]?.id;
  assert(userId, "Registration must persist a user.");
  await client.query('update "user" set email_verified = true where id = $1', [userId]);

  const auth = createAuth(database, environment);
  const signin = await auth.handler(
    authRequest(publicRequest, "/api/auth/sign-in/email", {
      email,
      password: "OpenMarket-Onboarding-2026",
    }),
  );
  assert(signin.ok, `Signin failed with ${signin.status}.`);
  const cookie = cookieFrom(signin);
  const workspaceRequest = request("/onboarding/workspaces", cookie);

  const initial = await loadOnboardingState(environment, workspaceRequest);
  assert(initial, "Authenticated onboarding state must resolve.");
  assert.equal(initial.intendedUse, "buyer");
  assert.equal(initial.latestReview, null);
  assert.equal(initial.canSubmitIdentity, true);

  const widened = await chooseWorkspace(environment, workspaceRequest, "supplier");
  assert.equal(widened, "both", "Buyer plus Supplier must widen to Both.");

  const submission = await submitOnboardingIdentity(
    environment,
    request("/onboarding/business-identity", cookie),
    {
      companyName: "Public Domain Buyer",
      companyEmail: email,
      applicantNote: "Manual exception review required.",
    },
  );
  assert.equal(submission.classification, "public_email");
  assert.equal(submission.reviewStatus, "pending");
  assert.equal(submission.buyerStatus, "browser");

  await assert.rejects(
    submitOnboardingIdentity(environment, request("/onboarding/business-identity", cookie), {
      companyName: "Duplicate Pending Review",
      companyEmail: email,
    }),
    (error: unknown) =>
      error instanceof OnboardingActionError && error.code === "PENDING_REVIEW_EXISTS",
  );

  const pending = await loadOnboardingState(
    environment,
    request("/onboarding/business-identity/status", cookie),
  );
  assert.equal(pending?.intendedUse, "both");
  assert.equal(pending?.latestReview?.status, "pending");
  assert.equal(pending?.latestReview?.method, "manual_exception");
  assert.equal(pending?.buyerStatus, "browser");
  assert.equal(pending?.canSubmitIdentity, false);

  const decision = await decideBusinessIdentityReview(database, {
    reviewId: submission.reviewId,
    reviewerId,
    decision: "verified",
    reviewNote: "Manual fixture approved.",
    requestId: "onboarding-manual-approval",
  });
  assert.deepEqual(decision, { reviewStatus: "verified", buyerStatus: "active" });

  const verified = await loadOnboardingState(
    environment,
    request("/onboarding/business-identity/status", cookie),
  );
  assert.equal(verified?.latestReview?.status, "verified");
  assert.equal(verified?.buyerStatus, "active");
  assert.equal(verified?.canResubmitIdentity, false);

  await assert.rejects(
    submitOnboardingIdentity(environment, request("/onboarding/business-identity", cookie), {
      companyName: "Verified Duplicate",
      companyEmail: email,
    }),
    (error: unknown) =>
      error instanceof OnboardingActionError && error.code === "IDENTITY_ALREADY_VERIFIED",
  );

  const evidence = await client.query(
    `
      select action, count(*)::int as count
      from audit_logs
      where actor_id in ($1, $2)
        and action in (
          'workspace.intent.expanded',
          'business_identity.submitted',
          'business_identity.verified'
        )
      group by action
      order by action
    `,
    [userId, reviewerId],
  );
  assert.deepEqual(evidence.rows, [
    { action: "business_identity.submitted", count: 1 },
    { action: "business_identity.verified", count: 1 },
    { action: "workspace.intent.expanded", count: 1 },
  ]);

  console.log(
    "A08-A10 onboarding verified: authenticated state, workspace widening, pending manual review, duplicate-pending guard, manual approval, active Buyer state and audit evidence passed.",
  );
} finally {
  if (userId) await client.query('delete from "user" where id = $1', [userId]);
  await client.query('delete from "user" where id = $1', [reviewerId]);
  await client.end();
}

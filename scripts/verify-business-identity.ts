import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import {
  BusinessIdentityTransitionError,
  assertActiveBuyer,
  decideBusinessIdentityReview,
  selectWorkspaceIntent,
  submitBusinessIdentity,
} from "../app/lib/business-identity/transitions.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for business identity verification.");
}

const client = new Client({ connectionString });
await client.connect();
await client.query("begin");

const database = drizzle(client, { schema });
const now = new Date("2026-07-12T20:30:00.000Z");

async function createUser(input: {
  email: string;
  emailVerified?: boolean;
  intendedUse: schema.IntendedUse;
}) {
  const id = randomUUID();
  await database.insert(schema.user).values({
    id,
    name: `Identity Test ${input.email}`,
    email: input.email,
    emailVerified: input.emailVerified ?? true,
    createdAt: now,
    updatedAt: now,
  });
  await database.insert(schema.userPreferences).values({
    userId: id,
    country: "Türkiye",
    preferredLanguage: "tr",
    intendedUse: input.intendedUse,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

try {
  const reviewerId = await createUser({
    email: "reviewer@openmarket.test",
    intendedUse: "supplier",
  });

  await database.insert(schema.emailDomainPolicies).values([
    {
      domain: "gmail.com",
      kind: "public_email",
      reason: "Public email provider",
      createdBy: reviewerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      domain: "blocked.test",
      kind: "blocked",
      reason: "Blocked test domain",
      createdBy: reviewerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      domain: "approved-exception.test",
      kind: "company_exception",
      reason: "Approved company-domain exception",
      createdBy: reviewerId,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const companyBuyerId = await createUser({
    email: "buyer@textile-company.test",
    intendedUse: "buyer",
  });
  const companyResult = await submitBusinessIdentity(database, {
    userId: companyBuyerId,
    companyName: "Textile Company",
    companyEmail: "buyer@textile-company.test",
    requestId: "identity-company-auto",
    now,
  });
  assert.deepEqual(companyResult, {
    reviewId: companyResult.reviewId,
    reviewStatus: "verified",
    companyEmailStatus: "verified",
    buyerStatus: "active",
    classification: "company_candidate",
  });
  await assertActiveBuyer(database, companyBuyerId);

  const exceptionBuyerId = await createUser({
    email: "buyer@approved-exception.test",
    intendedUse: "buyer",
  });
  const exceptionResult = await submitBusinessIdentity(database, {
    userId: exceptionBuyerId,
    companyName: "Approved Exception Company",
    companyEmail: "buyer@approved-exception.test",
    requestId: "identity-company-exception",
    now,
  });
  assert.equal(exceptionResult.classification, "company_exception");
  assert.equal(exceptionResult.reviewStatus, "verified");
  assert.equal(exceptionResult.buyerStatus, "active");

  const publicBuyerId = await createUser({
    email: "buyer@gmail.com",
    intendedUse: "buyer",
  });
  const publicResult = await submitBusinessIdentity(database, {
    userId: publicBuyerId,
    companyName: "Manual Review Company",
    companyEmail: "buyer@gmail.com",
    applicantNote: "Our company currently uses a public provider.",
    requestId: "identity-public-pending",
    now,
  });
  assert.equal(publicResult.classification, "public_email");
  assert.equal(publicResult.reviewStatus, "pending");
  assert.equal(publicResult.companyEmailStatus, "pending");
  assert.equal(publicResult.buyerStatus, "browser");
  await assert.rejects(
    assertActiveBuyer(database, publicBuyerId),
    (error: unknown) =>
      error instanceof BusinessIdentityTransitionError && error.code === "BUYER_NOT_ACTIVE",
  );

  const manualDecision = await decideBusinessIdentityReview(database, {
    reviewId: publicResult.reviewId,
    reviewerId,
    effectiveRole: "compliance_reviewer",
    decision: "verified",
    reviewNote: "Manual business identity evidence approved.",
    requestId: "identity-public-approved",
    now: new Date(now.getTime() + 60_000),
  });
  assert.deepEqual(manualDecision, { reviewStatus: "verified", buyerStatus: "active" });
  await assertActiveBuyer(database, publicBuyerId);
  await assert.rejects(
    decideBusinessIdentityReview(database, {
      reviewId: publicResult.reviewId,
      reviewerId,
      effectiveRole: "compliance_reviewer",
      decision: "rejected",
      reviewNote: "Second decision must fail.",
      rejectionReason: "Already decided",
      now: new Date(now.getTime() + 120_000),
    }),
    (error: unknown) =>
      error instanceof BusinessIdentityTransitionError &&
      error.code === "INVALID_REVIEW_TRANSITION",
  );

  const blockedBuyerId = await createUser({
    email: "buyer@blocked.test",
    intendedUse: "buyer",
  });
  const blockedResult = await submitBusinessIdentity(database, {
    userId: blockedBuyerId,
    companyName: "Blocked Company",
    companyEmail: "buyer@blocked.test",
    requestId: "identity-blocked",
    now,
  });
  assert.equal(blockedResult.classification, "blocked");
  assert.equal(blockedResult.reviewStatus, "rejected");
  assert.equal(blockedResult.companyEmailStatus, "rejected");
  assert.equal(blockedResult.buyerStatus, "browser");

  const separateEmailBuyerId = await createUser({
    email: "owner@account-domain.test",
    intendedUse: "buyer",
  });
  const separateEmailResult = await submitBusinessIdentity(database, {
    userId: separateEmailBuyerId,
    companyName: "Separate Email Company",
    companyEmail: "identity@company-domain.test",
    requestId: "identity-separate-email",
    now,
  });
  assert.equal(separateEmailResult.classification, "company_candidate");
  assert.equal(separateEmailResult.reviewStatus, "pending");
  assert.equal(separateEmailResult.companyEmailStatus, "pending");
  assert.equal(separateEmailResult.buyerStatus, "browser");

  const supplierOnlyId = await createUser({
    email: "supplier@supplier-company.test",
    intendedUse: "supplier",
  });
  const supplierOnlyResult = await submitBusinessIdentity(database, {
    userId: supplierOnlyId,
    companyName: "Supplier Company",
    companyEmail: "supplier@supplier-company.test",
    requestId: "identity-supplier-only",
    now,
  });
  assert.equal(supplierOnlyResult.reviewStatus, "verified");
  assert.equal(supplierOnlyResult.buyerStatus, "not_requested");
  const supplierBuyerProfile = await client.query(
    "select status from buyer_profiles where user_id = $1",
    [supplierOnlyId],
  );
  assert.equal(supplierBuyerProfile.rowCount, 0);

  const workspaceId = await createUser({
    email: "workspace@company.test",
    intendedUse: "buyer",
  });
  assert.equal(
    await selectWorkspaceIntent(database, {
      userId: workspaceId,
      requested: "supplier",
      requestId: "workspace-expand",
      now,
    }),
    "both",
  );
  assert.equal(
    await selectWorkspaceIntent(database, {
      userId: workspaceId,
      requested: "buyer",
      requestId: "workspace-no-narrow",
      now,
    }),
    "both",
  );

  const unverifiedId = await createUser({
    email: "unverified@company.test",
    emailVerified: false,
    intendedUse: "buyer",
  });
  await assert.rejects(
    submitBusinessIdentity(database, {
      userId: unverifiedId,
      companyName: "Unverified Company",
      companyEmail: "unverified@company.test",
      now,
    }),
    (error: unknown) =>
      error instanceof BusinessIdentityTransitionError && error.code === "ACCOUNT_NOT_VERIFIED",
  );

  await client.query("savepoint invalid_buyer_state");
  try {
    await assert.rejects(
      client.query(
        `
          insert into buyer_profiles (user_id, status, activated_at)
          values ($1, 'active', $2)
        `,
        [unverifiedId, now],
      ),
      /buyer_profiles_state_fields_check/,
    );
  } finally {
    await client.query("rollback to savepoint invalid_buyer_state");
    await client.query("release savepoint invalid_buyer_state");
  }

  const publicPolicyEvidence = await client.query(
    `
      select r.status as review_status, r.method, b.status as buyer_status
      from business_identity_reviews r
      join buyer_profiles b on b.user_id = r.user_id
      where r.id = $1
    `,
    [publicResult.reviewId],
  );
  assert.deepEqual(publicPolicyEvidence.rows[0], {
    review_status: "verified",
    method: "manual_exception",
    buyer_status: "active",
  });

  const auditEvidence = await client.query(
    `
      select action, count(*)::int as count
      from audit_logs
      where request_id in (
        'identity-company-auto',
        'identity-public-pending',
        'identity-public-approved',
        'workspace-expand'
      )
      group by action
      order by action
    `,
  );
  assert.deepEqual(auditEvidence.rows, [
    { action: "business_identity.submitted", count: 2 },
    { action: "business_identity.verified", count: 1 },
    { action: "workspace.intent.expanded", count: 1 },
  ]);

  console.log(
    "Business identity verified: company-domain auto verification, public-domain manual review, blocked-domain rejection, workspace expansion, buyer activation gating, immutable audits and database constraints passed.",
  );
} finally {
  await client.query("rollback");
  await client.end();
}

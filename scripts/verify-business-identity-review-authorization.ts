import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { StaffAuthorizationError } from "../app/lib/authorization/platform-staff.server";
import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import { authRequest, registerWithPreferences } from "../app/lib/auth/registration.server";
import {
  uploadBusinessIdentityEvidence,
  type EvidenceEnvironment,
} from "../app/lib/business-identity/evidence.server";
import { submitOnboardingIdentity } from "../app/lib/business-identity/onboarding.server";
import {
  decidePermissionedBusinessIdentityReview,
  downloadStaffBusinessIdentityEvidence,
  loadBusinessIdentityReviewDetail,
  loadBusinessIdentityReviewQueue,
  type StaffReviewEnvironment,
} from "../app/lib/business-identity/review.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";
if (!connectionString) {
  throw new Error("DATABASE_URL is required for staff review authorization verification.");
}

type StoredObject = { bytes: Uint8Array; contentType?: string };

class FakePrivateBucket {
  readonly objects = new Map<string, StoredObject>();

  async put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | Blob | ReadableStream,
    options?: R2PutOptions,
  ) {
    const bytes = new Uint8Array(await new Response(value as BodyInit).arrayBuffer());
    this.objects.set(key, { bytes, contentType: options?.httpMetadata?.contentType });
    return {} as R2Object;
  }

  async get(key: string) {
    const object = this.objects.get(key);
    if (!object) return null;
    return {
      body: new Response(object.bytes).body,
      httpMetadata: { contentType: object.contentType },
    } as R2ObjectBody;
  }

  async delete(key: string) {
    this.objects.delete(key);
  }
}

function request(
  path: string,
  cookie?: string,
  requestId = `staff-review-${randomUUID()}`,
): Request {
  const headers = new Headers({
    origin: baseUrl,
    "user-agent": "openmarket-staff-review-verification",
    "cf-connecting-ip": "203.0.113.88",
    "cf-ray": requestId,
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
const bucket = new FakePrivateBucket();
const suffix = randomUUID();
const createdUserIds: string[] = [];

const authEnvironment: AuthEnvironment = {
  HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
  BETTER_AUTH_SECRET: "openmarket-staff-review-authorization-secret-2026",
  BETTER_AUTH_URL: baseUrl,
};
const environment: StaffReviewEnvironment & EvidenceEnvironment = {
  ...authEnvironment,
  PRIVATE_DOCUMENTS: bucket as unknown as R2Bucket,
};
const auth = createAuth(database, authEnvironment);

async function registerFixture(
  label: string,
  localPart: string,
  intendedUse: schema.IntendedUse,
): Promise<{ id: string; email: string; cookie: string }> {
  const email = `${localPart}-${suffix}@openmarket.test`;
  const password = `OpenMarket-${label}-2026`;
  const registrationRequest = request("/auth/register");
  const registration = await registerWithPreferences(authEnvironment, registrationRequest, {
    name: label,
    email,
    password,
    country: "Türkiye",
    preferredLanguage: "tr",
    intendedUse,
  });
  assert(registration.ok, `${label} registration failed with ${registration.status}.`);

  const result = await client.query('select id from "user" where email = $1', [email]);
  const id = result.rows[0]?.id as string | undefined;
  assert(id, `${label} must persist a user.`);
  createdUserIds.push(id);
  await client.query('update "user" set email_verified = true where id = $1', [id]);

  const signin = await auth.handler(
    authRequest(registrationRequest, "/api/auth/sign-in/email", { email, password }),
  );
  assert(signin.ok, `${label} signin failed with ${signin.status}.`);
  return { id, email, cookie: cookieFrom(signin) };
}

try {
  const admin = await registerFixture("Platform Admin Fixture", "platform-admin", "supplier");
  const reviewer = await registerFixture("Compliance Reviewer Fixture", "reviewer", "supplier");
  const moderator = await registerFixture("RFQ Moderator Fixture", "moderator", "supplier");
  const revokedReviewer = await registerFixture(
    "Revoked Reviewer Fixture",
    "revoked-reviewer",
    "supplier",
  );
  const applicant = await registerFixture("Review Applicant Fixture", "applicant", "buyer");

  await database.insert(schema.platformStaffAssignments).values([
    {
      userId: admin.id,
      role: "platform_admin",
      assignedBy: admin.id,
      assignmentReason: "Initial administrator fixture",
    },
    {
      userId: reviewer.id,
      role: "compliance_reviewer",
      assignedBy: admin.id,
      assignmentReason: "Business identity review fixture",
    },
    {
      userId: moderator.id,
      role: "product_rfq_moderator",
      assignedBy: admin.id,
      assignmentReason: "Moderator denial fixture",
    },
    {
      userId: revokedReviewer.id,
      role: "compliance_reviewer",
      status: "revoked",
      assignedBy: admin.id,
      assignmentReason: "Revocation fixture",
      revokedBy: admin.id,
      revokedAt: new Date(),
      revocationReason: "Review access removed",
    },
    {
      userId: applicant.id,
      role: "compliance_reviewer",
      assignedBy: admin.id,
      assignmentReason: "Self-review denial fixture",
    },
  ]);

  await database
    .insert(schema.emailDomainPolicies)
    .values({
      domain: "gmail.com",
      kind: "public_email",
      reason: "Public provider fixture",
      createdBy: admin.id,
    })
    .onConflictDoNothing();

  const applicantRequest = request(
    "/onboarding/business-identity/evidence",
    applicant.cookie,
    "staff-review-applicant",
  );
  const submission = await submitOnboardingIdentity(authEnvironment, applicantRequest, {
    companyName: "Permissioned Review Company",
    companyEmail: `permissioned-${suffix}@gmail.com`,
    applicantNote: "Manual evidence requires an independent reviewer.",
  });
  assert.equal(submission.reviewStatus, "pending");

  const sourceBytes = new TextEncoder().encode("private reviewer authorization evidence");
  const stored = await uploadBusinessIdentityEvidence(
    environment,
    applicantRequest,
    new File([sourceBytes], "review-evidence.pdf", { type: "application/pdf" }),
  );
  assert.equal(stored.status, "stored_private");

  await assert.rejects(
    loadBusinessIdentityReviewQueue(environment, request("/admin/business-identity/reviews")),
    (error: unknown) =>
      error instanceof StaffAuthorizationError && error.code === "UNAUTHENTICATED",
  );
  await assert.rejects(
    loadBusinessIdentityReviewQueue(
      environment,
      request("/admin/business-identity/reviews", moderator.cookie),
    ),
    (error: unknown) => error instanceof StaffAuthorizationError && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    loadBusinessIdentityReviewQueue(
      environment,
      request("/admin/business-identity/reviews", revokedReviewer.cookie),
    ),
    (error: unknown) => error instanceof StaffAuthorizationError && error.code === "FORBIDDEN",
  );

  const queue = await loadBusinessIdentityReviewQueue(
    environment,
    request("/admin/business-identity/reviews", reviewer.cookie),
  );
  assert.equal(queue.effectiveRole, "compliance_reviewer");
  assert(queue.value.some((review) => review.id === submission.reviewId));

  const detail = await loadBusinessIdentityReviewDetail(
    environment,
    request(`/admin/business-identity/reviews/${submission.reviewId}`, reviewer.cookie),
    submission.reviewId,
  );
  assert.equal(detail.value.applicantId, applicant.id);
  assert.equal(detail.value.evidence.length, 1);
  assert.equal(detail.value.evidence[0]?.id, stored.id);
  assert.equal("objectKey" in detail.value.evidence[0]!, false);

  await assert.rejects(
    loadBusinessIdentityReviewDetail(
      environment,
      request(`/admin/business-identity/reviews/${submission.reviewId}`, applicant.cookie),
      submission.reviewId,
    ),
    (error: unknown) => error instanceof StaffAuthorizationError && error.code === "SELF_REVIEW",
  );

  const download = await downloadStaffBusinessIdentityEvidence(
    environment,
    request(
      `/admin/business-identity/reviews/${submission.reviewId}/evidence/${stored.id}/download`,
      reviewer.cookie,
    ),
    submission.reviewId,
    stored.id,
  );
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()), sourceBytes);

  const decision = await decidePermissionedBusinessIdentityReview(
    environment,
    request(
      `/admin/business-identity/reviews/${submission.reviewId}`,
      reviewer.cookie,
      "staff-review-decision",
    ),
    {
      reviewId: submission.reviewId,
      decision: "verified",
      reviewNote: "Registry evidence matches the applicant company.",
    },
  );
  assert.deepEqual(decision, { reviewStatus: "verified", buyerStatus: "active" });

  const decisionEvidence = await client.query(
    `
      select r.status, r.reviewed_by, b.status as buyer_status, a.effective_role
      from business_identity_reviews r
      join buyer_profiles b on b.user_id = r.user_id
      join audit_logs a on a.resource_id = r.id::text
        and a.action = 'business_identity.verified'
        and a.request_id = 'staff-review-decision'
      where r.id = $1
    `,
    [submission.reviewId],
  );
  assert.deepEqual(decisionEvidence.rows[0], {
    status: "verified",
    reviewed_by: reviewer.id,
    buyer_status: "active",
    effective_role: "compliance_reviewer",
  });

  await database
    .update(schema.platformStaffAssignments)
    .set({
      status: "revoked",
      revokedBy: admin.id,
      revokedAt: new Date(),
      revocationReason: "Fixture verifies next-request revocation",
      updatedAt: new Date(),
    })
    .where(eq(schema.platformStaffAssignments.userId, reviewer.id));

  await assert.rejects(
    loadBusinessIdentityReviewQueue(
      environment,
      request("/admin/business-identity/reviews", reviewer.cookie),
    ),
    (error: unknown) => error instanceof StaffAuthorizationError && error.code === "FORBIDDEN",
  );

  console.log(
    "Business identity review authorization verified: fixed roles, moderator/revoked denial, self-review denial, safe private evidence access, reasoned decision, effective-role audit and next-request revocation passed.",
  );
} finally {
  if (createdUserIds.length > 0) {
    await database.delete(schema.platformStaffAssignments);
    await client.query('delete from "user" where id = any($1::uuid[])', [createdUserIds]);
  }
  await client.end();
}

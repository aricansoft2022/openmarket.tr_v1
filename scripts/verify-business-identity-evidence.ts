import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import { authRequest, registerWithPreferences } from "../app/lib/auth/registration.server";
import {
  downloadBusinessIdentityEvidence,
  listBusinessIdentityEvidence,
  removeBusinessIdentityEvidence,
  uploadBusinessIdentityEvidence,
  type EvidenceEnvironment,
} from "../app/lib/business-identity/evidence.server";
import { submitOnboardingIdentity } from "../app/lib/business-identity/onboarding.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";

if (!connectionString) {
  throw new Error("DATABASE_URL is required for business identity evidence verification.");
}

type StoredObject = {
  bytes: Uint8Array;
  contentType?: string;
  customMetadata?: Record<string, string>;
};

class FakePrivateBucket {
  readonly objects = new Map<string, StoredObject>();

  async put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | Blob | ReadableStream,
    options?: R2PutOptions,
  ) {
    let bytes: Uint8Array;
    if (typeof value === "string") {
      bytes = new TextEncoder().encode(value);
    } else if (value instanceof ArrayBuffer) {
      bytes = new Uint8Array(value.slice(0));
    } else if (ArrayBuffer.isView(value)) {
      bytes = new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    } else if (value instanceof Blob) {
      bytes = new Uint8Array(await value.arrayBuffer());
    } else {
      bytes = new Uint8Array(await new Response(value).arrayBuffer());
    }

    this.objects.set(key, {
      bytes,
      contentType: options?.httpMetadata?.contentType,
      customMetadata: options?.customMetadata,
    });
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

function request(path: string, cookie?: string): Request {
  const headers = new Headers({
    origin: baseUrl,
    "user-agent": "openmarket-evidence-verification",
    "cf-connecting-ip": "203.0.113.77",
    "cf-ray": `evidence-${randomUUID()}`,
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
const email = `evidence-${suffix}@gmail.com`;
const reviewerId = randomUUID();
let userId: string | undefined;

const authEnvironment: AuthEnvironment = {
  HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
  BETTER_AUTH_SECRET: "openmarket-business-evidence-verification-secret-2026",
  BETTER_AUTH_URL: baseUrl,
};
const environment: EvidenceEnvironment = {
  ...authEnvironment,
  PRIVATE_DOCUMENTS: bucket as unknown as R2Bucket,
};

try {
  await database.insert(schema.user).values({
    id: reviewerId,
    name: "Evidence Reviewer Fixture",
    email: `evidence-reviewer-${suffix}@openmarket.test`,
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
  const registration = await registerWithPreferences(authEnvironment, publicRequest, {
    name: "Evidence Applicant",
    email,
    password: "OpenMarket-Evidence-2026",
    country: "Türkiye",
    preferredLanguage: "tr",
    intendedUse: "buyer",
  });
  assert(registration.ok, `Registration failed with ${registration.status}.`);

  const userResult = await client.query('select id from "user" where email = $1', [email]);
  userId = userResult.rows[0]?.id;
  assert(userId, "Registration must persist a user.");
  await client.query('update "user" set email_verified = true where id = $1', [userId]);

  const auth = createAuth(database, authEnvironment);
  const signin = await auth.handler(
    authRequest(publicRequest, "/api/auth/sign-in/email", {
      email,
      password: "OpenMarket-Evidence-2026",
    }),
  );
  assert(signin.ok, `Signin failed with ${signin.status}.`);
  const cookie = cookieFrom(signin);
  const ownerRequest = request("/onboarding/business-identity/evidence", cookie);

  const submission = await submitOnboardingIdentity(authEnvironment, ownerRequest, {
    companyName: "Evidence Manual Review Company",
    companyEmail: email,
    applicantNote: "Public email requires manual evidence.",
  });
  assert.equal(submission.reviewStatus, "pending");
  assert.equal(submission.classification, "public_email");

  const sourceBytes = new TextEncoder().encode("private business registry evidence");
  const file = new File([sourceBytes], "company-registry.pdf", { type: "application/pdf" });
  const stored = await uploadBusinessIdentityEvidence(environment, ownerRequest, file);
  assert.equal(stored.status, "stored_private");
  assert.equal(stored.sha256?.length, 64);
  assert.equal(stored.reviewId, submission.reviewId);
  assert.equal(bucket.objects.size, 1);

  const [objectKey, object] = [...bucket.objects.entries()][0]!;
  assert(objectKey.startsWith(`business-identity/${userId}/${submission.reviewId}/`));
  assert.equal(objectKey.includes("company-registry.pdf"), false);
  assert.equal(object.contentType, "application/pdf");
  assert.equal(object.customMetadata?.evidenceId, stored.id);
  assert.equal(object.customMetadata?.sha256, stored.sha256);

  const listed = await listBusinessIdentityEvidence(environment, ownerRequest);
  assert.equal(listed?.reviewId, submission.reviewId);
  assert.equal(listed?.files.length, 1);
  assert.equal(listed?.files[0]?.originalFilename, "company-registry.pdf");
  assert.equal(listed?.files[0]?.status, "stored_private");

  const unauthorized = await downloadBusinessIdentityEvidence(
    environment,
    request(`/onboarding/business-identity/evidence/${stored.id}/download`),
    stored.id,
  );
  assert.equal(unauthorized.status, 404, "Anonymous evidence download must not reveal existence.");

  const download = await downloadBusinessIdentityEvidence(
    environment,
    request(`/onboarding/business-identity/evidence/${stored.id}/download`, cookie),
    stored.id,
  );
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("cache-control"), "private, no-store");
  assert.equal(download.headers.get("x-content-type-options"), "nosniff");
  assert(download.headers.get("content-disposition")?.includes("company-registry.pdf"));
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()), sourceBytes);

  await removeBusinessIdentityEvidence(environment, ownerRequest, stored.id);
  assert.equal(bucket.objects.size, 0);

  const afterRemoval = await listBusinessIdentityEvidence(environment, ownerRequest);
  assert.equal(afterRemoval?.files.length, 0);
  const removedDownload = await downloadBusinessIdentityEvidence(
    environment,
    request(`/onboarding/business-identity/evidence/${stored.id}/download`, cookie),
    stored.id,
  );
  assert.equal(removedDownload.status, 404);

  const auditEvidence = await client.query(
    `
      select action, count(*)::int as count
      from audit_logs
      where actor_id = $1
        and resource_id = $2
        and action in (
          'business_identity.evidence.stored',
          'business_identity.evidence.removed'
        )
      group by action
      order by action
    `,
    [userId, stored.id],
  );
  assert.deepEqual(auditEvidence.rows, [
    { action: "business_identity.evidence.removed", count: 1 },
    { action: "business_identity.evidence.stored", count: 1 },
  ]);

  console.log(
    "Private business identity evidence verified: reservation, private R2 object, SHA-256 metadata, owner-only download, removal and immutable audit evidence passed.",
  );
} finally {
  if (userId) await client.query('delete from "user" where id = $1', [userId]);
  await client.query('delete from "user" where id = $1', [reviewerId]);
  await client.end();
}

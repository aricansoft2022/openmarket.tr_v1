import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import type { Database } from "../app/lib/db/client.server";

import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import { authRequest, registerWithPreferences } from "../app/lib/auth/registration.server";
import { submitOnboardingIdentity } from "../app/lib/business-identity/onboarding.server";
import * as schema from "../app/lib/db/schema";
import { seedSupplierLaunchCatalogue } from "../app/lib/supplier/catalogue.server";
import { seedSupplierDocumentCatalogue } from "../app/lib/supplier/documents/catalogue.server";
import {
  createSupplierDocumentAccessGrant,
  decideSupplierCompanyDocument,
  downloadSupplierDocumentWithGrant,
  loadSupplierDocumentReviewDetail,
  loadSupplierDocumentReviewQueue,
  loadSupplierDocumentWorkspace,
  recordSupplierDocumentScanResult,
  setSupplierDocumentPublicVisibility,
  submitSupplierCompanyDocumentForReview,
  SupplierDocumentActionError,
  uploadSupplierCompanyDocument,
  type SupplierDocumentEnvironment,
} from "../app/lib/supplier/documents/service.server";
import { createSupplierCompany } from "../app/lib/supplier/profile.server";
import { StaffAuthorizationError } from "../app/lib/authorization/platform-staff.server";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";
if (!connectionString) {
  throw new Error("DATABASE_URL is required for Supplier document lifecycle verification.");
}

function request(
  path: string,
  cookie?: string,
  requestId = `supplier-document-${randomUUID()}`,
): Request {
  const headers = new Headers({
    origin: baseUrl,
    "user-agent": "openmarket-supplier-document-verification",
    "cf-connecting-ip": "203.0.113.149",
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

function memoryR2Bucket() {
  const objects = new Map<
    string,
    { bytes: Uint8Array; contentType?: string; customMetadata?: Record<string, string> }
  >();
  return {
    objects,
    bucket: {
      async put(
        key: string,
        value: ArrayBuffer | ArrayBufferView | string | Blob | ReadableStream,
        options?: {
          httpMetadata?: { contentType?: string };
          customMetadata?: Record<string, string>;
        },
      ) {
        let bytes: Uint8Array;
        if (value instanceof ArrayBuffer) bytes = new Uint8Array(value);
        else if (ArrayBuffer.isView(value)) {
          bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        } else if (typeof value === "string") bytes = new TextEncoder().encode(value);
        else if (value instanceof Blob) bytes = new Uint8Array(await value.arrayBuffer());
        else bytes = new Uint8Array(await new Response(value).arrayBuffer());
        objects.set(key, {
          bytes: new Uint8Array(bytes),
          contentType: options?.httpMetadata?.contentType,
          customMetadata: options?.customMetadata,
        });
        return { key };
      },
      async get(key: string) {
        const stored = objects.get(key);
        if (!stored) return null;
        return {
          key,
          body: new Blob([stored.bytes.slice().buffer]).stream(),
          size: stored.bytes.byteLength,
          httpMetadata: { contentType: stored.contentType },
          customMetadata: stored.customMetadata,
        };
      },
      async delete(key: string) {
        objects.delete(key);
      },
    } as unknown as R2Bucket,
  };
}

const client = new Client({ connectionString });
await client.connect();
const database = drizzle(client, { schema });
const suffix = randomUUID();
const r2 = memoryR2Bucket();

const environment: SupplierDocumentEnvironment = {
  HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
  PRIVATE_DOCUMENTS: r2.bucket,
  BETTER_AUTH_SECRET: "openmarket-supplier-document-lifecycle-secret-2026",
  BETTER_AUTH_URL: baseUrl,
};
const auth = createAuth(database, environment);

async function registerFixture(
  label: string,
  localPart: string,
): Promise<{ id: string; email: string; cookie: string }> {
  const email = `${localPart}-${suffix}@openmarket.test`;
  const password = `OpenMarket-${label}-2026`;
  const registrationRequest = request("/auth/register");
  const registration = await registerWithPreferences(environment, registrationRequest, {
    name: label,
    email,
    password,
    country: "Türkiye",
    preferredLanguage: "tr",
    intendedUse: "supplier",
  });
  assert(registration.ok, `${label} registration failed with ${registration.status}.`);

  const result = await client.query('select id from "user" where email = $1', [email]);
  const id = result.rows[0]?.id as string | undefined;
  assert(id, `${label} must persist a user.`);
  await client.query('update "user" set email_verified = true where id = $1', [id]);

  const signin = await auth.handler(
    authRequest(registrationRequest, "/api/auth/sign-in/email", { email, password }),
  );
  assert(signin.ok, `${label} signin failed with ${signin.status}.`);
  return { id, email, cookie: cookieFrom(signin) };
}

try {
  await seedSupplierLaunchCatalogue(database);
  await seedSupplierDocumentCatalogue(database);

  const owner = await registerFixture("Document Owner", "document-owner");
  const viewer = await registerFixture("Document Viewer", "document-viewer");
  const outsider = await registerFixture("Document Outsider", "document-outsider");
  const reviewer = await registerFixture("Document Reviewer", "document-reviewer");
  const conflictedReviewer = await registerFixture(
    "Conflicted Document Reviewer",
    "conflicted-document-reviewer",
  );

  const identity = await submitOnboardingIdentity(
    environment,
    request("/onboarding/business-identity", owner.cookie),
    {
      companyName: "Document Lifecycle Textiles A.Ş.",
      companyEmail: owner.email,
      applicantNote: "Supplier company-document lifecycle fixture.",
    },
  );
  assert.equal(identity.reviewStatus, "verified");

  const company = await createSupplierCompany(
    environment,
    request("/supplier/company", owner.cookie),
    {
      legalName: "Document Lifecycle Textiles A.Ş.",
      tradingName: "Document Lifecycle Textiles",
      countryCode: "TR",
      city: "Denizli",
      website: "https://documents.example.test",
      description:
        "Textile production and export company used for private document lifecycle verification.",
      foundedYear: 2002,
      supplierTypeKeys: ["supplier_type.manufacturer_exporter"],
      applicationContextKeys: ["context.hotel_hospitality"],
      productionCapabilityKeys: ["production_capability.weaving"],
      exportMarketCountryCodes: ["DE", "GB"],
    },
  );

  await database.insert(schema.supplierMemberships).values({
    companyId: company.company.id,
    userId: viewer.id,
    role: "viewer",
    assignedBy: owner.id,
  });
  await database.insert(schema.platformStaffAssignments).values([
    {
      userId: reviewer.id,
      role: "compliance_reviewer",
      assignedBy: owner.id,
      assignmentReason: "Supplier company-document review verification",
    },
    {
      userId: conflictedReviewer.id,
      role: "compliance_reviewer",
      assignedBy: owner.id,
      assignmentReason: "Supplier company-document conflict verification",
    },
  ]);
  await database.insert(schema.supplierMemberships).values({
    companyId: company.company.id,
    userId: conflictedReviewer.id,
    role: "viewer",
    assignedBy: owner.id,
  });

  const workspace = await loadSupplierDocumentWorkspace(
    environment,
    request("/supplier/documents", owner.cookie),
    company.company.id,
  );
  assert(workspace);
  assert.equal(workspace.company.id, company.company.id);
  assert.equal(workspace.canEdit, true);
  assert(
    workspace.requirements.some(
      (requirement) =>
        requirement.documentTypeKey === "company_document.facility_information" &&
        requirement.level === "mandatory" &&
        requirement.currentState === "missing",
    ),
  );
  assert(
    workspace.requirements.some(
      (requirement) =>
        requirement.documentTypeKey === "company_document.exporter_information" &&
        requirement.level === "conditional",
    ),
  );

  const outsiderWorkspace = await loadSupplierDocumentWorkspace(
    environment,
    request("/supplier/documents", outsider.cookie),
    company.company.id,
  );
  assert.equal(outsiderWorkspace, null);

  const chamberFile = new File(["private chamber registration evidence"], "chamber.pdf", {
    type: "application/pdf",
  });
  const uploaded = await uploadSupplierCompanyDocument(
    environment,
    request("/supplier/documents/upload", owner.cookie, "document-upload-owner"),
    {
      companyId: company.company.id,
      documentTypeKey: "company_document.chamber_activity",
      file: chamberFile,
      issueDate: new Date("2026-06-01T00:00:00.000Z"),
      expiresAt: new Date("2027-06-01T00:00:00.000Z"),
    },
  );
  assert.equal(uploaded.storageStatus, "stored_private");
  assert.equal(uploaded.scanStatus, "pending");
  assert.equal(uploaded.evidenceStatus, "uploaded");
  assert.equal(r2.objects.size, 1);
  const [storedObject] = [...r2.objects.entries()];
  assert(storedObject);
  assert(storedObject[0].startsWith(`supplier-company/${company.company.id}/chamber_activity/`));
  assert.equal(storedObject[1].customMetadata?.documentId, uploaded.id);
  assert(!storedObject[0].includes("chamber.pdf"));

  await assert.rejects(
    uploadSupplierCompanyDocument(
      environment,
      request("/supplier/documents/upload", viewer.cookie),
      {
        companyId: company.company.id,
        documentTypeKey: "company_document.company_profile",
        file: new File(["viewer must not upload"], "profile.pdf", {
          type: "application/pdf",
        }),
      },
    ),
    (error: unknown) => error instanceof SupplierDocumentActionError && error.code === "FORBIDDEN",
  );

  await assert.rejects(
    submitSupplierCompanyDocumentForReview(
      environment,
      request("/supplier/documents/submit", owner.cookie),
      uploaded.id,
    ),
    (error: unknown) =>
      error instanceof SupplierDocumentActionError && error.code === "SCAN_PENDING",
  );

  await database.transaction(async (transaction) => {
    await recordSupplierDocumentScanResult(transaction as unknown as Database, {
      documentId: uploaded.id,
      result: "clean",
    });
  });
  await submitSupplierCompanyDocumentForReview(
    environment,
    request("/supplier/documents/submit", owner.cookie, "document-submit-owner"),
    uploaded.id,
  );

  const queue = await loadSupplierDocumentReviewQueue(
    environment,
    request("/admin/supplier-documents", reviewer.cookie),
  );
  assert(queue);
  assert.equal(queue.actor.role, "compliance_reviewer");
  assert(queue.documents.some((document) => document.id === uploaded.id));

  const viewerGrant = await createSupplierDocumentAccessGrant(
    environment,
    request("/supplier/documents/access", viewer.cookie, "document-viewer-grant"),
    uploaded.id,
  );
  assert(viewerGrant.expiresAt > new Date());
  const viewerDownload = await downloadSupplierDocumentWithGrant(
    environment,
    request(`/supplier/documents/access/${viewerGrant.token}`, viewer.cookie),
    viewerGrant.token,
  );
  assert.equal(viewerDownload.status, 200);
  assert.equal(await viewerDownload.text(), "private chamber registration evidence");
  assert.match(viewerDownload.headers.get("cache-control") ?? "", /no-store/);

  await assert.rejects(
    createSupplierDocumentAccessGrant(
      environment,
      request("/supplier/documents/access", outsider.cookie),
      uploaded.id,
    ),
    (error: unknown) =>
      error instanceof SupplierDocumentActionError && error.code === "DOCUMENT_NOT_FOUND",
  );

  await assert.rejects(
    decideSupplierCompanyDocument(environment, request("/admin/supplier-documents", owner.cookie), {
      documentId: uploaded.id,
      decision: "approved",
      reason: "Owner must not decide their own company document",
    }),
    (error: unknown) => error instanceof StaffAuthorizationError,
  );

  await assert.rejects(
    decideSupplierCompanyDocument(
      environment,
      request("/admin/supplier-documents", conflictedReviewer.cookie),
      {
        documentId: uploaded.id,
        decision: "approved",
        reason: "A company member must not review their own Supplier company",
      },
    ),
    (error: unknown) => error instanceof StaffAuthorizationError && error.code === "SELF_REVIEW",
  );

  await decideSupplierCompanyDocument(
    environment,
    request("/admin/supplier-documents", reviewer.cookie, "document-review-approve"),
    {
      documentId: uploaded.id,
      decision: "approved",
      reason: "Registration evidence matches the verified company identity",
      reviewNote: "Registry and company name are consistent.",
    },
  );

  const detail = await loadSupplierDocumentReviewDetail(
    environment,
    request(`/admin/supplier-documents/${uploaded.id}`, reviewer.cookie),
    uploaded.id,
  );
  assert(detail?.document);
  assert.equal(detail.document.evidenceStatus, "approved");
  assert.equal(detail.timeline.length, 1);
  assert.equal(detail.timeline[0]?.decision, "approved");
  assert.equal(detail.timeline[0]?.effectiveRole, "compliance_reviewer");

  await assert.rejects(
    setSupplierDocumentPublicVisibility(
      environment,
      request("/supplier/documents/visibility", owner.cookie),
      { documentId: uploaded.id, visible: true },
    ),
    (error: unknown) =>
      error instanceof SupplierDocumentActionError && error.code === "PUBLIC_VISIBILITY_FORBIDDEN",
  );

  const profileDocument = await uploadSupplierCompanyDocument(
    environment,
    request("/supplier/documents/upload", owner.cookie),
    {
      companyId: company.company.id,
      documentTypeKey: "company_document.company_profile",
      file: new File(["public eligible company profile"], "company-profile.pdf", {
        type: "application/pdf",
      }),
    },
  );
  await database.transaction(async (transaction) => {
    await recordSupplierDocumentScanResult(transaction as unknown as Database, {
      documentId: profileDocument.id,
      result: "clean",
    });
  });
  await submitSupplierCompanyDocumentForReview(
    environment,
    request("/supplier/documents/submit", owner.cookie),
    profileDocument.id,
  );
  await decideSupplierCompanyDocument(
    environment,
    request("/admin/supplier-documents", reviewer.cookie),
    {
      documentId: profileDocument.id,
      decision: "approved",
      reason: "Company profile is consistent with verified Supplier information",
    },
  );
  await setSupplierDocumentPublicVisibility(
    environment,
    request("/supplier/documents/visibility", owner.cookie),
    { documentId: profileDocument.id, visible: true },
  );

  const replacement = await uploadSupplierCompanyDocument(
    environment,
    request("/supplier/documents/upload", owner.cookie),
    {
      companyId: company.company.id,
      documentTypeKey: "company_document.chamber_activity",
      file: new File(["replacement chamber evidence"], "chamber-renewed.pdf", {
        type: "application/pdf",
      }),
      replacesDocumentId: uploaded.id,
      expiresAt: new Date("2028-06-01T00:00:00.000Z"),
    },
  );
  assert.equal(replacement.version, 2);
  assert.equal(replacement.replacesDocumentId, uploaded.id);
  const workspaceWithPendingReplacement = await loadSupplierDocumentWorkspace(
    environment,
    request("/supplier/documents", owner.cookie),
    company.company.id,
  );
  assert.equal(
    workspaceWithPendingReplacement?.requirements.find(
      (requirement) => requirement.documentTypeKey === "company_document.chamber_activity",
    )?.satisfied,
    true,
  );

  const expiringGrant = await createSupplierDocumentAccessGrant(
    environment,
    request("/supplier/documents/access", reviewer.cookie),
    uploaded.id,
  );
  const expiringGrantDigest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(expiringGrant.token),
  );
  const expiringGrantHash = Array.from(new Uint8Array(expiringGrantDigest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  await client.query(
    `update supplier_document_access_grants
       set expires_at = created_at + interval '1 millisecond'
       where token_hash = $1`,
    [expiringGrantHash],
  );
  await assert.rejects(
    downloadSupplierDocumentWithGrant(
      environment,
      request(`/supplier/documents/access/${expiringGrant.token}`, reviewer.cookie),
      expiringGrant.token,
    ),
    (error: unknown) =>
      error instanceof SupplierDocumentActionError && error.code === "ACCESS_GRANT_INVALID",
  );

  const audit = await client.query(
    `
      select action, actor_id, effective_role, request_id
      from audit_logs
      where resource_type = 'supplier_company_document'
        and resource_id = $1
      order by created_at, id
    `,
    [uploaded.id],
  );
  assert(audit.rows.some((row) => row.action === "supplier.document.stored_private"));
  assert(audit.rows.some((row) => row.action === "supplier.document.submitted_for_review"));
  assert(
    audit.rows.some(
      (row) =>
        row.action === "supplier.document.approved" &&
        row.actor_id === reviewer.id &&
        row.effective_role === "compliance_reviewer" &&
        row.request_id === "document-review-approve",
    ),
  );

  const reviewRows = await database
    .select({ id: schema.supplierDocumentReviewEvents.id })
    .from(schema.supplierDocumentReviewEvents)
    .where(eq(schema.supplierDocumentReviewEvents.documentId, uploaded.id));
  assert.equal(reviewRows.length, 1);

  console.log(
    "Supplier document lifecycle verified: requirement resolution, private server-owned R2 keys, viewer write denial and authorized read, outsider isolation, scan-before-review, reviewer authorization, immutable decisions, public-eligibility boundary, replacement versioning, expiring access grants and audit evidence passed.",
  );
} finally {
  // The PostgreSQL service is isolated per CI run. Review events are deliberately
  // immutable, so verification fixtures remain until the ephemeral database exits.
  await client.end();
}

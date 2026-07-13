import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import { authRequest, registerWithPreferences } from "../app/lib/auth/registration.server";
import { StaffAuthorizationError } from "../app/lib/authorization/platform-staff.server";
import { submitOnboardingIdentity } from "../app/lib/business-identity/onboarding.server";
import type { Database } from "../app/lib/db/client.server";
import * as schema from "../app/lib/db/schema";
import {
  SupplierActivationActionError,
  reactivateSupplierCompany,
  suspendSupplierCompany,
} from "../app/lib/supplier/activation-admin.server";
import {
  SupplierActivationPermissionError,
  reconcileSupplierActivationWithinTransaction,
  requireActiveSupplierStatus,
} from "../app/lib/supplier/activation.server";
import { launchSupplierTypes } from "../app/lib/supplier/catalogue";
import { seedSupplierLaunchCatalogue } from "../app/lib/supplier/catalogue.server";
import { seedSupplierDocumentCatalogue } from "../app/lib/supplier/documents/catalogue.server";
import { resolveSupplierDocumentRequirements } from "../app/lib/supplier/documents/policy";
import { createSupplierCompany } from "../app/lib/supplier/profile.server";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";
if (!connectionString) {
  throw new Error("DATABASE_URL is required for Supplier activation verification.");
}

function request(path: string, cookie?: string, requestId = `supplier-activation-${randomUUID()}`) {
  const headers = new Headers({
    origin: baseUrl,
    "user-agent": "openmarket-supplier-activation-verification",
    "cf-connecting-ip": "203.0.113.181",
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
const suffix = randomUUID();
const createdUserIds: string[] = [];
const createdCompanyIds: string[] = [];

const environment: AuthEnvironment = {
  HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
  BETTER_AUTH_SECRET: "openmarket-supplier-activation-verification-secret-2026",
  BETTER_AUTH_URL: baseUrl,
};
const auth = createAuth(database, environment);

async function registerFixture(
  label: string,
  localPart: string,
  intendedUse: schema.IntendedUse,
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

async function reconcile(
  companyId: string,
  actorId: string,
  reason: string,
  now = new Date(),
) {
  return database.transaction((transaction) =>
    reconcileSupplierActivationWithinTransaction(
      transaction as unknown as Database,
      companyId,
      {
        actorId,
        effectiveRole: "supplier_owner",
        reason,
        requestId: `activation-reconcile-${randomUUID()}`,
        now,
      },
    ),
  );
}

try {
  await seedSupplierLaunchCatalogue(database);
  await seedSupplierDocumentCatalogue(database);

  const owner = await registerFixture("Activation Owner", "activation-owner", "supplier");
  const administrator = await registerFixture("Activation Admin", "activation-admin", "buyer");
  await database.insert(schema.platformStaffAssignments).values({
    userId: administrator.id,
    role: "platform_admin",
    assignedBy: administrator.id,
    assignmentReason: "Supplier activation lifecycle verification",
  });

  const ownerRequest = request(
    "/supplier/onboarding/company",
    owner.cookie,
    "activation-owner-company",
  );
  const identity = await submitOnboardingIdentity(environment, ownerRequest, {
    companyName: "Activation Supplier Textiles A.Ş.",
    companyEmail: owner.email,
    applicantNote: "Activation state-machine verification fixture.",
  });
  assert.equal(identity.reviewStatus, "verified");

  const supplierTypeKey = launchSupplierTypes[0].key;
  const company = await createSupplierCompany(environment, ownerRequest, {
    legalName: "Activation Supplier Textiles A.Ş.",
    tradingName: "Activation Textiles",
    countryCode: "TR",
    city: "Denizli",
    website: "https://activation-supplier.example.test",
    description:
      "Vertically integrated textile manufacturing for hospitality and institutional buyers.",
    foundedYear: 2001,
    supplierTypeKeys: [supplierTypeKey],
    applicationContextKeys: ["context.hotel_hospitality"],
    productionCapabilityKeys: [],
    exportMarketCountryCodes: [],
  });
  createdCompanyIds.push(company.company.id);
  assert.equal(company.company.status, "company_documents_required");
  assert.throws(
    () => requireActiveSupplierStatus(company.company.status),
    SupplierActivationPermissionError,
  );

  const mandatoryRequirements = resolveSupplierDocumentRequirements([supplierTypeKey]).filter(
    (requirement) => requirement.level === "mandatory",
  );
  assert(mandatoryRequirements.length > 0, "Launch Supplier type must resolve mandatory documents.");
  const now = new Date("2026-07-13T15:00:00.000Z");
  const expiresAt = new Date("2027-07-13T15:00:00.000Z");
  const documents = await database
    .insert(schema.supplierCompanyDocuments)
    .values(
      mandatoryRequirements.map((requirement, index) => ({
        companyId: company.company.id,
        documentTypeKey: requirement.documentTypeKey,
        version: 1,
        uploadedBy: owner.id,
        objectKey: `supplier-company/${company.company.id}/${requirement.documentTypeKey}/${index}/v1.pdf`,
        originalFilename: `${requirement.documentTypeKey}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 1024 + index,
        sha256: String(index % 10).repeat(64),
        storageStatus: "stored_private" as const,
        evidenceStatus: "approved" as const,
        scanStatus: "clean" as const,
        issueDate: now,
        expiresAt,
        storedAt: now,
        submittedAt: now,
        updatedAt: now,
      })),
    )
    .returning({
      id: schema.supplierCompanyDocuments.id,
      documentTypeKey: schema.supplierCompanyDocuments.documentTypeKey,
    });

  const activated = await reconcile(
    company.company.id,
    owner.id,
    "All mandatory Supplier evidence is approved",
    now,
  );
  assert.equal(activated?.changed, true);
  assert.equal(activated?.evaluation.nextStatus, "active_supplier");
  requireActiveSupplierStatus("active_supplier");

  const countsBeforeIdempotent = await client.query(
    `
      select
        (select count(*)::int from audit_logs where resource_type = 'supplier_company' and resource_id = $1 and action = 'supplier.activation.status_changed') as audit_count,
        (select count(*)::int from outbox_events where aggregate_type = 'supplier_company' and aggregate_id = $1 and event_type = 'supplier.activation.status_changed') as outbox_count
    `,
    [company.company.id],
  );
  const repeated = await reconcile(
    company.company.id,
    owner.id,
    "Repeated deterministic activation evaluation",
    now,
  );
  assert.equal(repeated?.changed, false);
  const countsAfterIdempotent = await client.query(
    `
      select
        (select count(*)::int from audit_logs where resource_type = 'supplier_company' and resource_id = $1 and action = 'supplier.activation.status_changed') as audit_count,
        (select count(*)::int from outbox_events where aggregate_type = 'supplier_company' and aggregate_id = $1 and event_type = 'supplier.activation.status_changed') as outbox_count
    `,
    [company.company.id],
  );
  assert.deepEqual(countsAfterIdempotent.rows[0], countsBeforeIdempotent.rows[0]);

  await assert.rejects(
    suspendSupplierCompany(
      environment,
      request("/admin/suppliers", owner.cookie),
      company.company.id,
      "Owner cannot administratively suspend the Supplier",
    ),
    (error: unknown) => error instanceof StaffAuthorizationError && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    suspendSupplierCompany(
      environment,
      request("/admin/suppliers", administrator.cookie),
      company.company.id,
      "x",
    ),
    (error: unknown) =>
      error instanceof SupplierActivationActionError && error.code === "REASON_REQUIRED",
  );

  assert.equal(
    await suspendSupplierCompany(
      environment,
      request("/admin/suppliers", administrator.cookie, "activation-suspend-qualified"),
      company.company.id,
      "Compliance escalation requires temporary Supplier suspension",
    ),
    "suspended_supplier",
  );
  assert.equal(
    await suspendSupplierCompany(
      environment,
      request("/admin/suppliers", administrator.cookie),
      company.company.id,
      "Repeated suspension must be idempotent",
    ),
    "suspended_supplier",
  );
  assert.equal(
    await reactivateSupplierCompany(
      environment,
      request("/admin/suppliers", administrator.cookie, "activation-reactivate-qualified"),
      company.company.id,
      "Compliance escalation resolved with all evidence still valid",
    ),
    "active_supplier",
  );

  const expiringDocument = documents[0]!;
  await database
    .update(schema.supplierCompanyDocuments)
    .set({ expiresAt: new Date("2026-07-12T15:00:00.000Z"), updatedAt: now })
    .where(eq(schema.supplierCompanyDocuments.id, expiringDocument.id));
  const degraded = await reconcile(
    company.company.id,
    owner.id,
    "Mandatory Supplier evidence expired",
    now,
  );
  assert.equal(degraded?.evaluation.nextStatus, "reactivation_required");
  assert.throws(
    () => requireActiveSupplierStatus("reactivation_required"),
    SupplierActivationPermissionError,
  );

  assert.equal(
    await suspendSupplierCompany(
      environment,
      request("/admin/suppliers", administrator.cookie, "activation-suspend-blocked"),
      company.company.id,
      "Administrative review continues while evidence is expired",
    ),
    "suspended_supplier",
  );
  assert.equal(
    await reactivateSupplierCompany(
      environment,
      request("/admin/suppliers", administrator.cookie, "activation-reactivate-blocked"),
      company.company.id,
      "Administrative suspension is lifted but evidence remains incomplete",
    ),
    "reactivation_required",
  );

  const transitionEvidence = await client.query(
    `
      select action, reason, old_value, new_value
      from audit_logs
      where resource_type = 'supplier_company'
        and resource_id = $1
        and action in (
          'supplier.activation.status_changed',
          'supplier.activation.suspended',
          'supplier.activation.reactivated'
        )
      order by created_at, id
    `,
    [company.company.id],
  );
  assert.deepEqual(
    transitionEvidence.rows.map((row) => [row.action, row.old_value.status, row.new_value.status]),
    [
      ["supplier.activation.status_changed", "supplier_draft", "company_documents_required"],
      ["supplier.activation.status_changed", "company_documents_required", "active_supplier"],
      ["supplier.activation.suspended", "active_supplier", "suspended_supplier"],
      ["supplier.activation.reactivated", "suspended_supplier", "active_supplier"],
      ["supplier.activation.status_changed", "active_supplier", "reactivation_required"],
      ["supplier.activation.suspended", "reactivation_required", "suspended_supplier"],
      ["supplier.activation.reactivated", "suspended_supplier", "reactivation_required"],
    ],
  );
  assert(
    transitionEvidence.rows.every((row) => typeof row.reason === "string" && row.reason.length >= 3),
    "Every activation transition must preserve a reason.",
  );

  const outboxEvidence = await client.query(
    `
      select event_type, payload
      from outbox_events
      where aggregate_type = 'supplier_company'
        and aggregate_id = $1
        and event_type in (
          'supplier.activation.status_changed',
          'supplier.activation.suspended',
          'supplier.activation.reactivated'
        )
      order by created_at, id
    `,
    [company.company.id],
  );
  assert.deepEqual(
    outboxEvidence.rows.map((row) => [row.event_type, row.payload.nextStatus]),
    [
      ["supplier.activation.status_changed", "company_documents_required"],
      ["supplier.activation.status_changed", "active_supplier"],
      ["supplier.activation.suspended", "suspended_supplier"],
      ["supplier.activation.reactivated", "active_supplier"],
      ["supplier.activation.status_changed", "reactivation_required"],
      ["supplier.activation.suspended", "suspended_supplier"],
      ["supplier.activation.reactivated", "reactivation_required"],
    ],
  );
  assert(
    outboxEvidence.rows.every((row) => row.payload.recipientUserIds.includes(owner.id)),
    "Activation outbox events must target active Supplier owners and admins.",
  );

  console.log(
    "Supplier activation verified: deterministic prerequisites, active-only commercial gate, idempotent reconciliation, transactional audit/outbox, unauthorized suspension denial, mandatory-reason administration, sticky suspension and evidence-driven reactivation passed.",
  );
} finally {
  for (const companyId of createdCompanyIds) {
    await database.delete(schema.outboxEvents).where(eq(schema.outboxEvents.aggregateId, companyId));
    await database
      .delete(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.resourceType, "supplier_company"),
          eq(schema.auditLogs.resourceId, companyId),
        ),
      );
  }
  if (createdCompanyIds.length > 0) {
    await database
      .delete(schema.supplierCompanies)
      .where(inArray(schema.supplierCompanies.id, createdCompanyIds));
  }
  if (createdUserIds.length > 0) {
    await client.query('delete from "user" where id = any($1::uuid[])', [createdUserIds]);
  }
  await client.end();
}

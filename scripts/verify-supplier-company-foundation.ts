import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import { authRequest, registerWithPreferences } from "../app/lib/auth/registration.server";
import { submitOnboardingIdentity } from "../app/lib/business-identity/onboarding.server";
import * as schema from "../app/lib/db/schema";
import { launchProductionCapabilities, launchSupplierTypes } from "../app/lib/supplier/catalogue";
import { seedSupplierLaunchCatalogue } from "../app/lib/supplier/catalogue.server";
import {
  createSupplierCompany,
  loadSupplierCompanyState,
  SupplierProfileActionError,
  updateSupplierCompanyProfile,
} from "../app/lib/supplier/profile.server";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";
if (!connectionString) {
  throw new Error("DATABASE_URL is required for supplier company foundation verification.");
}

function request(
  path: string,
  cookie?: string,
  requestId = `supplier-company-${randomUUID()}`,
): Request {
  const headers = new Headers({
    origin: baseUrl,
    "user-agent": "openmarket-supplier-company-verification",
    "cf-connecting-ip": "203.0.113.107",
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
const launchSupplierTypeKey = launchSupplierTypes[0].key;
const launchCapabilityKey = launchProductionCapabilities[0].key;

const environment: AuthEnvironment = {
  HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
  BETTER_AUTH_SECRET: "openmarket-supplier-company-foundation-secret-2026",
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

const completeProfile = {
  legalName: "Foundation Supplier Textiles A.Ş.",
  tradingName: "Foundation Textiles",
  countryCode: "tr",
  city: "Denizli",
  website: "https://supplier.example.test",
  description:
    "Vertically integrated textile production for hospitality and institutional accommodation.",
  foundedYear: 1998,
  supplierTypeKeys: [launchSupplierTypeKey],
  applicationContextKeys: [
    "context.hotel_hospitality",
    "context.dormitory_institutional_accommodation",
  ],
  productionCapabilityKeys: [launchCapabilityKey],
  exportMarketCountryCodes: ["de", "gb", "DE"],
} as const;

try {
  await seedSupplierLaunchCatalogue(database);

  await assert.rejects(
    client.query(
      `insert into supplier_types (key, label_tr, label_en) values ($1, 'Hatalı', 'Invalid')`,
      [`supplier_typeXfixture_${suffix.replaceAll("-", "_")}`],
    ),
    /supplier_types_key_check/,
  );
  await assert.rejects(
    client.query(
      `insert into production_capabilities (key, label_tr, label_en) values ($1, 'Hatalı', 'Invalid')`,
      [`production_capabilityXfixture_${suffix.replaceAll("-", "_")}`],
    ),
    /production_capabilities_key_check/,
  );

  const owner = await registerFixture("Supplier Owner Fixture", "supplier-owner", "supplier");
  const editor = await registerFixture("Supplier Editor Fixture", "supplier-editor", "supplier");
  const viewer = await registerFixture("Supplier Viewer Fixture", "supplier-viewer", "supplier");
  const buyerOnly = await registerFixture("Buyer Only Fixture", "buyer-only", "buyer");
  const noIdentity = await registerFixture("No Identity Fixture", "no-identity", "supplier");

  const ownerRequest = request(
    "/supplier/onboarding/company",
    owner.cookie,
    "supplier-company-owner-create",
  );
  const identity = await submitOnboardingIdentity(environment, ownerRequest, {
    companyName: "Foundation Supplier Textiles A.Ş.",
    companyEmail: owner.email,
    applicantNote: "Verified company-domain supplier foundation fixture.",
  });
  assert.equal(identity.reviewStatus, "verified");

  await submitOnboardingIdentity(
    environment,
    request("/onboarding/business-identity", buyerOnly.cookie),
    {
      companyName: "Buyer Only Company",
      companyEmail: buyerOnly.email,
      applicantNote: "Buyer-only identity fixture.",
    },
  );

  await assert.rejects(
    createSupplierCompany(
      environment,
      request("/supplier/onboarding/company", buyerOnly.cookie),
      completeProfile,
    ),
    (error: unknown) =>
      error instanceof SupplierProfileActionError && error.code === "SUPPLIER_INTENT_REQUIRED",
  );
  await assert.rejects(
    createSupplierCompany(
      environment,
      request("/supplier/onboarding/company", noIdentity.cookie),
      completeProfile,
    ),
    (error: unknown) =>
      error instanceof SupplierProfileActionError && error.code === "BUSINESS_IDENTITY_REQUIRED",
  );
  await assert.rejects(
    createSupplierCompany(environment, ownerRequest, {
      ...completeProfile,
      legalName: "Unrelated Supplier Identity A.Ş.",
    }),
    (error: unknown) =>
      error instanceof SupplierProfileActionError && error.code === "BUSINESS_IDENTITY_MISMATCH",
  );

  const created = await createSupplierCompany(environment, ownerRequest, completeProfile);
  createdCompanyIds.push(created.company.id);
  assert.equal(created.company.status, "company_documents_required");
  assert.equal(created.company.businessIdentityReviewId, identity.reviewId);
  assert.equal(created.membershipRole, "owner");
  assert.deepEqual(created.completeness, { complete: true, missing: [] });
  assert.deepEqual(created.exportMarketCountryCodes, ["DE", "GB"]);

  await assert.rejects(
    createSupplierCompany(environment, ownerRequest, completeProfile),
    (error: unknown) =>
      error instanceof SupplierProfileActionError && error.code === "SUPPLIER_COMPANY_EXISTS",
  );

  const loaded = await loadSupplierCompanyState(environment, ownerRequest, created.company.id);
  assert.equal(loaded?.company.id, created.company.id);
  assert.equal(loaded?.company.businessIdentityReviewId, identity.reviewId);
  assert.equal(loaded?.company.status, "company_documents_required");

  const outsider = await loadSupplierCompanyState(
    environment,
    request("/supplier/onboarding/company", editor.cookie),
    created.company.id,
  );
  assert.equal(outsider, null);

  await database.insert(schema.supplierMemberships).values([
    {
      companyId: created.company.id,
      userId: editor.id,
      role: "editor",
      assignedBy: owner.id,
    },
    {
      companyId: created.company.id,
      userId: viewer.id,
      role: "viewer",
      assignedBy: owner.id,
    },
  ]);

  await assert.rejects(
    updateSupplierCompanyProfile(
      environment,
      request("/supplier/onboarding/company", viewer.cookie),
      created.company.id,
      completeProfile,
    ),
    (error: unknown) => error instanceof SupplierProfileActionError && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    updateSupplierCompanyProfile(
      environment,
      request("/supplier/onboarding/company", editor.cookie),
      created.company.id,
      { ...completeProfile, legalName: "Identity Drift Textiles A.Ş." },
    ),
    (error: unknown) =>
      error instanceof SupplierProfileActionError && error.code === "BUSINESS_IDENTITY_MISMATCH",
  );

  const incomplete = await updateSupplierCompanyProfile(
    environment,
    request("/supplier/onboarding/company", editor.cookie, "supplier-company-editor-update"),
    created.company.id,
    {
      ...completeProfile,
      description: null,
      supplierTypeKeys: [],
      productionCapabilityKeys: [],
    },
  );
  assert.equal(incomplete.company.status, "supplier_draft");
  assert.deepEqual(incomplete.completeness, {
    complete: false,
    missing: ["description", "supplier_type"],
  });

  await assert.rejects(
    updateSupplierCompanyProfile(
      environment,
      request("/supplier/onboarding/company", editor.cookie),
      created.company.id,
      {
        ...completeProfile,
        supplierTypeKeys: ["supplier_type.unseeded_custom"],
      },
    ),
    (error: unknown) =>
      error instanceof SupplierProfileActionError && error.code === "UNKNOWN_SUPPLIER_TYPE",
  );

  const completeAgain = await updateSupplierCompanyProfile(
    environment,
    request("/supplier/onboarding/company", owner.cookie, "supplier-company-owner-complete"),
    created.company.id,
    completeProfile,
  );
  assert.equal(completeAgain.company.status, "company_documents_required");
  assert.equal(completeAgain.completeness.complete, true);

  const evidence = await client.query(
    `
      select
        c.status,
        c.business_identity_review_id,
        m.role,
        count(distinct ct.supplier_type_key)::int as supplier_types,
        count(distinct ac.context_key)::int as contexts,
        count(distinct pc.capability_key)::int as capabilities,
        count(distinct em.country_code)::int as export_markets
      from supplier_companies c
      join supplier_memberships m on m.company_id = c.id and m.user_id = $2
      left join supplier_company_types ct on ct.company_id = c.id
      left join supplier_application_contexts ac on ac.company_id = c.id
      left join supplier_production_capabilities pc on pc.company_id = c.id
      left join supplier_export_markets em on em.company_id = c.id
      where c.id = $1
      group by c.status, c.business_identity_review_id, m.role
    `,
    [created.company.id, owner.id],
  );
  assert.deepEqual(evidence.rows[0], {
    status: "company_documents_required",
    business_identity_review_id: identity.reviewId,
    role: "owner",
    supplier_types: 1,
    contexts: 2,
    capabilities: 1,
    export_markets: 2,
  });

  const auditEvidence = await client.query(
    `
      select action, actor_id, effective_role, request_id, old_value, new_value
      from audit_logs
      where resource_type = 'supplier_company'
        and resource_id = $1
      order by created_at, id
    `,
    [created.company.id],
  );
  const createAudit = auditEvidence.rows.find((row) => row.action === "supplier.company.created");
  assert.equal(createAudit?.new_value.businessIdentityReviewId, identity.reviewId);

  const activationTransitions = auditEvidence.rows.filter(
    (row) => row.action === "supplier.activation.status_changed",
  );
  assert.deepEqual(
    activationTransitions.map((row) => [row.old_value.status, row.new_value.status]),
    [
      ["supplier_draft", "company_documents_required"],
      ["company_documents_required", "supplier_draft"],
      ["supplier_draft", "company_documents_required"],
    ],
  );

  const activationOutbox = await client.query(
    `
      select event_type, payload
      from outbox_events
      where aggregate_type = 'supplier_company'
        and aggregate_id = $1
        and event_type = 'supplier.activation.status_changed'
      order by created_at, id
    `,
    [created.company.id],
  );
  assert.equal(activationOutbox.rowCount, 3);
  assert.deepEqual(
    activationOutbox.rows.map((row) => row.payload.nextStatus),
    ["company_documents_required", "supplier_draft", "company_documents_required"],
  );

  const editorAudit = auditEvidence.rows.find(
    (row) =>
      row.action === "supplier.company.profile_updated" &&
      row.actor_id === editor.id &&
      row.effective_role === "supplier_editor" &&
      row.request_id === "supplier-company-editor-update",
  );
  assert(editorAudit, "Editor profile update audit must exist.");
  assert.equal(editorAudit.old_value.description, completeProfile.description);
  assert.deepEqual(editorAudit.old_value.supplierTypeKeys, [launchSupplierTypeKey]);
  assert.equal(editorAudit.new_value.description, null);
  assert.deepEqual(editorAudit.new_value.supplierTypeKeys, []);
  assert.equal(editorAudit.new_value.businessIdentityReviewId, identity.reviewId);

  console.log(
    "Supplier company foundation verified: literal taxonomy constraints, supplier intent and identity-bound evidence gates, owner creation, membership isolation, viewer denial, legal-name drift denial, editor update, seeded taxonomy enforcement, deterministic completeness, activation prerequisite transitions, transactional outbox events and reconstructable immutable audit evidence passed.",
  );
} finally {
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

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import {
  grantStaffAssignment,
  loadStaffAssignments,
  revokeStaffAssignment,
  StaffManagementError,
  type StaffManagementEnvironment,
} from "../app/lib/authorization/staff-management.server";
import {
  resolveEffectiveStaffManagerRole,
  resolveEffectiveStaffRole,
  StaffAuthorizationError,
} from "../app/lib/authorization/platform-staff.server";
import { createAuth, type AuthEnvironment } from "../app/lib/auth/create-auth.server";
import { authRequest, registerWithPreferences } from "../app/lib/auth/registration.server";
import * as schema from "../app/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";
if (!connectionString) {
  throw new Error("DATABASE_URL is required for platform staff management verification.");
}

function request(
  path: string,
  cookie?: string,
  requestId = `staff-management-${randomUUID()}`,
): Request {
  const headers = new Headers({
    origin: baseUrl,
    "user-agent": "openmarket-staff-management-verification",
    "cf-connecting-ip": "203.0.113.99",
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

const environment: StaffManagementEnvironment = {
  HYPERDRIVE: { connectionString } as AuthEnvironment["HYPERDRIVE"],
  BETTER_AUTH_SECRET: "openmarket-platform-staff-management-secret-2026",
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
  createdUserIds.push(id);
  await client.query('update "user" set email_verified = true where id = $1', [id]);

  const signin = await auth.handler(
    authRequest(registrationRequest, "/api/auth/sign-in/email", { email, password }),
  );
  assert(signin.ok, `${label} signin failed with ${signin.status}.`);
  return { id, email, cookie: cookieFrom(signin) };
}

try {
  const superAdmin = await registerFixture("Super Admin Fixture", "super-admin");
  const platformAdmin = await registerFixture("Platform Admin Fixture", "platform-admin");
  const reviewer = await registerFixture("Reviewer Fixture", "reviewer");
  const operationsTarget = await registerFixture("Operations Target Fixture", "operations-target");
  const administratorTarget = await registerFixture(
    "Administrator Target Fixture",
    "administrator-target",
  );

  await database.insert(schema.platformStaffAssignments).values([
    {
      userId: superAdmin.id,
      role: "super_admin",
      assignedBy: superAdmin.id,
      assignmentReason: "Controlled bootstrap fixture",
    },
    {
      userId: platformAdmin.id,
      role: "platform_admin",
      assignedBy: superAdmin.id,
      assignmentReason: "Platform administrator fixture",
    },
    {
      userId: reviewer.id,
      role: "compliance_reviewer",
      assignedBy: superAdmin.id,
      assignmentReason: "Management denial fixture",
    },
  ]);

  await assert.rejects(
    loadStaffAssignments(environment, request("/admin/staff")),
    (error: unknown) =>
      error instanceof StaffAuthorizationError && error.code === "UNAUTHENTICATED",
  );
  await assert.rejects(
    loadStaffAssignments(environment, request("/admin/staff", reviewer.cookie)),
    (error: unknown) => error instanceof StaffAuthorizationError && error.code === "FORBIDDEN",
  );

  const initialList = await loadStaffAssignments(
    environment,
    request("/admin/staff", platformAdmin.cookie),
  );
  assert.equal(initialList.effectiveRole, "platform_admin");
  assert(initialList.value.some((assignment) => assignment.userId === reviewer.id));

  const granted = await grantStaffAssignment(
    environment,
    request("/admin/staff", platformAdmin.cookie, "staff-management-grant-reviewer"),
    {
      targetEmail: operationsTarget.email.toUpperCase(),
      role: "compliance_reviewer",
      reason: "Assign independent business identity review duties",
    },
  );
  assert.equal(granted.status, "active");
  assert.equal(granted.userId, operationsTarget.id);
  assert.equal(granted.role, "compliance_reviewer");

  const reviewerRole = await resolveEffectiveStaffRole(
    database,
    operationsTarget.id,
    "business_identity.review.decide",
  );
  assert.equal(reviewerRole, "compliance_reviewer");

  const grantAudit = await client.query(
    `
      select actor_id, effective_role, action, reason
      from audit_logs
      where resource_type = 'platform_staff_assignment'
        and resource_id = $1
        and request_id = 'staff-management-grant-reviewer'
    `,
    [granted.id],
  );
  assert.deepEqual(grantAudit.rows[0], {
    actor_id: platformAdmin.id,
    effective_role: "platform_admin",
    action: "platform_staff.assignment.granted",
    reason: "Assign independent business identity review duties",
  });

  await assert.rejects(
    grantStaffAssignment(environment, request("/admin/staff", platformAdmin.cookie), {
      targetEmail: operationsTarget.email,
      role: "compliance_reviewer",
      reason: "Duplicate assignment must fail",
    }),
    (error: unknown) =>
      error instanceof StaffManagementError && error.code === "ASSIGNMENT_ALREADY_ACTIVE",
  );

  await assert.rejects(
    grantStaffAssignment(environment, request("/admin/staff", platformAdmin.cookie), {
      targetEmail: administratorTarget.email,
      role: "platform_admin",
      reason: "Platform Admin must not grant administrator roles",
    }),
    (error: unknown) =>
      error instanceof StaffManagementError && error.code === "ROLE_NOT_MANAGEABLE",
  );

  await assert.rejects(
    grantStaffAssignment(environment, request("/admin/staff", platformAdmin.cookie), {
      targetEmail: platformAdmin.email,
      role: "compliance_reviewer",
      reason: "Self assignment must fail",
    }),
    (error: unknown) =>
      error instanceof StaffAuthorizationError && error.code === "SELF_MANAGEMENT",
  );

  await revokeStaffAssignment(
    environment,
    request("/admin/staff", platformAdmin.cookie, "staff-management-revoke-reviewer"),
    {
      assignmentId: granted.id,
      reason: "Review duty rotation completed",
    },
  );
  assert.equal(
    await resolveEffectiveStaffRole(
      database,
      operationsTarget.id,
      "business_identity.review.decide",
    ),
    null,
  );

  const revokeAudit = await client.query(
    `
      select actor_id, effective_role, action, reason
      from audit_logs
      where resource_type = 'platform_staff_assignment'
        and resource_id = $1
        and request_id = 'staff-management-revoke-reviewer'
    `,
    [granted.id],
  );
  assert.deepEqual(revokeAudit.rows[0], {
    actor_id: platformAdmin.id,
    effective_role: "platform_admin",
    action: "platform_staff.assignment.revoked",
    reason: "Review duty rotation completed",
  });

  const regranted = await grantStaffAssignment(
    environment,
    request("/admin/staff", platformAdmin.cookie, "staff-management-regrant-reviewer"),
    {
      targetEmail: operationsTarget.email,
      role: "compliance_reviewer",
      reason: "Review duty restored after rotation",
    },
  );
  assert.equal(regranted.id, granted.id);
  assert.equal(regranted.status, "active");

  const duplicateRows = await database
    .select({ id: schema.platformStaffAssignments.id })
    .from(schema.platformStaffAssignments)
    .where(
      and(
        eq(schema.platformStaffAssignments.userId, operationsTarget.id),
        eq(schema.platformStaffAssignments.role, "compliance_reviewer"),
      ),
    );
  assert.equal(duplicateRows.length, 1);

  const adminAssignment = await grantStaffAssignment(
    environment,
    request("/admin/staff", superAdmin.cookie, "staff-management-grant-admin"),
    {
      targetEmail: administratorTarget.email,
      role: "platform_admin",
      reason: "Grant controlled platform administration duties",
    },
  );
  assert.equal(adminAssignment.status, "active");
  assert.equal(
    await resolveEffectiveStaffManagerRole(
      database,
      administratorTarget.id,
      "platform_staff.assignment.list",
    ),
    "platform_admin",
  );

  await assert.rejects(
    revokeStaffAssignment(environment, request("/admin/staff", platformAdmin.cookie), {
      assignmentId: adminAssignment.id,
      reason: "Platform Admin cannot revoke administrator roles",
    }),
    (error: unknown) =>
      error instanceof StaffManagementError && error.code === "ROLE_NOT_MANAGEABLE",
  );

  await revokeStaffAssignment(
    environment,
    request("/admin/staff", superAdmin.cookie, "staff-management-revoke-admin"),
    {
      assignmentId: adminAssignment.id,
      reason: "Administrator duty period ended",
    },
  );
  assert.equal(
    await resolveEffectiveStaffManagerRole(
      database,
      administratorTarget.id,
      "platform_staff.assignment.list",
    ),
    null,
  );

  const platformAdminAssignment = initialList.value.find(
    (assignment) => assignment.userId === platformAdmin.id && assignment.role === "platform_admin",
  );
  assert(platformAdminAssignment, "Platform Admin assignment fixture must exist.");
  await assert.rejects(
    revokeStaffAssignment(environment, request("/admin/staff", platformAdmin.cookie), {
      assignmentId: platformAdminAssignment.id,
      reason: "Self revocation must fail",
    }),
    (error: unknown) =>
      error instanceof StaffAuthorizationError && error.code === "SELF_MANAGEMENT",
  );

  await assert.rejects(
    grantStaffAssignment(environment, request("/admin/staff", superAdmin.cookie), {
      targetEmail: operationsTarget.email,
      role: "product_rfq_moderator",
      reason: "x",
    }),
    (error: unknown) => error instanceof StaffManagementError && error.code === "INVALID_REASON",
  );

  console.log(
    "Platform staff management verified: administrator-only access, hierarchy enforcement, self-management denial, exact-account grant, duplicate protection, revoke/regrant lifecycle, immediate permission changes and effective-role audits passed.",
  );
} finally {
  if (createdUserIds.length > 0) {
    await database
      .delete(schema.platformStaffAssignments)
      .where(inArray(schema.platformStaffAssignments.userId, createdUserIds));
    await client.query('delete from "user" where id = any($1::uuid[])', [createdUserIds]);
  }
  await client.end();
}

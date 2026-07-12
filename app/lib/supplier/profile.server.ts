import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { createAuth, type AuthEnvironment } from "../auth/create-auth.server";
import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import {
  auditLogs,
  businessIdentityReviews,
  productionCapabilities,
  supplierApplicationContexts,
  supplierCompanies,
  supplierCompanyTypes,
  supplierExportMarkets,
  supplierMemberships,
  supplierProductionCapabilities,
  supplierTypes,
  user,
  userPreferences,
  type SupplierMembershipRole,
  type SupplierWorkspaceStatus,
} from "../db/schema";
import {
  evaluateSupplierProfileCompleteness,
  membershipCanEditSupplierProfile,
  validateSupplierProfile,
  type SupplierProfileCompleteness,
  type SupplierProfileInput,
} from "./profile";

export type SupplierProfileEnvironment = AuthEnvironment;

export type SupplierCompanyState = {
  company: {
    id: string;
    status: SupplierWorkspaceStatus;
    legalName: string;
    tradingName: string | null;
    countryCode: string;
    city: string;
    website: string | null;
    description: string | null;
    foundedYear: number | null;
  };
  membershipRole: SupplierMembershipRole;
  supplierTypeKeys: string[];
  applicationContextKeys: string[];
  productionCapabilityKeys: string[];
  exportMarketCountryCodes: string[];
  completeness: SupplierProfileCompleteness;
};

export class SupplierProfileActionError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "SUPPLIER_INTENT_REQUIRED"
      | "BUSINESS_IDENTITY_REQUIRED"
      | "SUPPLIER_COMPANY_EXISTS"
      | "SUPPLIER_COMPANY_NOT_FOUND"
      | "FORBIDDEN"
      | "UNKNOWN_SUPPLIER_TYPE"
      | "UNKNOWN_PRODUCTION_CAPABILITY",
    message: string,
  ) {
    super(message);
    this.name = "SupplierProfileActionError";
  }
}

function requestId(request: Request): string | undefined {
  return request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined;
}

async function currentSession(
  database: Database,
  env: SupplierProfileEnvironment,
  request: Request,
) {
  const auth = createAuth(database, env);
  return auth.api.getSession({ headers: request.headers });
}

async function requireSupplierEligibility(database: Database, userId: string): Promise<void> {
  const [preferences] = await database
    .select({ intendedUse: userPreferences.intendedUse })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (
    !preferences ||
    (preferences.intendedUse !== "supplier" && preferences.intendedUse !== "both")
  ) {
    throw new SupplierProfileActionError(
      "SUPPLIER_INTENT_REQUIRED",
      "Supplier or Both workspace intent is required before creating a supplier company.",
    );
  }

  const [verifiedIdentity] = await database
    .select({ id: businessIdentityReviews.id })
    .from(businessIdentityReviews)
    .where(
      and(
        eq(businessIdentityReviews.userId, userId),
        eq(businessIdentityReviews.status, "verified"),
      ),
    )
    .limit(1);

  if (!verifiedIdentity) {
    throw new SupplierProfileActionError(
      "BUSINESS_IDENTITY_REQUIRED",
      "Verified business identity is required before creating a supplier company.",
    );
  }
}

async function requireSeededSelections(
  database: Database,
  supplierTypeKeys: readonly string[],
  productionCapabilityKeys: readonly string[],
): Promise<void> {
  if (supplierTypeKeys.length > 0) {
    const rows = await database
      .select({ key: supplierTypes.key })
      .from(supplierTypes)
      .where(
        and(inArray(supplierTypes.key, [...supplierTypeKeys]), eq(supplierTypes.active, true)),
      );
    if (rows.length !== supplierTypeKeys.length) {
      throw new SupplierProfileActionError(
        "UNKNOWN_SUPPLIER_TYPE",
        "Supplier types must be selected from the active seeded catalogue.",
      );
    }
  }

  if (productionCapabilityKeys.length > 0) {
    const rows = await database
      .select({ key: productionCapabilities.key })
      .from(productionCapabilities)
      .where(
        and(
          inArray(productionCapabilities.key, [...productionCapabilityKeys]),
          eq(productionCapabilities.active, true),
        ),
      );
    if (rows.length !== productionCapabilityKeys.length) {
      throw new SupplierProfileActionError(
        "UNKNOWN_PRODUCTION_CAPABILITY",
        "Production capabilities must be selected from the active seeded catalogue.",
      );
    }
  }
}

async function replaceProfileSelections(
  database: Database,
  companyId: string,
  profile: SupplierProfileInput,
): Promise<void> {
  await database.delete(supplierCompanyTypes).where(eq(supplierCompanyTypes.companyId, companyId));
  await database
    .delete(supplierApplicationContexts)
    .where(eq(supplierApplicationContexts.companyId, companyId));
  await database
    .delete(supplierProductionCapabilities)
    .where(eq(supplierProductionCapabilities.companyId, companyId));
  await database
    .delete(supplierExportMarkets)
    .where(eq(supplierExportMarkets.companyId, companyId));

  if (profile.supplierTypeKeys.length > 0) {
    await database
      .insert(supplierCompanyTypes)
      .values(profile.supplierTypeKeys.map((supplierTypeKey) => ({ companyId, supplierTypeKey })));
  }
  if (profile.applicationContextKeys.length > 0) {
    await database
      .insert(supplierApplicationContexts)
      .values(profile.applicationContextKeys.map((contextKey) => ({ companyId, contextKey })));
  }
  if (profile.productionCapabilityKeys.length > 0) {
    await database
      .insert(supplierProductionCapabilities)
      .values(
        profile.productionCapabilityKeys.map((capabilityKey) => ({ companyId, capabilityKey })),
      );
  }
  if (profile.exportMarketCountryCodes.length > 0) {
    await database
      .insert(supplierExportMarkets)
      .values(profile.exportMarketCountryCodes.map((countryCode) => ({ companyId, countryCode })));
  }
}

async function companyState(
  database: Database,
  userId: string,
  companyId?: string,
): Promise<SupplierCompanyState | null> {
  const where = companyId
    ? and(
        eq(supplierMemberships.userId, userId),
        eq(supplierMemberships.companyId, companyId),
        eq(supplierMemberships.status, "active"),
      )
    : and(eq(supplierMemberships.userId, userId), eq(supplierMemberships.status, "active"));

  const [row] = await database
    .select({
      id: supplierCompanies.id,
      status: supplierCompanies.status,
      legalName: supplierCompanies.legalName,
      tradingName: supplierCompanies.tradingName,
      countryCode: supplierCompanies.countryCode,
      city: supplierCompanies.city,
      website: supplierCompanies.website,
      description: supplierCompanies.description,
      foundedYear: supplierCompanies.foundedYear,
      membershipRole: supplierMemberships.role,
    })
    .from(supplierMemberships)
    .innerJoin(supplierCompanies, eq(supplierCompanies.id, supplierMemberships.companyId))
    .where(where)
    .orderBy(asc(supplierMemberships.assignedAt), asc(supplierMemberships.id))
    .limit(1);

  if (!row) return null;

  const [typeRows, contextRows, capabilityRows, marketRows] = await Promise.all([
    database
      .select({ key: supplierCompanyTypes.supplierTypeKey })
      .from(supplierCompanyTypes)
      .where(eq(supplierCompanyTypes.companyId, row.id))
      .orderBy(asc(supplierCompanyTypes.supplierTypeKey)),
    database
      .select({ key: supplierApplicationContexts.contextKey })
      .from(supplierApplicationContexts)
      .where(eq(supplierApplicationContexts.companyId, row.id))
      .orderBy(asc(supplierApplicationContexts.contextKey)),
    database
      .select({ key: supplierProductionCapabilities.capabilityKey })
      .from(supplierProductionCapabilities)
      .where(eq(supplierProductionCapabilities.companyId, row.id))
      .orderBy(asc(supplierProductionCapabilities.capabilityKey)),
    database
      .select({ code: supplierExportMarkets.countryCode })
      .from(supplierExportMarkets)
      .where(eq(supplierExportMarkets.companyId, row.id))
      .orderBy(asc(supplierExportMarkets.countryCode)),
  ]);

  const supplierTypeKeys = typeRows.map((item) => item.key);
  const applicationContextKeys = contextRows.map((item) => item.key);
  const productionCapabilityKeys = capabilityRows.map((item) => item.key);
  const exportMarketCountryCodes = marketRows.map((item) => item.code);
  const profile = {
    legalName: row.legalName,
    tradingName: row.tradingName,
    countryCode: row.countryCode,
    city: row.city,
    website: row.website,
    description: row.description,
    foundedYear: row.foundedYear,
    supplierTypeKeys,
    applicationContextKeys,
    productionCapabilityKeys,
    exportMarketCountryCodes,
  };

  return {
    company: {
      id: row.id,
      status: row.status,
      legalName: row.legalName,
      tradingName: row.tradingName,
      countryCode: row.countryCode,
      city: row.city,
      website: row.website,
      description: row.description,
      foundedYear: row.foundedYear,
    },
    membershipRole: row.membershipRole,
    supplierTypeKeys,
    applicationContextKeys,
    productionCapabilityKeys,
    exportMarketCountryCodes,
    completeness: evaluateSupplierProfileCompleteness(profile),
  };
}

export async function loadSupplierCompanyState(
  env: SupplierProfileEnvironment,
  request: Request,
  companyId?: string,
): Promise<SupplierCompanyState | null> {
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;
    return companyState(database, session.user.id, companyId);
  });
}

export async function createSupplierCompany(
  env: SupplierProfileEnvironment,
  request: Request,
  input: SupplierProfileInput,
): Promise<SupplierCompanyState> {
  const profile = validateSupplierProfile(input);

  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new SupplierProfileActionError("UNAUTHENTICATED", "Authentication is required.");
      }

      await scoped.execute(
        sql`select ${user.id} from ${user} where ${user.id} = ${session.user.id} for update`,
      );
      await requireSupplierEligibility(scoped, session.user.id);
      await requireSeededSelections(
        scoped,
        profile.supplierTypeKeys,
        profile.productionCapabilityKeys,
      );

      const [existing] = await scoped
        .select({ id: supplierMemberships.id })
        .from(supplierMemberships)
        .where(
          and(
            eq(supplierMemberships.userId, session.user.id),
            eq(supplierMemberships.role, "owner"),
            eq(supplierMemberships.status, "active"),
          ),
        )
        .limit(1);
      if (existing) {
        throw new SupplierProfileActionError(
          "SUPPLIER_COMPANY_EXISTS",
          "The account already owns an active supplier company.",
        );
      }

      const now = new Date();
      const [company] = await scoped
        .insert(supplierCompanies)
        .values({
          legalName: profile.legalName,
          tradingName: profile.tradingName,
          countryCode: profile.countryCode,
          city: profile.city,
          website: profile.website,
          description: profile.description,
          foundedYear: profile.foundedYear,
          status: "supplier_draft",
          createdBy: session.user.id,
          updatedAt: now,
        })
        .returning({ id: supplierCompanies.id });

      await scoped.insert(supplierMemberships).values({
        companyId: company!.id,
        userId: session.user.id,
        role: "owner",
        status: "active",
        assignedBy: session.user.id,
        assignedAt: now,
        updatedAt: now,
      });
      await replaceProfileSelections(scoped, company!.id, profile);

      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole: "supplier_owner",
        resourceType: "supplier_company",
        resourceId: company!.id,
        action: "supplier.company.created",
        newValue: {
          status: "supplier_draft",
          legalName: profile.legalName,
          countryCode: profile.countryCode,
          supplierTypeKeys: profile.supplierTypeKeys,
          applicationContextKeys: profile.applicationContextKeys,
          productionCapabilityKeys: profile.productionCapabilityKeys,
          exportMarketCountryCodes: profile.exportMarketCountryCodes,
          completeness: evaluateSupplierProfileCompleteness(profile),
        },
        reason: "Verified business account created a supplier company draft",
        requestId: requestId(request),
      });

      return (await companyState(scoped, session.user.id, company!.id))!;
    }),
  );
}

export async function updateSupplierCompanyProfile(
  env: SupplierProfileEnvironment,
  request: Request,
  companyId: string,
  input: SupplierProfileInput,
): Promise<SupplierCompanyState> {
  const profile = validateSupplierProfile(input);

  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new SupplierProfileActionError("UNAUTHENTICATED", "Authentication is required.");
      }

      const [membership] = await scoped
        .select({ role: supplierMemberships.role })
        .from(supplierMemberships)
        .where(
          and(
            eq(supplierMemberships.companyId, companyId),
            eq(supplierMemberships.userId, session.user.id),
            eq(supplierMemberships.status, "active"),
          ),
        )
        .limit(1);
      if (!membership) {
        throw new SupplierProfileActionError(
          "SUPPLIER_COMPANY_NOT_FOUND",
          "Supplier company was not found for the current account.",
        );
      }
      if (!membershipCanEditSupplierProfile(membership.role)) {
        throw new SupplierProfileActionError(
          "FORBIDDEN",
          "The current membership cannot edit the supplier profile.",
        );
      }

      await requireSeededSelections(
        scoped,
        profile.supplierTypeKeys,
        profile.productionCapabilityKeys,
      );
      const [company] = await scoped
        .select({ status: supplierCompanies.status })
        .from(supplierCompanies)
        .where(eq(supplierCompanies.id, companyId))
        .limit(1)
        .for("update");
      if (!company) {
        throw new SupplierProfileActionError(
          "SUPPLIER_COMPANY_NOT_FOUND",
          "Supplier company was not found.",
        );
      }

      await scoped
        .update(supplierCompanies)
        .set({
          legalName: profile.legalName,
          tradingName: profile.tradingName,
          countryCode: profile.countryCode,
          city: profile.city,
          website: profile.website,
          description: profile.description,
          foundedYear: profile.foundedYear,
          updatedAt: new Date(),
        })
        .where(eq(supplierCompanies.id, companyId));
      await replaceProfileSelections(scoped, companyId, profile);

      const completeness = evaluateSupplierProfileCompleteness(profile);
      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole: `supplier_${membership.role}`,
        resourceType: "supplier_company",
        resourceId: companyId,
        action: "supplier.company.profile_updated",
        newValue: {
          status: company.status,
          supplierTypeKeys: profile.supplierTypeKeys,
          applicationContextKeys: profile.applicationContextKeys,
          productionCapabilityKeys: profile.productionCapabilityKeys,
          exportMarketCountryCodes: profile.exportMarketCountryCodes,
          completeness,
        },
        reason: "Authorized supplier member updated the company profile",
        requestId: requestId(request),
      });

      return (await companyState(scoped, session.user.id, companyId))!;
    }),
  );
}

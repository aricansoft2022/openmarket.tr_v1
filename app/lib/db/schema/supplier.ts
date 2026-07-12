import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const supplierWorkspaceStatuses = [
  "supplier_draft",
  "company_documents_required",
  "company_documents_pending",
  "company_documents_rejected",
  "active_supplier",
  "reactivation_required",
  "suspended_supplier",
] as const;
export type SupplierWorkspaceStatus = (typeof supplierWorkspaceStatuses)[number];

export const supplierMembershipRoles = ["owner", "admin", "editor", "viewer"] as const;
export type SupplierMembershipRole = (typeof supplierMembershipRoles)[number];

export const supplierMembershipStatuses = ["active", "revoked"] as const;
export type SupplierMembershipStatus = (typeof supplierMembershipStatuses)[number];

export const supplierCompanies = pgTable(
  "supplier_companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    status: text("status").$type<SupplierWorkspaceStatus>().default("supplier_draft").notNull(),
    legalName: text("legal_name").notNull(),
    tradingName: text("trading_name"),
    countryCode: text("country_code").notNull(),
    city: text("city").notNull(),
    website: text("website"),
    description: text("description"),
    foundedYear: integer("founded_year"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("supplier_companies_status_idx").on(table.status, table.updatedAt),
    index("supplier_companies_created_by_idx").on(table.createdBy, table.createdAt),
    check(
      "supplier_companies_status_check",
      sql`${table.status} in ('supplier_draft', 'company_documents_required', 'company_documents_pending', 'company_documents_rejected', 'active_supplier', 'reactivation_required', 'suspended_supplier')`,
    ),
    check(
      "supplier_companies_legal_name_check",
      sql`char_length(trim(${table.legalName})) between 2 and 200`,
    ),
    check(
      "supplier_companies_trading_name_check",
      sql`${table.tradingName} is null or char_length(trim(${table.tradingName})) between 2 and 200`,
    ),
    check(
      "supplier_companies_country_code_check",
      sql`${table.countryCode} ~ '^[A-Z]{2}$'`,
    ),
    check(
      "supplier_companies_city_check",
      sql`char_length(trim(${table.city})) between 2 and 120`,
    ),
    check(
      "supplier_companies_description_check",
      sql`${table.description} is null or char_length(trim(${table.description})) between 20 and 4000`,
    ),
    check(
      "supplier_companies_founded_year_check",
      sql`${table.foundedYear} is null or ${table.foundedYear} between 1800 and 2100`,
    ),
  ],
);

export const supplierMemberships = pgTable(
  "supplier_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => supplierCompanies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").$type<SupplierMembershipRole>().notNull(),
    status: text("status").$type<SupplierMembershipStatus>().default("active").notNull(),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    revokedBy: uuid("revoked_by").references(() => user.id, { onDelete: "set null" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revocationReason: text("revocation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("supplier_memberships_company_user_idx").on(table.companyId, table.userId),
    index("supplier_memberships_user_status_idx").on(table.userId, table.status, table.companyId),
    check(
      "supplier_memberships_role_check",
      sql`${table.role} in ('owner', 'admin', 'editor', 'viewer')`,
    ),
    check(
      "supplier_memberships_status_check",
      sql`${table.status} in ('active', 'revoked')`,
    ),
    check(
      "supplier_memberships_state_check",
      sql`(${table.status} = 'active' and ${table.revokedBy} is null and ${table.revokedAt} is null and ${table.revocationReason} is null)
        or (${table.status} = 'revoked' and ${table.revokedBy} is not null and ${table.revokedAt} is not null and char_length(trim(${table.revocationReason})) >= 3)`,
    ),
  ],
);

export const supplierTypes = pgTable(
  "supplier_types",
  {
    key: text("key").primaryKey(),
    labelTr: text("label_tr").notNull(),
    labelEn: text("label_en").notNull(),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("supplier_types_key_check", sql`${table.key} ~ '^supplier_type\.[a-z0-9_]+$'`),
    check("supplier_types_label_tr_check", sql`char_length(trim(${table.labelTr})) between 2 and 120`),
    check("supplier_types_label_en_check", sql`char_length(trim(${table.labelEn})) between 2 and 120`),
  ],
);

export const supplierCompanyTypes = pgTable(
  "supplier_company_types",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => supplierCompanies.id, { onDelete: "cascade" }),
    supplierTypeKey: text("supplier_type_key")
      .notNull()
      .references(() => supplierTypes.key, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.supplierTypeKey] }),
    index("supplier_company_types_type_idx").on(table.supplierTypeKey, table.companyId),
  ],
);

export const supplierApplicationContexts = pgTable(
  "supplier_application_contexts",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => supplierCompanies.id, { onDelete: "cascade" }),
    contextKey: text("context_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.contextKey] }),
    index("supplier_application_contexts_context_idx").on(table.contextKey, table.companyId),
    check(
      "supplier_application_contexts_key_check",
      sql`${table.contextKey} in ('context.home_retail', 'context.hotel_hospitality', 'context.hospital_healthcare_accommodation', 'context.dormitory_institutional_accommodation')`,
    ),
  ],
);

export const productionCapabilities = pgTable(
  "production_capabilities",
  {
    key: text("key").primaryKey(),
    labelTr: text("label_tr").notNull(),
    labelEn: text("label_en").notNull(),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "production_capabilities_key_check",
      sql`${table.key} ~ '^production_capability\.[a-z0-9_]+$'`,
    ),
    check(
      "production_capabilities_label_tr_check",
      sql`char_length(trim(${table.labelTr})) between 2 and 120`,
    ),
    check(
      "production_capabilities_label_en_check",
      sql`char_length(trim(${table.labelEn})) between 2 and 120`,
    ),
  ],
);

export const supplierProductionCapabilities = pgTable(
  "supplier_production_capabilities",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => supplierCompanies.id, { onDelete: "cascade" }),
    capabilityKey: text("capability_key")
      .notNull()
      .references(() => productionCapabilities.key, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.capabilityKey] }),
    index("supplier_production_capabilities_capability_idx").on(
      table.capabilityKey,
      table.companyId,
    ),
  ],
);

export const supplierExportMarkets = pgTable(
  "supplier_export_markets",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => supplierCompanies.id, { onDelete: "cascade" }),
    countryCode: text("country_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.countryCode] }),
    index("supplier_export_markets_country_idx").on(table.countryCode, table.companyId),
    check("supplier_export_markets_country_check", sql`${table.countryCode} ~ '^[A-Z]{2}$'`),
  ],
);

import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const emailDomainPolicyKinds = [
  "public_email",
  "blocked",
  "company_exception",
] as const;
export type EmailDomainPolicyKind = (typeof emailDomainPolicyKinds)[number];

export const companyEmailStatuses = ["pending", "verified", "rejected"] as const;
export type CompanyEmailStatus = (typeof companyEmailStatuses)[number];

export const businessIdentityReviewMethods = [
  "company_email",
  "manual_exception",
  "admin_override",
] as const;
export type BusinessIdentityReviewMethod = (typeof businessIdentityReviewMethods)[number];

export const businessIdentityReviewStatuses = ["draft", "pending", "verified", "rejected"] as const;
export type BusinessIdentityReviewStatus = (typeof businessIdentityReviewStatuses)[number];

export const buyerProfileStatuses = ["browser", "active", "suspended"] as const;
export type BuyerProfileStatus = (typeof buyerProfileStatuses)[number];

export const emailDomainPolicies = pgTable(
  "email_domain_policies",
  {
    domain: text("domain").primaryKey(),
    kind: text("kind").$type<EmailDomainPolicyKind>().notNull(),
    reason: text("reason"),
    createdBy: uuid("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("email_domain_policies_kind_idx").on(table.kind, table.domain),
    check("email_domain_policies_domain_lower_check", sql`${table.domain} = lower(${table.domain})`),
    check(
      "email_domain_policies_domain_length_check",
      sql`char_length(${table.domain}) between 3 and 253`,
    ),
    check(
      "email_domain_policies_kind_check",
      sql`${table.kind} in ('public_email', 'blocked', 'company_exception')`,
    ),
  ],
);

export const companyEmails = pgTable(
  "company_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    domain: text("domain").notNull(),
    status: text("status").$type<CompanyEmailStatus>().default("pending").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("company_emails_user_email_idx").on(table.userId, table.email),
    index("company_emails_user_status_idx").on(table.userId, table.status),
    index("company_emails_domain_status_idx").on(table.domain, table.status),
    check("company_emails_email_lower_check", sql`${table.email} = lower(${table.email})`),
    check("company_emails_domain_lower_check", sql`${table.domain} = lower(${table.domain})`),
    check(
      "company_emails_status_check",
      sql`${table.status} in ('pending', 'verified', 'rejected')`,
    ),
    check(
      "company_emails_verified_timestamp_check",
      sql`(${table.status} = 'verified' and ${table.verifiedAt} is not null and ${table.rejectedAt} is null)
        or (${table.status} = 'rejected' and ${table.rejectedAt} is not null and ${table.verifiedAt} is null)
        or (${table.status} = 'pending' and ${table.verifiedAt} is null and ${table.rejectedAt} is null)`,
    ),
  ],
);

export const businessIdentityReviews = pgTable(
  "business_identity_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyEmailId: uuid("company_email_id").references(() => companyEmails.id, {
      onDelete: "set null",
    }),
    method: text("method").$type<BusinessIdentityReviewMethod>().notNull(),
    status: text("status").$type<BusinessIdentityReviewStatus>().default("draft").notNull(),
    companyName: text("company_name").notNull(),
    submittedDomain: text("submitted_domain").notNull(),
    applicantNote: text("applicant_note"),
    reviewNote: text("review_note"),
    rejectionReason: text("rejection_reason"),
    reviewedBy: uuid("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("business_identity_reviews_user_status_idx").on(table.userId, table.status),
    index("business_identity_reviews_review_queue_idx").on(table.status, table.submittedAt),
    index("business_identity_reviews_domain_idx").on(table.submittedDomain),
    check(
      "business_identity_reviews_method_check",
      sql`${table.method} in ('company_email', 'manual_exception', 'admin_override')`,
    ),
    check(
      "business_identity_reviews_status_check",
      sql`${table.status} in ('draft', 'pending', 'verified', 'rejected')`,
    ),
    check(
      "business_identity_reviews_company_name_check",
      sql`char_length(trim(${table.companyName})) between 2 and 160`,
    ),
    check(
      "business_identity_reviews_domain_lower_check",
      sql`${table.submittedDomain} = lower(${table.submittedDomain})`,
    ),
    check(
      "business_identity_reviews_state_timestamp_check",
      sql`(${table.status} = 'draft' and ${table.submittedAt} is null and ${table.reviewedAt} is null)
        or (${table.status} = 'pending' and ${table.submittedAt} is not null and ${table.reviewedAt} is null)
        or (${table.status} in ('verified', 'rejected') and ${table.submittedAt} is not null and ${table.reviewedAt} is not null)`,
    ),
    check(
      "business_identity_reviews_rejection_reason_check",
      sql`(${table.status} = 'rejected' and char_length(trim(${table.rejectionReason})) >= 3)
        or (${table.status} <> 'rejected' and ${table.rejectionReason} is null)`,
    ),
  ],
);

export const buyerProfiles = pgTable(
  "buyer_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").$type<BuyerProfileStatus>().default("browser").notNull(),
    businessIdentityReviewId: uuid("business_identity_review_id").references(
      () => businessIdentityReviews.id,
      { onDelete: "restrict" },
    ),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    suspensionReason: text("suspension_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("buyer_profiles_status_idx").on(table.status, table.updatedAt),
    check(
      "buyer_profiles_status_check",
      sql`${table.status} in ('browser', 'active', 'suspended')`,
    ),
    check(
      "buyer_profiles_state_fields_check",
      sql`(${table.status} = 'browser' and ${table.activatedAt} is null and ${table.suspendedAt} is null and ${table.suspensionReason} is null)
        or (${table.status} = 'active' and ${table.businessIdentityReviewId} is not null and ${table.activatedAt} is not null and ${table.suspendedAt} is null and ${table.suspensionReason} is null)
        or (${table.status} = 'suspended' and ${table.businessIdentityReviewId} is not null and ${table.activatedAt} is not null and ${table.suspendedAt} is not null and char_length(trim(${table.suspensionReason})) >= 3)`,
    ),
  ],
);

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { platformStaffRoles, type PlatformStaffRole } from "./platform-staff";
import { supplierCompanies, supplierTypes } from "./supplier";

export const supplierDocumentRequirementLevels = ["mandatory", "conditional", "optional"] as const;
export type SupplierDocumentRequirementLevel = (typeof supplierDocumentRequirementLevels)[number];

export const supplierDocumentStorageStatuses = [
  "uploading",
  "stored_private",
  "failed",
  "removed",
] as const;
export type SupplierDocumentStorageStatus = (typeof supplierDocumentStorageStatuses)[number];

export const supplierDocumentEvidenceStatuses = [
  "uploaded",
  "pending_review",
  "approved",
  "rejected",
  "expired",
  "replacement_required",
] as const;
export type SupplierDocumentEvidenceStatus = (typeof supplierDocumentEvidenceStatuses)[number];

export const supplierDocumentScanStatuses = ["pending", "clean", "rejected", "failed"] as const;
export type SupplierDocumentScanStatus = (typeof supplierDocumentScanStatuses)[number];

export const supplierDocumentReviewDecisions = [
  "approved",
  "rejected",
  "replacement_required",
] as const;
export type SupplierDocumentReviewDecision = (typeof supplierDocumentReviewDecisions)[number];

export const supplierCompanyDocumentTypes = pgTable(
  "supplier_company_document_types",
  {
    key: text("key").primaryKey(),
    labelTr: text("label_tr").notNull(),
    labelEn: text("label_en").notNull(),
    descriptionTr: text("description_tr").notNull(),
    descriptionEn: text("description_en").notNull(),
    publicEligible: boolean("public_eligible").default(false).notNull(),
    expiryExpected: boolean("expiry_expected").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("supplier_company_document_types_active_order_idx").on(
      table.active,
      table.sortOrder,
      table.key,
    ),
    check(
      "supplier_company_document_types_key_check",
      sql`${table.key} ~ '^company_document[.][a-z0-9_]+$'`,
    ),
    check(
      "supplier_company_document_types_label_tr_check",
      sql`char_length(trim(${table.labelTr})) between 2 and 160`,
    ),
    check(
      "supplier_company_document_types_label_en_check",
      sql`char_length(trim(${table.labelEn})) between 2 and 160`,
    ),
    check(
      "supplier_company_document_types_description_tr_check",
      sql`char_length(trim(${table.descriptionTr})) between 10 and 1000`,
    ),
    check(
      "supplier_company_document_types_description_en_check",
      sql`char_length(trim(${table.descriptionEn})) between 10 and 1000`,
    ),
  ],
);

export const supplierDocumentRequirementRules = pgTable(
  "supplier_document_requirement_rules",
  {
    key: text("key").primaryKey(),
    documentTypeKey: text("document_type_key")
      .notNull()
      .references(() => supplierCompanyDocumentTypes.key, { onDelete: "restrict" }),
    supplierTypeKey: text("supplier_type_key").references(() => supplierTypes.key, {
      onDelete: "restrict",
    }),
    level: text("level").$type<SupplierDocumentRequirementLevel>().notNull(),
    noteTr: text("note_tr").notNull(),
    noteEn: text("note_en").notNull(),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("supplier_document_requirement_rules_resolution_idx").on(
      table.active,
      table.supplierTypeKey,
      table.level,
      table.sortOrder,
    ),
    check(
      "supplier_document_requirement_rules_key_check",
      sql`${table.key} ~ '^company_document_rule[.][a-z0-9_.]+$'`,
    ),
    check(
      "supplier_document_requirement_rules_level_check",
      sql`${table.level} in ('mandatory', 'conditional', 'optional')`,
    ),
    check(
      "supplier_document_requirement_rules_note_tr_check",
      sql`char_length(trim(${table.noteTr})) between 10 and 1000`,
    ),
    check(
      "supplier_document_requirement_rules_note_en_check",
      sql`char_length(trim(${table.noteEn})) between 10 and 1000`,
    ),
  ],
);

export const supplierCompanyDocuments = pgTable(
  "supplier_company_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => supplierCompanies.id, { onDelete: "cascade" }),
    documentTypeKey: text("document_type_key")
      .notNull()
      .references(() => supplierCompanyDocumentTypes.key, { onDelete: "restrict" }),
    version: integer("version").notNull(),
    replacesDocumentId: uuid("replaces_document_id").references(
      (): AnyPgColumn => supplierCompanyDocuments.id,
      { onDelete: "restrict" },
    ),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sha256: text("sha256"),
    storageStatus: text("storage_status")
      .$type<SupplierDocumentStorageStatus>()
      .default("uploading")
      .notNull(),
    evidenceStatus: text("evidence_status")
      .$type<SupplierDocumentEvidenceStatus>()
      .default("uploaded")
      .notNull(),
    scanStatus: text("scan_status")
      .$type<SupplierDocumentScanStatus>()
      .default("pending")
      .notNull(),
    scanNote: text("scan_note"),
    issueDate: timestamp("issue_date", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    publicVisible: boolean("public_visible").default(false).notNull(),
    retentionUntil: timestamp("retention_until", { withTimezone: true }),
    failureReason: text("failure_reason"),
    storedAt: timestamp("stored_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("supplier_company_documents_object_key_idx").on(table.objectKey),
    uniqueIndex("supplier_company_documents_company_type_version_idx").on(
      table.companyId,
      table.documentTypeKey,
      table.version,
    ),
    index("supplier_company_documents_company_status_idx").on(
      table.companyId,
      table.documentTypeKey,
      table.evidenceStatus,
      table.createdAt,
    ),
    index("supplier_company_documents_review_queue_idx").on(
      table.evidenceStatus,
      table.scanStatus,
      table.submittedAt,
    ),
    index("supplier_company_documents_expiry_idx").on(table.expiresAt, table.evidenceStatus),
    check("supplier_company_documents_version_check", sql`${table.version} >= 1`),
    check(
      "supplier_company_documents_filename_check",
      sql`char_length(trim(${table.originalFilename})) between 1 and 180`,
    ),
    check(
      "supplier_company_documents_object_key_check",
      sql`char_length(${table.objectKey}) between 20 and 700`,
    ),
    check(
      "supplier_company_documents_mime_check",
      sql`${table.mimeType} in ('application/pdf', 'image/jpeg', 'image/png')`,
    ),
    check("supplier_company_documents_size_check", sql`${table.sizeBytes} between 1 and 10485760`),
    check(
      "supplier_company_documents_storage_status_check",
      sql`${table.storageStatus} in ('uploading', 'stored_private', 'failed', 'removed')`,
    ),
    check(
      "supplier_company_documents_evidence_status_check",
      sql`${table.evidenceStatus} in ('uploaded', 'pending_review', 'approved', 'rejected', 'expired', 'replacement_required')`,
    ),
    check(
      "supplier_company_documents_scan_status_check",
      sql`${table.scanStatus} in ('pending', 'clean', 'rejected', 'failed')`,
    ),
    check(
      "supplier_company_documents_storage_fields_check",
      sql`(${table.storageStatus} = 'uploading' and ${table.sha256} is null and ${table.storedAt} is null and ${table.removedAt} is null and ${table.failureReason} is null)
        or (${table.storageStatus} = 'stored_private' and char_length(${table.sha256}) = 64 and ${table.storedAt} is not null and ${table.removedAt} is null and ${table.failureReason} is null)
        or (${table.storageStatus} = 'failed' and ${table.storedAt} is null and ${table.removedAt} is null and char_length(trim(${table.failureReason})) >= 3)
        or (${table.storageStatus} = 'removed' and ${table.removedAt} is not null)`,
    ),
    check(
      "supplier_company_documents_submission_check",
      sql`(${table.evidenceStatus} = 'uploaded' and ${table.submittedAt} is null)
        or (${table.evidenceStatus} <> 'uploaded' and ${table.submittedAt} is not null)`,
    ),
    check(
      "supplier_company_documents_scan_note_check",
      sql`(${table.scanStatus} in ('pending', 'clean') and ${table.scanNote} is null)
        or (${table.scanStatus} in ('rejected', 'failed') and char_length(trim(${table.scanNote})) >= 3)`,
    ),
    check(
      "supplier_company_documents_public_visibility_check",
      sql`${table.publicVisible} = false or (${table.evidenceStatus} = 'approved' and ${table.storageStatus} = 'stored_private')`,
    ),
    check(
      "supplier_company_documents_expiry_order_check",
      sql`${table.issueDate} is null or ${table.expiresAt} is null or ${table.expiresAt} > ${table.issueDate}`,
    ),
  ],
);

export const supplierDocumentReviewEvents = pgTable(
  "supplier_document_review_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => supplierCompanyDocuments.id, { onDelete: "restrict" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    effectiveRole: text("effective_role").$type<PlatformStaffRole>().notNull(),
    decision: text("decision").$type<SupplierDocumentReviewDecision>().notNull(),
    reason: text("reason").notNull(),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("supplier_document_review_events_document_idx").on(table.documentId, table.createdAt),
    index("supplier_document_review_events_reviewer_idx").on(table.reviewerId, table.createdAt),
    check(
      "supplier_document_review_events_role_check",
      sql`${table.effectiveRole} in (${sql.join(
        platformStaffRoles.map((role) => sql`${role}`),
        sql`, `,
      )})`,
    ),
    check(
      "supplier_document_review_events_decision_check",
      sql`${table.decision} in ('approved', 'rejected', 'replacement_required')`,
    ),
    check(
      "supplier_document_review_events_reason_check",
      sql`char_length(trim(${table.reason})) between 3 and 2000`,
    ),
    check(
      "supplier_document_review_events_note_check",
      sql`${table.reviewNote} is null or char_length(trim(${table.reviewNote})) between 3 and 4000`,
    ),
  ],
);

export const supplierDocumentAccessGrants = pgTable(
  "supplier_document_access_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => supplierCompanyDocuments.id, { onDelete: "cascade" }),
    issuedTo: uuid("issued_to")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("supplier_document_access_grants_token_hash_idx").on(table.tokenHash),
    index("supplier_document_access_grants_document_user_idx").on(
      table.documentId,
      table.issuedTo,
      table.expiresAt,
    ),
    check(
      "supplier_document_access_grants_token_hash_check",
      sql`char_length(${table.tokenHash}) = 64`,
    ),
    check(
      "supplier_document_access_grants_expiry_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "supplier_document_access_grants_revocation_check",
      sql`${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt}`,
    ),
  ],
);

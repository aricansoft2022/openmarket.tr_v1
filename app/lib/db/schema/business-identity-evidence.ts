import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { businessIdentityReviews } from "./business-identity";

export const businessIdentityEvidenceStatuses = [
  "uploading",
  "stored_private",
  "failed",
  "removed",
] as const;
export type BusinessIdentityEvidenceStatus = (typeof businessIdentityEvidenceStatuses)[number];

export const businessIdentityEvidence = pgTable(
  "business_identity_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => businessIdentityReviews.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sha256: text("sha256"),
    status: text("status").$type<BusinessIdentityEvidenceStatus>().default("uploading").notNull(),
    failureReason: text("failure_reason"),
    storedAt: timestamp("stored_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("business_identity_evidence_object_key_idx").on(table.objectKey),
    index("business_identity_evidence_review_status_idx").on(
      table.reviewId,
      table.status,
      table.createdAt,
    ),
    check(
      "business_identity_evidence_filename_check",
      sql`char_length(trim(${table.originalFilename})) between 1 and 180`,
    ),
    check(
      "business_identity_evidence_object_key_check",
      sql`char_length(${table.objectKey}) between 20 and 700`,
    ),
    check(
      "business_identity_evidence_mime_check",
      sql`${table.mimeType} in ('application/pdf', 'image/jpeg', 'image/png')`,
    ),
    check("business_identity_evidence_size_check", sql`${table.sizeBytes} between 1 and 10485760`),
    check(
      "business_identity_evidence_status_check",
      sql`${table.status} in ('uploading', 'stored_private', 'failed', 'removed')`,
    ),
    check(
      "business_identity_evidence_state_fields_check",
      sql`(${table.status} = 'uploading' and ${table.sha256} is null and ${table.storedAt} is null and ${table.removedAt} is null and ${table.failureReason} is null)
        or (${table.status} = 'stored_private' and char_length(${table.sha256}) = 64 and ${table.storedAt} is not null and ${table.removedAt} is null and ${table.failureReason} is null)
        or (${table.status} = 'failed' and ${table.storedAt} is null and ${table.removedAt} is null and char_length(trim(${table.failureReason})) >= 3)
        or (${table.status} = 'removed' and ${table.removedAt} is not null)`,
    ),
  ],
);

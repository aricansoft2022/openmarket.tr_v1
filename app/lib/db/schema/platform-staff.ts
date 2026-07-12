import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const platformStaffRoles = [
  "super_admin",
  "platform_admin",
  "catalogue_content_editor",
  "compliance_reviewer",
  "product_rfq_moderator",
  "privacy_support_manager",
] as const;
export type PlatformStaffRole = (typeof platformStaffRoles)[number];

export const platformStaffAssignmentStatuses = ["active", "revoked"] as const;
export type PlatformStaffAssignmentStatus = (typeof platformStaffAssignmentStatuses)[number];

export const platformStaffAssignments = pgTable(
  "platform_staff_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").$type<PlatformStaffRole>().notNull(),
    status: text("status").$type<PlatformStaffAssignmentStatus>().default("active").notNull(),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    assignmentReason: text("assignment_reason").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    revokedBy: uuid("revoked_by").references(() => user.id, { onDelete: "set null" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revocationReason: text("revocation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("platform_staff_assignments_user_role_idx").on(table.userId, table.role),
    index("platform_staff_assignments_role_status_idx").on(table.role, table.status, table.userId),
    check(
      "platform_staff_assignments_role_check",
      sql`${table.role} in ('super_admin', 'platform_admin', 'catalogue_content_editor', 'compliance_reviewer', 'product_rfq_moderator', 'privacy_support_manager')`,
    ),
    check(
      "platform_staff_assignments_status_check",
      sql`${table.status} in ('active', 'revoked')`,
    ),
    check(
      "platform_staff_assignments_assignment_reason_check",
      sql`char_length(trim(${table.assignmentReason})) >= 3`,
    ),
    check(
      "platform_staff_assignments_state_fields_check",
      sql`(${table.status} = 'active' and ${table.revokedBy} is null and ${table.revokedAt} is null and ${table.revocationReason} is null)
        or (${table.status} = 'revoked' and ${table.revokedBy} is not null and ${table.revokedAt} is not null and char_length(trim(${table.revocationReason})) >= 3)`,
    ),
  ],
);

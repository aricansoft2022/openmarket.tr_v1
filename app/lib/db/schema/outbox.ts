import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { PreferredLanguage } from "./preferences";
import type { SupplierWorkspaceStatus } from "./supplier";

export const outboxStatuses = ["pending", "processing", "sent", "failed"] as const;
export type OutboxStatus = (typeof outboxStatuses)[number];

export const authEmailTemplates = ["auth.verify-email", "auth.reset-password"] as const;
export type AuthEmailTemplate = (typeof authEmailTemplates)[number];

export type AuthEmailOutboxPayload = {
  recipient: string;
  locale: PreferredLanguage;
  template: AuthEmailTemplate;
  actionUrl: string;
};

export type SupplierActivationOutboxPayload = {
  companyId: string;
  previousStatus: SupplierWorkspaceStatus;
  nextStatus: SupplierWorkspaceStatus;
  blockerCodes: string[];
  recipientUserIds: string[];
};

export type OutboxEventPayload = AuthEmailOutboxPayload | SupplierActivationOutboxPayload;

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<OutboxEventPayload>().notNull(),
    status: text("status").$type<OutboxStatus>().default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    availableAt: timestamp("available_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("outbox_events_dispatch_idx").on(table.status, table.availableAt),
    index("outbox_events_aggregate_idx").on(table.aggregateType, table.aggregateId),
    index("outbox_events_expires_at_idx").on(table.expiresAt),
    check(
      "outbox_events_status_check",
      sql`${table.status} in ('pending', 'processing', 'sent', 'failed')`,
    ),
    check("outbox_events_attempts_check", sql`${table.attempts} >= 0`),
  ],
);

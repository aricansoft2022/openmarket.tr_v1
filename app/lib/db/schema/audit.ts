import { index, inet, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id"),
    effectiveRole: text("effective_role").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    action: text("action").notNull(),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    reason: text("reason"),
    requestId: text("request_id"),
    sessionId: text("session_id"),
    ipAddress: inet("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
    index("audit_logs_actor_idx").on(table.actorId, table.createdAt),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

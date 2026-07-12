import type { Database } from "~/lib/db/client.server";
import { auditLogs } from "~/lib/db/schema";

type AuditValue = Record<string, unknown> | unknown[] | null;

export type WriteAuditInput = {
  actorId?: string;
  effectiveRole: string;
  resourceType: string;
  resourceId: string;
  action: string;
  oldValue?: AuditValue;
  newValue?: AuditValue;
  reason?: string;
  requestId?: string;
  sessionId?: string;
  ipAddress?: string;
};

export async function writeAudit(database: Database, input: WriteAuditInput): Promise<void> {
  await database.insert(auditLogs).values({
    actorId: input.actorId,
    effectiveRole: input.effectiveRole,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    action: input.action,
    oldValue: input.oldValue,
    newValue: input.newValue,
    reason: input.reason,
    requestId: input.requestId,
    sessionId: input.sessionId,
    ipAddress: input.ipAddress,
  });
}

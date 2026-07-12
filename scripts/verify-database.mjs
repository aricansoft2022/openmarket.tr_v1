import assert from "node:assert/strict";

import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for database verification.");
}

const client = new Client({ connectionString });

async function expectImmutable({ label, savepoint, text, values }) {
  await client.query(`SAVEPOINT ${savepoint}`);

  try {
    await client.query(text, values);
    throw new Error(`${label} unexpectedly succeeded.`);
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);

    if (error instanceof Error && error.message === `${label} unexpectedly succeeded.`) {
      throw error;
    }

    assert(
      error instanceof Error,
      `${label} failed with a non-Error value.`,
    );
    assert.match(
      error.message,
      /audit_logs rows are immutable/,
      `${label} must be rejected by the audit immutability trigger.`,
    );
  } finally {
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
  }
}

await client.connect();

try {
  const tableResult = await client.query(
    "select to_regclass('public.audit_logs')::text as table_name",
  );
  assert.equal(
    tableResult.rows[0]?.table_name,
    "audit_logs",
    "The audit_logs table must exist after migrations.",
  );

  const indexResult = await client.query(
    "select indexname from pg_indexes where schemaname = 'public' and tablename = 'audit_logs'",
  );
  const indexNames = new Set(indexResult.rows.map((row) => row.indexname));

  for (const requiredIndex of [
    "audit_logs_resource_idx",
    "audit_logs_actor_idx",
    "audit_logs_created_at_idx",
  ]) {
    assert(
      indexNames.has(requiredIndex),
      `Missing required audit index: ${requiredIndex}`,
    );
  }

  const triggerResult = await client.query(`
    select trigger_name
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'audit_logs'
      and trigger_name = 'audit_logs_immutable'
  `);
  assert.equal(
    triggerResult.rowCount,
    2,
    "The audit immutability trigger must cover both UPDATE and DELETE events.",
  );

  await client.query("BEGIN");

  try {
    const insertResult = await client.query(
      `
        insert into audit_logs (
          effective_role,
          resource_type,
          resource_id,
          action,
          reason,
          request_id
        ) values ($1, $2, $3, $4, $5, $6)
        returning id
      `,
      [
        "database-verifier",
        "system",
        "database-verification",
        "verify",
        "Prove append-only audit behaviour",
        "database-verification",
      ],
    );
    const auditLogId = insertResult.rows[0]?.id;
    assert(auditLogId, "The verification audit row must be inserted.");

    await expectImmutable({
      label: "Audit UPDATE",
      savepoint: "before_audit_update",
      text: "update audit_logs set action = $1 where id = $2",
      values: ["mutated", auditLogId],
    });

    await expectImmutable({
      label: "Audit DELETE",
      savepoint: "before_audit_delete",
      text: "delete from audit_logs where id = $1",
      values: [auditLogId],
    });
  } finally {
    await client.query("ROLLBACK");
  }

  console.log(
    "Database verification passed: migration applied, indexes present, audit UPDATE/DELETE rejected.",
  );
} finally {
  await client.end();
}

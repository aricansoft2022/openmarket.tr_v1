import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = "scripts/verify-supplier-activation.ts";
let source = readFileSync(path, "utf8");

function replaceOnce(search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Activation integration patch target not found:\n${search}`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  `  const now = new Date("2026-07-13T15:00:00.000Z");
  const expiresAt = new Date("2027-07-13T15:00:00.000Z");`,
  `  const now = new Date();
  const issueDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);`,
);
replaceOnce("        issueDate: now,", "        issueDate,");
replaceOnce(
  `.set({ expiresAt: new Date("2026-07-12T15:00:00.000Z"), updatedAt: now })`,
  `.set({ expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), updatedAt: now })`,
);
replaceOnce(
  `  if (createdUserIds.length > 0) {
    await client.query('delete from "user" where id = any($1::uuid[])', [createdUserIds]);
  }`,
  `  if (createdUserIds.length > 0) {
    await database
      .delete(schema.platformStaffAssignments)
      .where(inArray(schema.platformStaffAssignments.userId, createdUserIds));
    await client.query('delete from "user" where id = any($1::uuid[])', [createdUserIds]);
  }`,
);

writeFileSync(path, source);
unlinkSync(fileURLToPath(import.meta.url));

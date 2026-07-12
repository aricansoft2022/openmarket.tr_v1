import { readFile, stat } from "node:fs/promises";

const requiredFiles = [
  "spec.md",
  "STATUS.md",
  "HANDOFF.md",
  "DECISIONS.md",
  "ARCHITECTURE.md",
  "DATA_MODEL.md",
  "SEED_CATALOGUE.md",
  "TEST_PLAN.md",
  "WORKFLOW.md",
];

for (const path of requiredFiles) {
  await stat(path);
}

const spec = await readFile("spec.md", "utf8");
if (!spec.includes("**Status:** Source of truth") || !spec.includes("**Version:** 2.1")) {
  throw new Error("spec.md must remain the version 2.1 source of truth.");
}

const status = await readFile("STATUS.md", "utf8");
for (const heading of ["## Current phase", "## Verification", "## Next tasks"]) {
  if (!status.includes(heading)) {
    throw new Error(`STATUS.md is missing required heading: ${heading}`);
  }
}

const handoff = await readFile("HANDOFF.md", "utf8");
for (const heading of ["## Start here", "## Exact next tasks", "## Known blockers"]) {
  if (!handoff.includes(heading)) {
    throw new Error(`HANDOFF.md is missing required heading: ${heading}`);
  }
}

console.log(`Documentation contract verified (${requiredFiles.length} files).`);

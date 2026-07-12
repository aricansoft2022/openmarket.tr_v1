import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

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
  "RUNTIME_CONFIGURATION.md",
];

for (const path of requiredFiles) {
  await stat(path);
}

const manifest = await readFile("spec.md", "utf8");
if (!manifest.includes("**Status:** Source of truth") || !manifest.includes("**Version:** 2.1")) {
  throw new Error("spec.md must identify the version 2.1 source of truth.");
}

const expectedHash = "c8f1b6f737d413f7857a47dfb9dbae936e6e424de6d76aee5ad077482c435a2c";
const parts = (await readdir(".bootstrap"))
  .filter((name) => name.startsWith("spec.gz.b64.part-"))
  .sort();

if (parts.length !== 3) {
  throw new Error(`Expected 3 specification source parts, found ${parts.length}.`);
}

const encoded = (
  await Promise.all(parts.map((name) => readFile(`.bootstrap/${name}`, "utf8")))
).join("");
const source = gunzipSync(Buffer.from(encoded, "base64"));
const hash = createHash("sha256").update(source).digest("hex");

if (hash !== expectedHash) {
  throw new Error(`Specification hash mismatch: expected ${expectedHash}, received ${hash}.`);
}

const sourceText = source.toString("utf8");
if (!sourceText.includes("## 40. Additional acceptance criteria for screens and support")) {
  throw new Error("Canonical specification is incomplete.");
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

console.log(
  `Documentation contract verified (${requiredFiles.length} files, spec sha256 ${hash}).`,
);

import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

const sourceDirectory = new URL("../.bootstrap/", import.meta.url);
const outputUrl = new URL("../spec.full.md", import.meta.url);
const expectedHash = "c8f1b6f737d413f7857a47dfb9dbae936e6e424de6d76aee5ad077482c435a2c";

const parts = (await readdir(sourceDirectory))
  .filter((name) => name.startsWith("spec.gz.b64.part-"))
  .sort();

if (parts.length !== 3) {
  throw new Error(`Expected 3 specification source parts, found ${parts.length}.`);
}

const encoded = (
  await Promise.all(parts.map((name) => readFile(new URL(name, sourceDirectory), "utf8")))
).join("");
const source = gunzipSync(Buffer.from(encoded, "base64"));
const hash = createHash("sha256").update(source).digest("hex");

if (hash !== expectedHash) {
  throw new Error(`Specification hash mismatch: expected ${expectedHash}, received ${hash}.`);
}

if (process.argv.includes("--stdout")) {
  process.stdout.write(source);
} else {
  await writeFile(outputUrl, source);
  console.log(`Materialized spec.full.md (${source.length} bytes, sha256 ${hash}).`);
}

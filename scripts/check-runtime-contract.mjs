import { readFile } from "node:fs/promises";

function parseJsonc(source) {
  return JSON.parse(
    source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/,\s*([}\]])/g, "$1"),
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const [contractSource, wranglerSource, typeDeclarations, devVarsExample, gitignore] =
  await Promise.all([
    readFile("config/runtime-contract.json", "utf8"),
    readFile("wrangler.jsonc", "utf8"),
    readFile("app/types/cloudflare.d.ts", "utf8"),
    readFile(".dev.vars.example", "utf8"),
    readFile(".gitignore", "utf8"),
  ]);

const contract = JSON.parse(contractSource);
const wrangler = parseJsonc(wranglerSource);
const entries = [
  ...contract.variables,
  ...contract.secrets,
  ...contract.bindings,
];
const names = entries.map((entry) => entry.name);
const duplicateNames = names.filter(
  (name, index) => names.indexOf(name) !== index,
);

assert(contract.version === 1, "Runtime contract version must be 1.");
assert(
  JSON.stringify(contract.environments) ===
    JSON.stringify(["local", "preview", "production"]),
  "Runtime environments must remain local, preview and production.",
);
assert(duplicateNames.length === 0, `Duplicate runtime names: ${duplicateNames}`);

for (const entry of entries.filter(
  (runtimeEntry) => runtimeEntry.source !== "wrangler-vars",
)) {
  assert(
    typeDeclarations.includes(`${entry.name}:`),
    `app/types/cloudflare.d.ts is missing ${entry.name}.`,
  );
}

for (const entry of [...contract.variables, ...contract.secrets]) {
  if (entry.source === "wrangler-vars") {
    assert(
      Object.hasOwn(wrangler.vars ?? {}, entry.name),
      `wrangler.jsonc vars is missing ${entry.name}.`,
    );
    continue;
  }

  assert(
    new RegExp(`^${entry.name}=`, "m").test(devVarsExample),
    `.dev.vars.example is missing ${entry.name}.`,
  );
}

for (const secret of contract.secrets) {
  assert(
    !Object.hasOwn(wrangler.vars ?? {}, secret.name),
    `${secret.name} must not be stored in wrangler vars.`,
  );
}

for (const binding of contract.bindings.filter(
  (entry) => entry.status === "local-configured",
)) {
  if (binding.kind === "r2-bucket") {
    assert(
      (wrangler.r2_buckets ?? []).some(
        (entry) => entry.binding === binding.name,
      ),
      `wrangler.jsonc is missing R2 binding ${binding.name}.`,
    );
  }

  if (binding.kind === "queue") {
    assert(
      (wrangler.queues?.producers ?? []).some(
        (entry) => entry.binding === binding.name,
      ),
      `wrangler.jsonc is missing Queue binding ${binding.name}.`,
    );
  }
}

for (const requiredIgnore of [
  ".dev.vars",
  ".dev.vars.*",
  "!.dev.vars.example",
  ".env",
  ".env.*",
  "!.env.example",
]) {
  assert(
    gitignore.split("\n").includes(requiredIgnore),
    `.gitignore is missing ${requiredIgnore}.`,
  );
}

const pending = entries
  .filter((entry) => entry.status === "external-pending")
  .map((entry) => entry.name)
  .sort();

console.log(
  `Runtime contract verified (${entries.length} entries; external pending: ${pending.join(", ")}).`,
);

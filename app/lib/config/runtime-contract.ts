import contract from "../../../config/runtime-contract.json";

type ContractEntry = {
  name: string;
  capability: string;
};

type CoreRuntimeEnv = {
  APP_ENV: unknown;
  COMMIT_SHA: unknown;
};

export type CapabilityReadiness = {
  ready: boolean;
  missing: string[];
};

export type RuntimeReadinessReport = {
  ready: boolean;
  capabilities: Record<string, CapabilityReadiness>;
  missing: string[];
};

export type CoreRuntimeConfig = {
  environment: string;
  commitSha: string;
};

const placeholderPattern = /^(?:change-?me|example|pending|replace|todo)(?:[-_\s]|$)/i;
const contractEntries: ContractEntry[] = [
  ...contract.variables,
  ...contract.secrets,
  ...contract.bindings,
];

export class RuntimeConfigurationError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Runtime configuration is incomplete: ${missing.join(", ")}`);
    this.name = "RuntimeConfigurationError";
    this.missing = missing;
  }
}

export function isConfiguredRuntimeValue(value: unknown): boolean {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 && !placeholderPattern.test(normalized);
  }

  return value !== undefined && value !== null;
}

export function inspectRuntimeReadiness(env: Record<string, unknown>): RuntimeReadinessReport {
  const requirements = new Map<string, string[]>();

  for (const entry of contractEntries) {
    const names = requirements.get(entry.capability) ?? [];
    names.push(entry.name);
    requirements.set(entry.capability, names);
  }

  const capabilities: Record<string, CapabilityReadiness> = {};
  const missing = new Set<string>();

  for (const [capability, names] of requirements) {
    const capabilityMissing = names.filter((name) => !isConfiguredRuntimeValue(env[name]));

    capabilities[capability] = {
      ready: capabilityMissing.length === 0,
      missing: capabilityMissing,
    };

    for (const name of capabilityMissing) {
      missing.add(name);
    }
  }

  return {
    ready: missing.size === 0,
    capabilities,
    missing: [...missing].sort(),
  };
}

export function assertCoreRuntimeConfig(env: CoreRuntimeEnv): CoreRuntimeConfig {
  const missing: string[] = [];

  if (typeof env.APP_ENV !== "string" || !contract.environments.includes(env.APP_ENV)) {
    missing.push("APP_ENV");
  }

  if (!isConfiguredRuntimeValue(env.COMMIT_SHA)) {
    missing.push("COMMIT_SHA");
  }

  if (missing.length > 0) {
    throw new RuntimeConfigurationError(missing);
  }

  return {
    environment: env.APP_ENV as string,
    commitSha: (env.COMMIT_SHA as string).trim(),
  };
}

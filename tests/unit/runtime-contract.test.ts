import { describe, expect, it } from "vitest";

import {
  assertCoreRuntimeConfig,
  inspectRuntimeReadiness,
  isConfiguredRuntimeValue,
  RuntimeConfigurationError,
} from "../../app/lib/config/runtime-contract";

const completeRuntime = {
  APP_ENV: "preview",
  COMMIT_SHA: "abc123",
  HYPERDRIVE: {},
  PRIVATE_DOCUMENTS: {},
  BACKGROUND_JOBS: {},
  BETTER_AUTH_URL: "https://preview.openmarket.tr",
  BETTER_AUTH_SECRET: "a-secure-runtime-value",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  CLOUDFLARE_ACCOUNT_ID: "cloudflare-account-id",
  CLOUDFLARE_IMAGES_TOKEN: "cloudflare-images-token",
};

describe("runtime configuration contract", () => {
  it("reports every configured capability without exposing values", () => {
    const report = inspectRuntimeReadiness(completeRuntime);

    expect(report.ready).toBe(true);
    expect(report.missing).toEqual([]);
    expect(report.capabilities.database).toEqual({ ready: true, missing: [] });
    expect(JSON.stringify(report)).not.toContain("a-secure-runtime-value");
  });

  it("treats absent and placeholder values as missing", () => {
    const report = inspectRuntimeReadiness({
      APP_ENV: "local",
      COMMIT_SHA: "pending-value",
      PRIVATE_DOCUMENTS: {},
      BACKGROUND_JOBS: {},
    });

    expect(report.ready).toBe(false);
    expect(report.missing).toContain("COMMIT_SHA");
    expect(report.missing).toContain("HYPERDRIVE");
    expect(report.capabilities["private-documents"]).toEqual({
      ready: true,
      missing: [],
    });
  });

  it("validates the core liveness configuration", () => {
    expect(
      assertCoreRuntimeConfig({ APP_ENV: "production", COMMIT_SHA: "def456" }),
    ).toEqual({
      environment: "production",
      commitSha: "def456",
    });

    expect(() =>
      assertCoreRuntimeConfig({ APP_ENV: "staging", COMMIT_SHA: "" }),
    ).toThrow(RuntimeConfigurationError);
  });

  it("recognizes objects and rejects common placeholder strings", () => {
    expect(isConfiguredRuntimeValue({})).toBe(true);
    expect(isConfiguredRuntimeValue("replace-with-secret")).toBe(false);
    expect(isConfiguredRuntimeValue("change-me")).toBe(false);
    expect(isConfiguredRuntimeValue("real-value")).toBe(true);
  });
});

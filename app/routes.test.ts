import { describe, expect, it } from "vitest";

import routes from "./routes";

describe("route configuration", () => {
  it("registers the private business-identity evidence screen and download endpoint", () => {
    const configuredRoutes = JSON.stringify(routes);

    expect(configuredRoutes).toContain('"path":"onboarding/business-identity/evidence"');
    expect(configuredRoutes).toContain('"file":"routes/onboarding.business-identity-evidence.tsx"');
    expect(configuredRoutes).toContain(
      '"path":"onboarding/business-identity/evidence/:evidenceId/download"',
    );
    expect(configuredRoutes).toContain(
      '"file":"routes/onboarding.business-identity-evidence-download.ts"',
    );
  });
});

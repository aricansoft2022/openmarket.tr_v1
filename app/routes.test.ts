import { describe, expect, it } from "vitest";

import routes from "./routes";

describe("route configuration", () => {
  it("registers private applicant and permissioned staff evidence routes", () => {
    const configuredRoutes = JSON.stringify(routes);

    expect(configuredRoutes).toContain('"path":"onboarding/business-identity/evidence"');
    expect(configuredRoutes).toContain('"file":"routes/onboarding.business-identity-evidence.tsx"');
    expect(configuredRoutes).toContain(
      '"path":"onboarding/business-identity/evidence/:evidenceId/download"',
    );
    expect(configuredRoutes).toContain(
      '"file":"routes/onboarding.business-identity-evidence-download.ts"',
    );
    expect(configuredRoutes).toContain('"path":"admin/business-identity/reviews"');
    expect(configuredRoutes).toContain('"file":"routes/admin.business-identity-reviews.tsx"');
    expect(configuredRoutes).toContain('"path":"admin/business-identity/reviews/:reviewId"');
    expect(configuredRoutes).toContain(
      '"path":"admin/business-identity/reviews/:reviewId/evidence/:evidenceId/download"',
    );
  });
});

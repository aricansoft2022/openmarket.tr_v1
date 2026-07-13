import { describe, expect, it } from "vitest";

import routes from "./routes";

describe("route configuration", () => {
  it("registers private applicant and permissioned staff routes", () => {
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
    expect(configuredRoutes).toContain('"path":"admin/staff"');
    expect(configuredRoutes).toContain('"file":"routes/admin.staff.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/onboarding"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.onboarding.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/company"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.company.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/capabilities"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.capabilities.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/documents"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.documents.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/documents/upload"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.documents.upload.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/documents/:documentId"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.documents.$documentId.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/document-access/:token"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.document-access.$token.ts"');
    expect(configuredRoutes).toContain('"path":"admin/supplier-documents"');
    expect(configuredRoutes).toContain('"file":"routes/admin.supplier-documents.tsx"');
    expect(configuredRoutes).toContain('"path":"admin/supplier-documents/:documentId"');
    expect(configuredRoutes).toContain('"file":"routes/admin.supplier-documents.$documentId.tsx"');
  });
});

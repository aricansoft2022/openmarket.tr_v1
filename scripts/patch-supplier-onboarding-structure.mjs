import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function patch(path, edits) {
  let source = readFileSync(path, "utf8");
  for (const [search, replacement] of edits) {
    if (!source.includes(search)) {
      throw new Error(`Patch target not found in ${path}:\n${search}`);
    }
    source = source.replace(search, replacement);
  }
  writeFileSync(path, source);
}

patch("app/lib/business-identity/onboarding.server.ts", [
  [
    '  type IntendedUse,\n} from "../db/schema";',
    '  type IntendedUse,\n  type PreferredLanguage,\n} from "../db/schema";',
  ],
  [
    "  intendedUse: IntendedUse;\n  buyerStatus: BuyerProfileStatus | null;",
    "  intendedUse: IntendedUse;\n  preferredLanguage: PreferredLanguage;\n  buyerStatus: BuyerProfileStatus | null;",
  ],
  [
    ".select({ intendedUse: userPreferences.intendedUse })",
    ".select({\n      intendedUse: userPreferences.intendedUse,\n      preferredLanguage: userPreferences.preferredLanguage,\n    })",
  ],
  [
    '    intendedUse: preferences?.intendedUse ?? "both",\n    buyerStatus:',
    '    intendedUse: preferences?.intendedUse ?? "both",\n    preferredLanguage: preferences?.preferredLanguage ?? "tr",\n    buyerStatus:',
  ],
]);

patch("app/lib/supplier/onboarding.server.ts", [
  [
    'import type { AuthEnvironment } from "../auth/create-auth.server";',
    'import type { AuthEnvironment } from "../auth/create-auth.server";\nimport type { PreferredLanguage } from "../db/schema";',
  ],
  [
    '  intendedUse: "buyer" | "supplier" | "both";\n  hasSupplierIntent:',
    '  intendedUse: "buyer" | "supplier" | "both";\n  preferredLanguage: PreferredLanguage;\n  hasSupplierIntent:',
  ],
  [
    "    intendedUse: onboarding.intendedUse,\n    hasSupplierIntent,",
    "    intendedUse: onboarding.intendedUse,\n    preferredLanguage: onboarding.preferredLanguage,\n    hasSupplierIntent,",
  ],
]);

patch("app/root.tsx", [
  [
    'import "./styles/staff-review.css";',
    'import "./styles/staff-review.css";\nimport "./styles/supplier.css";',
  ],
]);

patch("app/routes.ts", [
  [
    '  route("admin/staff", "routes/admin.staff.tsx"),',
    '  route("admin/staff", "routes/admin.staff.tsx"),\n  route("supplier", "routes/supplier.tsx"),\n  route("supplier/onboarding", "routes/supplier.onboarding.tsx"),\n  route("supplier/company", "routes/supplier.company.tsx"),\n  route("supplier/capabilities", "routes/supplier.capabilities.tsx"),',
  ],
]);

patch("app/routes.test.ts", [
  [
    '    expect(configuredRoutes).toContain(\'"file":"routes/admin.staff.tsx"\');\n',
    '    expect(configuredRoutes).toContain(\'"file":"routes/admin.staff.tsx"\');\n    expect(configuredRoutes).toContain(\'"path":"supplier"\');\n    expect(configuredRoutes).toContain(\'"file":"routes/supplier.tsx"\');\n    expect(configuredRoutes).toContain(\'"path":"supplier/onboarding"\');\n    expect(configuredRoutes).toContain(\'"file":"routes/supplier.onboarding.tsx"\');\n    expect(configuredRoutes).toContain(\'"path":"supplier/company"\');\n    expect(configuredRoutes).toContain(\'"file":"routes/supplier.company.tsx"\');\n    expect(configuredRoutes).toContain(\'"path":"supplier/capabilities"\');\n    expect(configuredRoutes).toContain(\'"file":"routes/supplier.capabilities.tsx"\');\n',
  ],
]);

patch("app/styles/supplier.css", [
  ["var(--color-paper-soft)", "var(--color-paper-alt)"],
  ["var(--color-paper-soft)", "var(--color-paper-alt)"],
  ["var(--color-danger)", "var(--color-clay-dark)"],
  ["var(--color-danger)", "var(--color-clay-dark)"],
]);

patch("app/routes/supplier.tsx", [
  [
    "    businessIdentityVerified: loaderData.businessIdentityVerified,\n    company:",
    "    language: loaderData.preferredLanguage,\n    businessIdentityVerified: loaderData.businessIdentityVerified,\n    company:",
  ],
  [
    '      current="S01"\n      companyName=',
    '      current="S01"\n      language={loaderData.preferredLanguage}\n      companyName=',
  ],
]);

patch("app/routes/supplier.onboarding.tsx", [
  [
    "    businessIdentityVerified: loaderData.businessIdentityVerified,\n    company:",
    "    language: loaderData.preferredLanguage,\n    businessIdentityVerified: loaderData.businessIdentityVerified,\n    company:",
  ],
  [
    '      current="S02"\n      companyName=',
    '      current="S02"\n      language={loaderData.preferredLanguage}\n      companyName=',
  ],
]);

patch("app/routes/supplier.company.tsx", [
  [
    "    const errors = supplierFormErrors(error);",
    "    const errors = supplierFormErrors(error, context.preferredLanguage);",
  ],
  [
    '      current="S03"\n      companyName=',
    '      current="S03"\n      language={loaderData.preferredLanguage}\n      companyName=',
  ],
]);

patch("app/routes/supplier.capabilities.tsx", [
  [
    "    const errors = supplierFormErrors(error);",
    "    const errors = supplierFormErrors(error, context.preferredLanguage);",
  ],
  [
    '      current="S04"\n      companyName=',
    '      current="S04"\n      language={loaderData.preferredLanguage}\n      companyName=',
  ],
]);

unlinkSync(fileURLToPath(import.meta.url));

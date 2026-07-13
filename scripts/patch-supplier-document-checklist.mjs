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

patch("app/lib/supplier/copy.ts", [
  [
    `      documents: {
        label: "Şirket belgelerini yükle",
        description:
          "Şirket belgesi modülü ayrı bir güvenli yükleme ve inceleme diliminde etkinleştirilecek.",
      },`,
    `      documents: {
        label: "Şirket belgelerini yükle",
        complete: "Tüm zorunlu şirket belgeleri onaylandı.",
        incomplete: "Eksik, bekleyen, reddedilen veya süresi dolan zorunlu belgeleri tamamlayın.",
      },`,
  ],
  [
    `      documents: {
        label: "Upload company documents",
        description:
          "The company-document module will be enabled in a separate secure upload and review slice.",
      },`,
    `      documents: {
        label: "Upload company documents",
        complete: "All mandatory company documents are approved.",
        incomplete: "Complete mandatory documents that are missing, pending, rejected or expired.",
      },`,
  ],
]);

patch("app/lib/supplier/onboarding.ts", [
  [
    `  company: SupplierCompanyState | null;
}): SupplierChecklistItem[] {`,
    `  company: SupplierCompanyState | null;
  documentRequirements?: { available: boolean; complete: boolean };
}): SupplierChecklistItem[] {`,
  ],
  [
    `    {
      id: "documents",
      label: copy.documents.label,
      description: copy.documents.description,
      complete: false,
      blocked: true,
      href: null,
    },`,
    `    {
      id: "documents",
      label: copy.documents.label,
      description: input.documentRequirements?.complete
        ? copy.documents.complete
        : copy.documents.incomplete,
      complete: input.documentRequirements?.complete ?? false,
      blocked: !hasCompany || !(input.documentRequirements?.available ?? false),
      href: hasCompany && input.documentRequirements?.available ? "/supplier/documents" : null,
    },`,
  ],
]);

for (const path of ["app/routes/supplier.tsx", "app/routes/supplier.onboarding.tsx"]) {
  patch(path, [
    [
      `import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";`,
      `import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";
import { loadSupplierDocumentWorkspace } from "~/lib/supplier/documents/service.server";`,
    ],
    [
      `  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  return context;`,
      `  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  const documentWorkspace = context.company
    ? await loadSupplierDocumentWorkspace(env, request, context.company.company.id)
    : null;
  const mandatoryDocuments =
    documentWorkspace?.requirements.filter((requirement) => requirement.level === "mandatory") ?? [];
  return {
    ...context,
    documentRequirements: {
      available: Boolean(documentWorkspace),
      complete:
        mandatoryDocuments.length > 0 && mandatoryDocuments.every((requirement) => requirement.satisfied),
    },
  };`,
    ],
    [
      `    company: loaderData.company,
  });`,
      `    company: loaderData.company,
    documentRequirements: loaderData.documentRequirements,
  });`,
    ],
  ]);
}

patch("app/lib/supplier/onboarding.test.ts", [
  [
    `  it("keeps company documents as an explicit undelivered activation blocker", () => {
    const checklist = buildSupplierOnboardingChecklist({
      businessIdentityVerified: true,
      company: completeCompany,
    });

    expect(checklist.find((item) => item.id === "documents")).toMatchObject({
      complete: false,
      blocked: true,
      href: null,
    });
    expect(supplierChecklistProgress(checklist)).toEqual({
      complete: 3,
      total: 4,
      percent: 75,
    });
  });`,
    `  it("links company documents without activating Supplier and reflects mandatory approval", () => {
    const incomplete = buildSupplierOnboardingChecklist({
      businessIdentityVerified: true,
      company: completeCompany,
      documentRequirements: { available: true, complete: false },
    });
    expect(incomplete.find((item) => item.id === "documents")).toMatchObject({
      complete: false,
      blocked: false,
      href: "/supplier/documents",
    });
    expect(supplierChecklistProgress(incomplete)).toEqual({
      complete: 3,
      total: 4,
      percent: 75,
    });

    const complete = buildSupplierOnboardingChecklist({
      businessIdentityVerified: true,
      company: completeCompany,
      documentRequirements: { available: true, complete: true },
    });
    expect(complete.find((item) => item.id === "documents")).toMatchObject({
      complete: true,
      blocked: false,
      href: "/supplier/documents",
    });
    expect(supplierChecklistProgress(complete)).toEqual({
      complete: 4,
      total: 4,
      percent: 100,
    });
  });`,
  ],
]);

patch("scripts/verify-supplier-document-lifecycle.ts", [
  [
    `import type { Database } from "../app/lib/db/client.server";
`,
    "",
  ],
  [
    `import { and, eq, inArray } from "drizzle-orm";`,
    `import { eq, inArray } from "drizzle-orm";`,
  ],
  [
    `  await database.transaction(async (transaction) => {
    await recordSupplierDocumentScanResult(transaction as unknown as Database, {
      documentId: uploaded.id,
      result: "clean",
    });
  });`,
    `  await recordSupplierDocumentScanResult(database, {
    documentId: uploaded.id,
    result: "clean",
  });`,
  ],
  [
    `  await database.transaction(async (transaction) => {
    await recordSupplierDocumentScanResult(transaction as unknown as Database, {
      documentId: profileDocument.id,
      result: "clean",
    });
  });`,
    `  await recordSupplierDocumentScanResult(database, {
    documentId: profileDocument.id,
    result: "clean",
  });`,
  ],
]);

patch("app/lib/supplier/documents/service.server.ts", [
  [
    `      "X-Content-Type-Options": "nosniff",`,
    `      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",`,
  ],
]);

unlinkSync(fileURLToPath(import.meta.url));

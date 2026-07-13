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

patch("app/lib/supplier/profile.server.ts", [
  [
    `import {\n  evaluateSupplierProfileCompleteness,`,
    `import { reconcileSupplierActivationWithinTransaction } from "./activation.server";\nimport {\n  evaluateSupplierProfileCompleteness,`,
  ],
  [
    `      await replaceProfileSelections(scoped, company!.id, profile);\n\n      const createdState`,
    `      await replaceProfileSelections(scoped, company!.id, profile);\n      await reconcileSupplierActivationWithinTransaction(scoped, company!.id, {\n        actorId: session.user.id,\n        effectiveRole: "supplier_owner",\n        reason: "Supplier company creation changed activation prerequisites",\n        requestId: requestId(request),\n        now,\n      });\n\n      const createdState`,
  ],
  [
    `      await replaceProfileSelections(scoped, companyId, profile);\n\n      const updatedState`,
    `      await replaceProfileSelections(scoped, companyId, profile);\n      await reconcileSupplierActivationWithinTransaction(scoped, companyId, {\n        actorId: session.user.id,\n        effectiveRole: \`supplier_\${membership.role}\`,\n        reason: "Supplier profile change triggered activation reevaluation",\n        requestId: requestId(request),\n      });\n\n      const updatedState`,
  ],
]);

patch("app/lib/supplier/documents/service.server.ts", [
  [
    `import { launchSupplierTypeKeys, type LaunchSupplierTypeKey } from "../catalogue";`,
    `import { reconcileSupplierActivationWithinTransaction } from "../activation.server";\nimport { launchSupplierTypeKeys, type LaunchSupplierTypeKey } from "../catalogue";`,
  ],
  [
    `        requestId: requestId(request),\n      });\n      return documentProjection(stored!);`,
    `        requestId: requestId(request),\n      });\n      await reconcileSupplierActivationWithinTransaction(scoped, input.companyId, {\n        actorId: session.user.id,\n        effectiveRole: \`supplier_\${membership.role}\`,\n        reason: "Private document upload changed activation evidence",\n        requestId: requestId(request),\n      });\n      return documentProjection(stored!);`,
  ],
  [
    `      reason: note ?? "Automated document scan completed",\n    });\n  });`,
    `      reason: note ?? "Automated document scan completed",\n    });\n    const [documentCompany] = await scoped\n      .select({ companyId: supplierCompanyDocuments.companyId })\n      .from(supplierCompanyDocuments)\n      .where(eq(supplierCompanyDocuments.id, input.documentId))\n      .limit(1);\n    if (documentCompany) {\n      await reconcileSupplierActivationWithinTransaction(scoped, documentCompany.companyId, {\n        actorId: null,\n        effectiveRole: "document_scanner",\n        reason: "Document scan result changed activation evidence",\n        now,\n      });\n    }\n  });`,
  ],
  [
    `        requestId: requestId(request),\n      });\n    }),\n  );\n}\n\nexport async function decideSupplierCompanyDocument`,
    `        requestId: requestId(request),\n      });\n      await reconcileSupplierActivationWithinTransaction(scoped, document.companyId, {\n        actorId: session.user.id,\n        effectiveRole: \`supplier_\${membership.role}\`,\n        reason: "Document submission changed activation evidence",\n        requestId: requestId(request),\n        now,\n      });\n    }),\n  );\n}\n\nexport async function decideSupplierCompanyDocument`,
  ],
  [
    `        requestId: requestId(request),\n      });\n    }),\n  );\n}\n\nexport async function setSupplierDocumentPublicVisibility`,
    `        requestId: requestId(request),\n      });\n      await reconcileSupplierActivationWithinTransaction(scoped, document.companyId, {\n        actorId: session.user.id,\n        effectiveRole: actorRole,\n        reason: "Document review decision changed activation evidence",\n        requestId: requestId(request),\n        now,\n      });\n    }),\n  );\n}\n\nexport async function setSupplierDocumentPublicVisibility`,
  ],
]);

unlinkSync(fileURLToPath(import.meta.url));

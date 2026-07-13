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

patch("app/lib/supplier/documents/catalogue.ts", [
  [
    `const baseMandatoryDocumentKeys = [
  "company_document.chamber_activity",
  "company_document.trade_registry",
  "company_document.tax_company_registration",
  "company_document.authorized_representative",
  "company_document.company_address",
  "company_document.company_profile",
] as const satisfies readonly SupplierCompanyDocumentTypeKey[];`,
    `// The specification enumerates document types but does not label every seeded
// value as mandatory. This reviewed launch decision keeps only core legal and
// representation evidence mandatory for every Supplier. A company-profile PDF
// remains optional because the structured S03 profile is already required.
const baseMandatoryDocumentKeys = [
  "company_document.chamber_activity",
  "company_document.trade_registry",
  "company_document.tax_company_registration",
  "company_document.authorized_representative",
  "company_document.company_address",
] as const satisfies readonly SupplierCompanyDocumentTypeKey[];`,
  ],
  [
    `    level: "mandatory",
    noteTr: "Üretici-ihracatçı türü için ihracatçı bilgisini destekler.",
    noteEn: "Supports exporter information for the Manufacturer-exporter type.",`,
    `    level: "conditional",
    noteTr: "İhracatçı bilgisi mevcut veya uygulanabilir olduğu durumda istenir.",
    noteEn: "Requested when exporter information exists or is applicable.",`,
  ],
  [
    `    level: "mandatory",
    noteTr: "İhracatçı veya dış ticaret şirketi türü için zorunludur.",
    noteEn: "Mandatory for the Exporter or trading company type.",`,
    `    level: "conditional",
    noteTr: "İhracatçı bilgisi mevcut veya uygulanabilir olduğu durumda istenir.",
    noteEn: "Requested when exporter information exists or is applicable.",`,
  ],
  [
    `  {
    key: "company_document_rule.optional.quality_management",`,
    `  {
    key: "company_document_rule.optional.company_profile",
    documentTypeKey: "company_document.company_profile",
    supplierTypeKey: null,
    level: "optional",
    noteTr: "Yapılandırılmış şirket profiline ek tanıtım dosyası olarak yüklenebilir.",
    noteEn: "May be uploaded as supporting material for the structured company profile.",
    sortOrder: 99,
  },
  {
    key: "company_document_rule.optional.quality_management",`,
  ],
]);

patch("app/lib/supplier/documents/policy.ts", [
  [`      | "EXPIRY_REQUIRED"\n`, ""],
  [
    `  if (type.expiryExpected && !expiresAt) {
    throw new SupplierDocumentValidationError(
      "EXPIRY_REQUIRED",
      "Bu belge türü için son geçerlilik tarihi gereklidir.",
    );
  }
`,
    "",
  ],
  [
    `  if (!input.storageStatus || input.storageStatus === "failed" || input.storageStatus === "removed") {
    return "missing";
  }
  if (input.expiresAt && input.expiresAt <= (input.now ?? new Date())) return "expired";
  if (input.scanStatus === "rejected" || input.scanStatus === "failed") return "replacement_required";
  return input.evidenceStatus ?? "uploaded";`,
    `  if (!input.storageStatus || input.storageStatus === "failed" || input.storageStatus === "removed") {
    return "missing";
  }
  if (input.scanStatus === "rejected") return "replacement_required";

  const state = input.evidenceStatus ?? "uploaded";
  if (
    state === "approved" &&
    input.expiresAt &&
    input.expiresAt <= (input.now ?? new Date())
  ) {
    return "expired";
  }
  return state;`,
  ],
]);

patch("app/lib/supplier/documents/policy.test.ts", [
  [
    `      "company_document.company_address",
      "company_document.company_profile",`,
    `      "company_document.company_address",`,
  ],
  [
    `    expect(keys).toContain("company_document.exporter_information");`,
    `    expect(keys).toContain("company_document.exporter_information");
    expect(
      requirements.find(
        (requirement) => requirement.documentTypeKey === "company_document.exporter_information",
      )?.level,
    ).toBe("conditional");`,
  ],
  [
    `  it("requires expiry metadata only for expiry-expected document types", () => {
    expect(() =>
      validateSupplierDocumentMetadata({
        documentTypeKey: "company_document.chamber_activity",
      }),
    ).toThrow(SupplierDocumentValidationError);

    expect(
      validateSupplierDocumentMetadata({
        documentTypeKey: "company_document.company_profile",
      }),
    ).toEqual({
      documentTypeKey: "company_document.company_profile",
      issueDate: null,
      expiresAt: null,
    });
  });`,
    `  it("keeps expiry metadata optional while validating supplied date order", () => {
    expect(
      validateSupplierDocumentMetadata({
        documentTypeKey: "company_document.chamber_activity",
      }),
    ).toEqual({
      documentTypeKey: "company_document.chamber_activity",
      issueDate: null,
      expiresAt: null,
    });

    expect(() =>
      validateSupplierDocumentMetadata({
        documentTypeKey: "company_document.chamber_activity",
        issueDate: new Date("2026-07-13T00:00:00.000Z"),
        expiresAt: new Date("2026-07-12T00:00:00.000Z"),
      }),
    ).toThrow(SupplierDocumentValidationError);
  });`,
  ],
  [
    `    expect(
      deriveSupplierDocumentState({
        storageStatus: "stored_private",
        evidenceStatus: "uploaded",
        scanStatus: "rejected",
        now,
      }),
    ).toBe("replacement_required");`,
    `    expect(
      deriveSupplierDocumentState({
        storageStatus: "stored_private",
        evidenceStatus: "uploaded",
        scanStatus: "rejected",
        now,
      }),
    ).toBe("replacement_required");
    expect(
      deriveSupplierDocumentState({
        storageStatus: "stored_private",
        evidenceStatus: "uploaded",
        scanStatus: "failed",
        now,
      }),
    ).toBe("uploaded");`,
  ],
]);

unlinkSync(fileURLToPath(import.meta.url));

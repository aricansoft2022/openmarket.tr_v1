import { readFileSync, writeFileSync } from "node:fs";

function edit(path, transform) {
  const source = readFileSync(path, "utf8");
  const result = transform(source);
  if (result === source) throw new Error(`No change was applied to ${path}`);
  writeFileSync(path, result);
}

edit("app/lib/supplier/documents/catalogue.ts", (source) => {
  let result = source.replace(
    /const baseMandatoryDocumentKeys = \[[\s\S]*?\] as const satisfies readonly SupplierCompanyDocumentTypeKey\[\];/,
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
  );
  result = result.replace(
    /(key: "company_document_rule\.exporter\.manufacturer_exporter",[\s\S]*?supplierTypeKey: "supplier_type\.manufacturer_exporter",[\s\S]*?)level: "mandatory",[\s\S]*?noteEn: "Supports exporter information for the Manufacturer-exporter type\.",/,
    `$1level: "conditional",
    noteTr: "İhracatçı bilgisi mevcut veya uygulanabilir olduğu durumda istenir.",
    noteEn: "Requested when exporter information exists or is applicable.",`,
  );
  result = result.replace(
    /(key: "company_document_rule\.exporter\.trading_company",[\s\S]*?supplierTypeKey: "supplier_type\.exporter_trading_company",[\s\S]*?)level: "mandatory",[\s\S]*?noteEn: "Mandatory for the Exporter or trading company type\.",/,
    `$1level: "conditional",
    noteTr: "İhracatçı bilgisi mevcut veya uygulanabilir olduğu durumda istenir.",
    noteEn: "Requested when exporter information exists or is applicable.",`,
  );
  result = result.replace(
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
  );
  return result;
});

edit("app/lib/supplier/documents/policy.ts", (source) => {
  let result = source.replace(`      | "EXPIRY_REQUIRED"\n`, "");
  result = result.replace(
    /  if \(type\.expiryExpected && !expiresAt\) \{[\s\S]*?\n  \}\n  if \(issueDate && expiresAt/,
    `  if (issueDate && expiresAt`,
  );
  result = result.replace(
    /  if \(\n    !input\.storageStatus \|\|[\s\S]*?  return input\.evidenceStatus \?\? "uploaded";/,
    `  if (
    !input.storageStatus ||
    input.storageStatus === "failed" ||
    input.storageStatus === "removed"
  ) {
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
  );
  return result;
});

edit("app/lib/supplier/documents/policy.test.ts", (source) => {
  let result = source.replace(`      "company_document.company_profile",\n`, "");
  result = result.replace(
    `    expect(keys).toContain("company_document.exporter_information");`,
    `    expect(keys).toContain("company_document.exporter_information");
    expect(
      requirements.find(
        (requirement) => requirement.documentTypeKey === "company_document.exporter_information",
      )?.level,
    ).toBe("conditional");`,
  );
  result = result.replace(
    /  it\("requires expiry metadata only for expiry-expected document types", \(\) => \{[\s\S]*?\n  \}\);/,
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
  );
  result = result.replace(
    `    ).toBe("replacement_required");
  });`,
    `    ).toBe("replacement_required");
    expect(
      deriveSupplierDocumentState({
        storageStatus: "stored_private",
        evidenceStatus: "uploaded",
        scanStatus: "failed",
        now,
      }),
    ).toBe("uploaded");
  });`,
  );
  return result;
});

edit("app/lib/db/schema/supplier-documents.ts", (source) => {
  let result = source.replace(`    reason: text("reason").notNull(),`, `    reason: text("reason"),`);
  result = result.replace(
    /    check\(\n      "supplier_document_review_events_reason_check",\n      sql`char_length\(trim\(\$\{table\.reason\}\)\) between 3 and 2000`,\n    \),/,
    `    check(
      "supplier_document_review_events_reason_check",
      sql\`(\${table.decision} = 'approved' and (\${table.reason} is null or char_length(trim(\${table.reason})) between 3 and 2000))
        or (\${table.decision} in ('rejected', 'replacement_required') and char_length(trim(\${table.reason})) between 3 and 2000)\`,
    ),`,
  );
  return result;
});

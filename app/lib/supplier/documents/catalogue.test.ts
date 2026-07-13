import { describe, expect, it } from "vitest";

import {
  supplierCompanyDocumentTypes,
  supplierDocumentRequirementRules,
} from "./catalogue";

function duplicateValues(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

describe("Supplier company-document catalogue", () => {
  it("keeps stable unique namespaced document and rule keys", () => {
    const documentKeys = supplierCompanyDocumentTypes.map((entry) => entry.key);
    const ruleKeys = supplierDocumentRequirementRules.map((entry) => entry.key);

    expect(duplicateValues(documentKeys)).toEqual([]);
    expect(duplicateValues(ruleKeys)).toEqual([]);
    expect(documentKeys.every((key) => /^company_document\.[a-z0-9_]+$/.test(key))).toBe(
      true,
    );
    expect(
      ruleKeys.every((key) => /^company_document_rule\.[a-z0-9_.]+$/.test(key)),
    ).toBe(true);
  });

  it("provides complete bilingual labels and descriptions", () => {
    for (const entry of supplierCompanyDocumentTypes) {
      expect(entry.labelTr.trim().length).toBeGreaterThan(1);
      expect(entry.labelEn.trim().length).toBeGreaterThan(1);
      expect(entry.descriptionTr.trim().length).toBeGreaterThan(9);
      expect(entry.descriptionEn.trim().length).toBeGreaterThan(9);
    }
    for (const rule of supplierDocumentRequirementRules) {
      expect(rule.noteTr.trim().length).toBeGreaterThan(9);
      expect(rule.noteEn.trim().length).toBeGreaterThan(9);
    }
  });

  it("does not make structured company profile or where-applicable exporter evidence universal blockers", () => {
    const profileRule = supplierDocumentRequirementRules.find(
      (rule) => rule.documentTypeKey === "company_document.company_profile",
    );
    expect(profileRule).toMatchObject({ supplierTypeKey: null, level: "optional" });

    const exporterRules = supplierDocumentRequirementRules.filter(
      (rule) => rule.documentTypeKey === "company_document.exporter_information",
    );
    expect(exporterRules).toHaveLength(2);
    expect(exporterRules.every((rule) => rule.level === "conditional")).toBe(true);
  });

  it("requires facility, line and production-photo evidence for manufacturing Supplier types", () => {
    for (const supplierTypeKey of [
      "supplier_type.manufacturer",
      "supplier_type.manufacturer_exporter",
    ] as const) {
      const mandatoryKeys = supplierDocumentRequirementRules
        .filter(
          (rule) =>
            rule.supplierTypeKey === supplierTypeKey && rule.level === "mandatory",
        )
        .map((rule) => rule.documentTypeKey);
      expect(mandatoryKeys).toEqual([
        "company_document.facility_information",
        "company_document.machinery_production_line_summary",
        "company_document.production_photos",
      ]);
    }
  });

  it("allows public visibility only for deliberately selected supporting materials", () => {
    const publicEligible = supplierCompanyDocumentTypes
      .filter((entry) => entry.publicEligible)
      .map((entry) => entry.key);
    expect(publicEligible).toEqual([
      "company_document.company_profile",
      "company_document.facility_information",
      "company_document.machinery_production_line_summary",
      "company_document.production_photos",
      "company_document.quality_management_certificate",
    ]);
  });
});

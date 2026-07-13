import { describe, expect, it } from "vitest";

import {
  deriveSupplierDocumentState,
  requirementIsSatisfied,
  resolveSupplierDocumentRequirements,
  SupplierDocumentValidationError,
  validateSupplierDocumentFile,
  validateSupplierDocumentMetadata,
  validatedSupplierDocumentReason,
} from "./policy";

describe("Supplier company-document policy", () => {
  it("resolves base requirements for every Supplier type", () => {
    const requirements = resolveSupplierDocumentRequirements([
      "supplier_type.authorized_distributor",
    ]);

    expect(
      requirements
        .filter((requirement) => requirement.level === "mandatory")
        .map((requirement) => requirement.documentTypeKey),
    ).toEqual([
      "company_document.chamber_activity",
      "company_document.trade_registry",
      "company_document.tax_company_registration",
      "company_document.authorized_representative",
      "company_document.company_address",
      "company_document.company_profile",
    ]);
  });

  it("adds exporter and manufacturer requirements without duplicating base documents", () => {
    const requirements = resolveSupplierDocumentRequirements([
      "supplier_type.manufacturer_exporter",
      "supplier_type.private_label_supplier",
    ]);
    const keys = requirements.map((requirement) => requirement.documentTypeKey);

    expect(keys).toContain("company_document.exporter_information");
    expect(keys).toContain("company_document.facility_information");
    expect(keys).toContain("company_document.machinery_production_line_summary");
    expect(keys).toContain("company_document.production_photos");
    expect(keys).toContain("company_document.capacity_report");
    expect(keys).toContain("company_document.industrial_registry");
    expect(new Set(keys).size).toBe(keys.length);
    expect(
      requirements.find(
        (requirement) => requirement.documentTypeKey === "company_document.capacity_report",
      )?.level,
    ).toBe("conditional");
  });

  it("validates private document file metadata", () => {
    expect(
      validateSupplierDocumentFile({
        name: " trade-registry.pdf ",
        type: "application/pdf",
        size: 1024,
      }),
    ).toEqual({
      filename: "trade-registry.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });

    expect(() =>
      validateSupplierDocumentFile({
        name: "registry.exe",
        type: "application/octet-stream",
        size: 1024,
      }),
    ).toThrow(SupplierDocumentValidationError);
  });

  it("requires expiry metadata only for expiry-expected document types", () => {
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
  });

  it("derives expiry and unsafe-scan states before persisted review status", () => {
    const now = new Date("2026-07-13T12:00:00.000Z");
    expect(
      deriveSupplierDocumentState({
        storageStatus: "stored_private",
        evidenceStatus: "approved",
        scanStatus: "clean",
        expiresAt: new Date("2026-07-12T12:00:00.000Z"),
        now,
      }),
    ).toBe("expired");
    expect(
      deriveSupplierDocumentState({
        storageStatus: "stored_private",
        evidenceStatus: "uploaded",
        scanStatus: "rejected",
        now,
      }),
    ).toBe("replacement_required");
  });

  it("requires approval only for mandatory requirements", () => {
    expect(requirementIsSatisfied("mandatory", "approved")).toBe(true);
    expect(requirementIsSatisfied("mandatory", "pending_review")).toBe(false);
    expect(requirementIsSatisfied("conditional", "missing")).toBe(true);
    expect(requirementIsSatisfied("optional", "rejected")).toBe(true);
  });

  it("requires a bounded review reason", () => {
    expect(validatedSupplierDocumentReason("  Registry details confirmed  ")).toBe(
      "Registry details confirmed",
    );
    expect(() => validatedSupplierDocumentReason("x")).toThrow(
      SupplierDocumentValidationError,
    );
  });
});

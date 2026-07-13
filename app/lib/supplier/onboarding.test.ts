import { describe, expect, it } from "vitest";

import {
  buildSupplierOnboardingChecklist,
  firstSupplierChecklistAction,
  formFoundedYear,
  formOptionalString,
  formStringList,
  parseExportMarketCodes,
  supplierChecklistProgress,
} from "./onboarding";
import type { SupplierCompanyState } from "./profile.server";

const completeCompany = {
  company: {
    id: "company-1",
    status: "supplier_draft",
    businessIdentityReviewId: "review-1",
    legalName: "Anadolu Contract Textiles A.Ş.",
    tradingName: "Anadolu Textiles",
    countryCode: "TR",
    city: "Denizli",
    website: "https://example.test",
    description: "Contract textile manufacturing for hospitality and institutional projects.",
    foundedYear: 1998,
  },
  membershipRole: "owner",
  supplierTypeKeys: ["supplier_type.manufacturer"],
  applicationContextKeys: ["context.hotel_hospitality"],
  productionCapabilityKeys: ["production_capability.weaving"],
  exportMarketCountryCodes: ["DE", "GB"],
  completeness: { complete: true, missing: [] },
} satisfies SupplierCompanyState;

describe("supplier onboarding policy", () => {
  it("blocks the company profile until business identity is verified", () => {
    const checklist = buildSupplierOnboardingChecklist({
      businessIdentityVerified: false,
      company: null,
    });

    expect(
      checklist.map(({ id, complete, blocked, href }) => ({ id, complete, blocked, href })),
    ).toEqual([
      {
        id: "identity",
        complete: false,
        blocked: false,
        href: "/onboarding/business-identity",
      },
      { id: "profile", complete: false, blocked: true, href: null },
      { id: "capabilities", complete: false, blocked: true, href: null },
      { id: "documents", complete: false, blocked: true, href: null },
    ]);
    expect(firstSupplierChecklistAction(checklist)?.id).toBe("identity");
  });

  it("keeps company documents as an explicit undelivered activation blocker", () => {
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
  });

  it("uses the account language for checklist copy", () => {
    const checklist = buildSupplierOnboardingChecklist({
      language: "en",
      businessIdentityVerified: false,
      company: null,
    });

    expect(checklist[0]?.label).toBe("Verify business identity");
    expect(checklist[1]?.description).toContain("legal name");
  });

  it("normalizes export-market input deterministically", () => {
    expect(parseExportMarketCodes("de, GB; de  nl\nTR")).toEqual(["DE", "GB", "NL", "TR"]);
  });

  it("normalizes repeated checkbox values and optional fields", () => {
    const formData = new FormData();
    formData.append("supplierTypeKeys", " supplier_type.manufacturer ");
    formData.append("supplierTypeKeys", "supplier_type.manufacturer");
    formData.append("supplierTypeKeys", "supplier_type.private_label_supplier");
    formData.set("tradingName", "   ");
    formData.set("foundedYear", "1998");

    expect(formStringList(formData, "supplierTypeKeys")).toEqual([
      "supplier_type.manufacturer",
      "supplier_type.private_label_supplier",
    ]);
    expect(formOptionalString(formData, "tradingName")).toBeNull();
    expect(formFoundedYear(formData)).toBe(1998);
  });

  it("passes invalid founded-year text into domain validation as NaN", () => {
    const formData = new FormData();
    formData.set("foundedYear", "nineteen ninety-eight");

    expect(Number.isNaN(formFoundedYear(formData))).toBe(true);
  });
});

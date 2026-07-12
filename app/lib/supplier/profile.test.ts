import { describe, expect, it } from "vitest";

import {
  evaluateSupplierProfileCompleteness,
  membershipCanEditSupplierProfile,
  SupplierProfileValidationError,
  validateSupplierProfile,
} from "./profile";

const completeProfile = {
  legalName: "Anadolu Contract Textiles A.Ş.",
  tradingName: "Anadolu Textiles",
  countryCode: "tr",
  city: "Denizli",
  website: "https://example.test",
  description: "Contract textile manufacturing for hospitality and institutional projects.",
  foundedYear: 1998,
  supplierTypeKeys: ["supplier_type.manufacturer"],
  applicationContextKeys: ["context.hotel_hospitality"],
  productionCapabilityKeys: ["production_capability.weaving"],
  exportMarketCountryCodes: ["de", "gb", "DE"],
} as const;

describe("supplier profile", () => {
  it("normalizes seeded keys, country codes and duplicate export markets", () => {
    expect(validateSupplierProfile(completeProfile)).toEqual({
      ...completeProfile,
      countryCode: "TR",
      exportMarketCountryCodes: ["DE", "GB"],
    });
  });

  it("reports deterministic minimum-profile reasons without activating Supplier", () => {
    expect(
      evaluateSupplierProfileCompleteness({
        ...completeProfile,
        description: "",
        supplierTypeKeys: [],
        applicationContextKeys: [],
        productionCapabilityKeys: [],
      }),
    ).toEqual({
      complete: false,
      missing: [
        "description",
        "supplier_type",
        "application_context",
        "production_capability",
      ],
    });
    expect(evaluateSupplierProfileCompleteness(completeProfile)).toEqual({
      complete: true,
      missing: [],
    });
  });

  it("rejects custom supplier types and application contexts", () => {
    expect(() =>
      validateSupplierProfile({
        ...completeProfile,
        supplierTypeKeys: ["manufacturer"],
      }),
    ).toThrow(SupplierProfileValidationError);
    expect(() =>
      validateSupplierProfile({
        ...completeProfile,
        applicationContextKeys: ["context.custom"],
      }),
    ).toThrow(SupplierProfileValidationError);
  });

  it("keeps edit permission separate from read-only membership", () => {
    expect(membershipCanEditSupplierProfile("owner")).toBe(true);
    expect(membershipCanEditSupplierProfile("admin")).toBe(true);
    expect(membershipCanEditSupplierProfile("editor")).toBe(true);
    expect(membershipCanEditSupplierProfile("viewer")).toBe(false);
  });
});

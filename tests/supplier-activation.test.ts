import { describe, expect, it } from "vitest";

import {
  evaluateSupplierActivation,
  supplierCommercialCapabilities,
  supplierMayUseCommercialCapability,
  type SupplierActivationInput,
} from "../app/lib/supplier/activation";

function input(overrides: Partial<SupplierActivationInput> = {}): SupplierActivationInput {
  return {
    currentStatus: "supplier_draft",
    identityVerified: true,
    profile: { complete: true, missing: [] },
    mandatoryRequirements: [
      { documentTypeKey: "company_document.trade_registry", state: "approved" },
    ],
    ...overrides,
  };
}

describe("Supplier activation evaluator", () => {
  it("activates deterministically when identity, profile and mandatory evidence qualify", () => {
    const first = evaluateSupplierActivation(input());
    const second = evaluateSupplierActivation(input({ currentStatus: first.nextStatus }));

    expect(first).toEqual({
      nextStatus: "active_supplier",
      eligibleForActivation: true,
      commercialAccess: true,
      blockers: [],
    });
    expect(second).toEqual(first);
  });

  it("keeps incomplete identity or profile in supplier draft", () => {
    const result = evaluateSupplierActivation(
      input({
        identityVerified: false,
        profile: { complete: false, missing: ["description", "application_context"] },
      }),
    );

    expect(result.nextStatus).toBe("supplier_draft");
    expect(result.blockers).toEqual([
      { code: "business_identity_unverified" },
      {
        code: "profile_incomplete",
        profileMissing: ["description", "application_context"],
      },
    ]);
  });

  it.each([
    ["missing", "company_documents_required", "mandatory_document_missing"],
    ["uploaded", "company_documents_pending", "mandatory_document_pending"],
    ["pending_review", "company_documents_pending", "mandatory_document_pending"],
    ["rejected", "company_documents_rejected", "mandatory_document_rejected"],
    ["replacement_required", "company_documents_rejected", "mandatory_document_rejected"],
    ["expired", "company_documents_required", "mandatory_document_expired"],
  ] as const)(
    "maps mandatory %s evidence to %s",
    (state, expectedStatus, expectedBlocker) => {
      const result = evaluateSupplierActivation(
        input({
          mandatoryRequirements: [
            { documentTypeKey: "company_document.trade_registry", state },
          ],
        }),
      );

      expect(result.nextStatus).toBe(expectedStatus);
      expect(result.blockers[0]).toMatchObject({
        code: expectedBlocker,
        documentTypeKey: "company_document.trade_registry",
        documentState: state,
      });
    },
  );

  it("moves a previously active Supplier to reactivation required when evidence regresses", () => {
    const result = evaluateSupplierActivation(
      input({
        currentStatus: "active_supplier",
        mandatoryRequirements: [
          { documentTypeKey: "company_document.trade_registry", state: "expired" },
        ],
      }),
    );

    expect(result.nextStatus).toBe("reactivation_required");
    expect(result.commercialAccess).toBe(false);
  });

  it("reactivates when all blockers are resolved", () => {
    const result = evaluateSupplierActivation(input({ currentStatus: "reactivation_required" }));
    expect(result.nextStatus).toBe("active_supplier");
    expect(result.eligibleForActivation).toBe(true);
  });

  it("never automatically lifts an administrative suspension", () => {
    const result = evaluateSupplierActivation(input({ currentStatus: "suspended_supplier" }));
    expect(result).toEqual({
      nextStatus: "suspended_supplier",
      eligibleForActivation: false,
      commercialAccess: false,
      blockers: [{ code: "supplier_suspended" }],
    });
  });

  it("allows commercial capabilities only for active Suppliers", () => {
    for (const capability of supplierCommercialCapabilities) {
      expect(supplierMayUseCommercialCapability("active_supplier", capability)).toBe(true);
      expect(supplierMayUseCommercialCapability("company_documents_pending", capability)).toBe(
        false,
      );
      expect(supplierMayUseCommercialCapability("reactivation_required", capability)).toBe(false);
      expect(supplierMayUseCommercialCapability("suspended_supplier", capability)).toBe(false);
    }
  });
});

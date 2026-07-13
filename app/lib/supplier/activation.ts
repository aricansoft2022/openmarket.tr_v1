import type { SupplierWorkspaceStatus } from "../db/schema";
import type { SupplierDocumentDerivedState } from "./documents/policy";
import type { SupplierProfileMissingReason } from "./profile";

export const supplierCommercialCapabilities = [
  "product.publish",
  "rfq.respond",
  "enquiry.receive",
  "contact.reveal",
] as const;
export type SupplierCommercialCapability = (typeof supplierCommercialCapabilities)[number];

export type SupplierActivationBlockerCode =
  | "business_identity_unverified"
  | "profile_incomplete"
  | "mandatory_document_missing"
  | "mandatory_document_pending"
  | "mandatory_document_rejected"
  | "mandatory_document_expired"
  | "supplier_suspended";

export type SupplierActivationBlocker = {
  code: SupplierActivationBlockerCode;
  profileMissing?: SupplierProfileMissingReason[];
  documentTypeKey?: string;
  documentState?: SupplierDocumentDerivedState;
};

export type SupplierActivationRequirement = {
  documentTypeKey: string;
  state: SupplierDocumentDerivedState;
};

export type SupplierActivationInput = {
  currentStatus: SupplierWorkspaceStatus;
  identityVerified: boolean;
  profile: {
    complete: boolean;
    missing: SupplierProfileMissingReason[];
  };
  mandatoryRequirements: SupplierActivationRequirement[];
};

export type SupplierActivationEvaluation = {
  nextStatus: SupplierWorkspaceStatus;
  eligibleForActivation: boolean;
  commercialAccess: boolean;
  blockers: SupplierActivationBlocker[];
};

function mandatoryDocumentBlocker(
  requirement: SupplierActivationRequirement,
): SupplierActivationBlocker | null {
  switch (requirement.state) {
    case "approved":
      return null;
    case "pending_review":
    case "uploaded":
      return {
        code: "mandatory_document_pending",
        documentTypeKey: requirement.documentTypeKey,
        documentState: requirement.state,
      };
    case "rejected":
    case "replacement_required":
      return {
        code: "mandatory_document_rejected",
        documentTypeKey: requirement.documentTypeKey,
        documentState: requirement.state,
      };
    case "expired":
      return {
        code: "mandatory_document_expired",
        documentTypeKey: requirement.documentTypeKey,
        documentState: requirement.state,
      };
    case "missing":
      return {
        code: "mandatory_document_missing",
        documentTypeKey: requirement.documentTypeKey,
        documentState: requirement.state,
      };
  }
}

function preActivationDocumentStatus(
  blockers: readonly SupplierActivationBlocker[],
): SupplierWorkspaceStatus {
  if (blockers.some((blocker) => blocker.code === "mandatory_document_rejected")) {
    return "company_documents_rejected";
  }
  if (blockers.some((blocker) => blocker.code === "mandatory_document_pending")) {
    return "company_documents_pending";
  }
  return "company_documents_required";
}

export function evaluateSupplierActivation(
  input: SupplierActivationInput,
): SupplierActivationEvaluation {
  if (input.currentStatus === "suspended_supplier") {
    return {
      nextStatus: "suspended_supplier",
      eligibleForActivation: false,
      commercialAccess: false,
      blockers: [{ code: "supplier_suspended" }],
    };
  }

  const blockers: SupplierActivationBlocker[] = [];
  if (!input.identityVerified) {
    blockers.push({ code: "business_identity_unverified" });
  }
  if (!input.profile.complete) {
    blockers.push({
      code: "profile_incomplete",
      profileMissing: [...input.profile.missing],
    });
  }
  for (const requirement of input.mandatoryRequirements) {
    const blocker = mandatoryDocumentBlocker(requirement);
    if (blocker) blockers.push(blocker);
  }

  if (blockers.length === 0) {
    return {
      nextStatus: "active_supplier",
      eligibleForActivation: true,
      commercialAccess: true,
      blockers: [],
    };
  }

  const wasCommerciallyActive =
    input.currentStatus === "active_supplier" || input.currentStatus === "reactivation_required";
  if (wasCommerciallyActive) {
    return {
      nextStatus: "reactivation_required",
      eligibleForActivation: false,
      commercialAccess: false,
      blockers,
    };
  }

  const identityOrProfileBlocked = blockers.some(
    (blocker) =>
      blocker.code === "business_identity_unverified" || blocker.code === "profile_incomplete",
  );
  return {
    nextStatus: identityOrProfileBlocked ? "supplier_draft" : preActivationDocumentStatus(blockers),
    eligibleForActivation: false,
    commercialAccess: false,
    blockers,
  };
}

export function supplierMayUseCommercialCapability(
  status: SupplierWorkspaceStatus,
  _capability: SupplierCommercialCapability,
): boolean {
  return status === "active_supplier";
}

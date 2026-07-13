import type { PreferredLanguage } from "../db/schema";
import { supplierCopy } from "./copy";
import { SupplierProfileValidationError } from "./profile";
import { SupplierProfileActionError } from "./profile.server";

export type SupplierFormErrors = {
  legalName?: string;
  tradingName?: string;
  countryCode?: string;
  city?: string;
  website?: string;
  description?: string;
  foundedYear?: string;
  supplierTypeKeys?: string;
  applicationContextKeys?: string;
  productionCapabilityKeys?: string;
  exportMarkets?: string;
  form?: string;
};

export function supplierFormErrors(
  error: unknown,
  language: PreferredLanguage = "tr",
): SupplierFormErrors | null {
  const copy = supplierCopy(language).formErrors;

  if (error instanceof SupplierProfileValidationError) {
    switch (error.code) {
      case "INVALID_LEGAL_NAME":
        return { legalName: copy.legalName };
      case "INVALID_TRADING_NAME":
        return { tradingName: copy.tradingName };
      case "INVALID_COUNTRY":
        return { countryCode: copy.country };
      case "INVALID_CITY":
        return { city: copy.city };
      case "INVALID_WEBSITE":
        return { website: copy.website };
      case "INVALID_DESCRIPTION":
        return { description: copy.description };
      case "INVALID_FOUNDED_YEAR":
        return { foundedYear: copy.foundedYear };
      case "INVALID_SUPPLIER_TYPE":
        return { supplierTypeKeys: copy.supplierType };
      case "INVALID_APPLICATION_CONTEXT":
        return { applicationContextKeys: copy.context };
      case "INVALID_PRODUCTION_CAPABILITY":
        return { productionCapabilityKeys: copy.capability };
      case "INVALID_EXPORT_MARKET":
        return { exportMarkets: copy.markets };
    }
  }

  if (error instanceof SupplierProfileActionError) {
    switch (error.code) {
      case "UNAUTHENTICATED":
        return { form: copy.unauthenticated };
      case "SUPPLIER_INTENT_REQUIRED":
        return { form: copy.intent };
      case "BUSINESS_IDENTITY_REQUIRED":
        return { form: copy.identity };
      case "BUSINESS_IDENTITY_MISMATCH":
        return { legalName: copy.mismatch };
      case "SUPPLIER_COMPANY_EXISTS":
        return { form: copy.exists };
      case "SUPPLIER_COMPANY_NOT_FOUND":
        return { form: copy.notFound };
      case "FORBIDDEN":
        return { form: copy.forbidden };
      case "UNKNOWN_SUPPLIER_TYPE":
        return { supplierTypeKeys: copy.unknownType };
      case "UNKNOWN_PRODUCTION_CAPABILITY":
        return { productionCapabilityKeys: copy.unknownCapability };
    }
  }

  return null;
}

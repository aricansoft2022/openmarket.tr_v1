import type { SupplierMembershipRole } from "../db/schema";

export const supplierApplicationContextKeys = [
  "context.home_retail",
  "context.hotel_hospitality",
  "context.hospital_healthcare_accommodation",
  "context.dormitory_institutional_accommodation",
] as const;
export type SupplierApplicationContextKey = (typeof supplierApplicationContextKeys)[number];

export type SupplierProfileInput = {
  legalName: string;
  tradingName?: string | null;
  countryCode: string;
  city: string;
  website?: string | null;
  description?: string | null;
  foundedYear?: number | null;
  supplierTypeKeys: readonly string[];
  applicationContextKeys: readonly string[];
  productionCapabilityKeys: readonly string[];
  exportMarketCountryCodes: readonly string[];
};

export type SupplierProfileMissingReason =
  | "legal_name"
  | "country"
  | "city"
  | "description"
  | "supplier_type"
  | "application_context"
  | "production_capability";

export type SupplierProfileCompleteness = {
  complete: boolean;
  missing: SupplierProfileMissingReason[];
};

export class SupplierProfileValidationError extends Error {
  constructor(
    public readonly code:
      | "INVALID_LEGAL_NAME"
      | "INVALID_TRADING_NAME"
      | "INVALID_COUNTRY"
      | "INVALID_CITY"
      | "INVALID_WEBSITE"
      | "INVALID_DESCRIPTION"
      | "INVALID_FOUNDED_YEAR"
      | "INVALID_SUPPLIER_TYPE"
      | "INVALID_APPLICATION_CONTEXT"
      | "INVALID_PRODUCTION_CAPABILITY"
      | "INVALID_EXPORT_MARKET",
    message: string,
  ) {
    super(message);
    this.name = "SupplierProfileValidationError";
  }
}

function normalizedOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function uniqueNormalizedKeys(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizedCountryCode(value: string): string {
  return value.trim().toUpperCase();
}

function isValidWebsite(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateSupplierProfile(input: SupplierProfileInput): SupplierProfileInput {
  const legalName = input.legalName.trim();
  if (legalName.length < 2 || legalName.length > 200) {
    throw new SupplierProfileValidationError(
      "INVALID_LEGAL_NAME",
      "Legal name must contain between 2 and 200 characters.",
    );
  }

  const tradingName = normalizedOptional(input.tradingName);
  if (tradingName && (tradingName.length < 2 || tradingName.length > 200)) {
    throw new SupplierProfileValidationError(
      "INVALID_TRADING_NAME",
      "Trading name must contain between 2 and 200 characters.",
    );
  }

  const countryCode = normalizedCountryCode(input.countryCode);
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new SupplierProfileValidationError(
      "INVALID_COUNTRY",
      "Country must be an ISO alpha-2 code.",
    );
  }

  const city = input.city.trim();
  if (city.length < 2 || city.length > 120) {
    throw new SupplierProfileValidationError(
      "INVALID_CITY",
      "City must contain between 2 and 120 characters.",
    );
  }

  const website = normalizedOptional(input.website);
  if (website && !isValidWebsite(website)) {
    throw new SupplierProfileValidationError(
      "INVALID_WEBSITE",
      "Website must use an HTTP or HTTPS URL.",
    );
  }

  const description = normalizedOptional(input.description);
  if (description && (description.length < 20 || description.length > 4000)) {
    throw new SupplierProfileValidationError(
      "INVALID_DESCRIPTION",
      "Description must contain between 20 and 4000 characters.",
    );
  }

  const foundedYear = input.foundedYear ?? null;
  if (
    foundedYear !== null &&
    (!Number.isInteger(foundedYear) || foundedYear < 1800 || foundedYear > 2100)
  ) {
    throw new SupplierProfileValidationError(
      "INVALID_FOUNDED_YEAR",
      "Founded year must be between 1800 and 2100.",
    );
  }

  const supplierTypeKeys = uniqueNormalizedKeys(input.supplierTypeKeys);
  if (supplierTypeKeys.some((key) => !/^supplier_type\.[a-z0-9_]+$/.test(key))) {
    throw new SupplierProfileValidationError(
      "INVALID_SUPPLIER_TYPE",
      "Supplier type keys must use the seeded supplier_type namespace.",
    );
  }

  const applicationContextKeys = uniqueNormalizedKeys(input.applicationContextKeys);
  if (
    applicationContextKeys.some(
      (key) => !supplierApplicationContextKeys.includes(key as SupplierApplicationContextKey),
    )
  ) {
    throw new SupplierProfileValidationError(
      "INVALID_APPLICATION_CONTEXT",
      "Application contexts must use the fixed launch taxonomy.",
    );
  }

  const productionCapabilityKeys = uniqueNormalizedKeys(input.productionCapabilityKeys);
  if (productionCapabilityKeys.some((key) => !/^production_capability\.[a-z0-9_]+$/.test(key))) {
    throw new SupplierProfileValidationError(
      "INVALID_PRODUCTION_CAPABILITY",
      "Production capability keys must use the seeded production_capability namespace.",
    );
  }

  const exportMarketCountryCodes = [
    ...new Set(input.exportMarketCountryCodes.map(normalizedCountryCode)),
  ];
  if (exportMarketCountryCodes.some((code) => !/^[A-Z]{2}$/.test(code))) {
    throw new SupplierProfileValidationError(
      "INVALID_EXPORT_MARKET",
      "Export markets must use ISO alpha-2 country codes.",
    );
  }

  return {
    legalName,
    tradingName,
    countryCode,
    city,
    website,
    description,
    foundedYear,
    supplierTypeKeys,
    applicationContextKeys,
    productionCapabilityKeys,
    exportMarketCountryCodes,
  };
}

export function evaluateSupplierProfileCompleteness(
  input: SupplierProfileInput,
): SupplierProfileCompleteness {
  const missing: SupplierProfileMissingReason[] = [];

  if (input.legalName.trim().length < 2) missing.push("legal_name");
  if (!/^[A-Z]{2}$/.test(normalizedCountryCode(input.countryCode))) missing.push("country");
  if (input.city.trim().length < 2) missing.push("city");
  if ((input.description?.trim().length ?? 0) < 20) missing.push("description");
  if (input.supplierTypeKeys.length === 0) missing.push("supplier_type");
  if (input.applicationContextKeys.length === 0) missing.push("application_context");
  if (input.productionCapabilityKeys.length === 0) missing.push("production_capability");

  return { complete: missing.length === 0, missing };
}

export function membershipCanEditSupplierProfile(role: SupplierMembershipRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

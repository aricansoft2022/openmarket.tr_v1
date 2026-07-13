import type { PreferredLanguage } from "../db/schema";
import { supplierCopy } from "./copy";
import type { SupplierCompanyState } from "./profile.server";

export const supplierApplicationContextOptions = [
  {
    key: "context.home_retail",
    labelTr: "Ev ve perakende",
    labelEn: "Home and retail",
  },
  {
    key: "context.hotel_hospitality",
    labelTr: "Otel ve konaklama",
    labelEn: "Hotel and hospitality",
  },
  {
    key: "context.hospital_healthcare_accommodation",
    labelTr: "Hastane, sağlık ve bakım konaklaması",
    labelEn: "Hospital, healthcare and care accommodation",
  },
  {
    key: "context.dormitory_institutional_accommodation",
    labelTr: "Yurt ve kurumsal konaklama",
    labelEn: "Dormitory and institutional accommodation",
  },
] as const;

export type SupplierChecklistItem = {
  id: "identity" | "profile" | "capabilities" | "documents";
  label: string;
  description: string;
  complete: boolean;
  blocked: boolean;
  href: string | null;
};

export function buildSupplierOnboardingChecklist(input: {
  language?: PreferredLanguage;
  businessIdentityVerified: boolean;
  company: SupplierCompanyState | null;
}): SupplierChecklistItem[] {
  const copy = supplierCopy(input.language ?? "tr").checklist;
  const hasCompany = Boolean(input.company);
  const hasSelections = Boolean(
    input.company &&
      input.company.supplierTypeKeys.length > 0 &&
      input.company.applicationContextKeys.length > 0,
  );

  return [
    {
      id: "identity",
      label: copy.identity.label,
      description: input.businessIdentityVerified
        ? copy.identity.complete
        : copy.identity.incomplete,
      complete: input.businessIdentityVerified,
      blocked: false,
      href: input.businessIdentityVerified
        ? "/onboarding/business-identity/status"
        : "/onboarding/business-identity",
    },
    {
      id: "profile",
      label: copy.profile.label,
      description: input.company?.completeness.complete
        ? copy.profile.complete
        : copy.profile.incomplete,
      complete: Boolean(input.company?.completeness.complete),
      blocked: !input.businessIdentityVerified,
      href: input.businessIdentityVerified ? "/supplier/company" : null,
    },
    {
      id: "capabilities",
      label: copy.capabilities.label,
      description: hasSelections
        ? copy.capabilities.complete
        : copy.capabilities.incomplete,
      complete: hasSelections,
      blocked: !hasCompany,
      href: hasCompany ? "/supplier/capabilities" : null,
    },
    {
      id: "documents",
      label: copy.documents.label,
      description: copy.documents.description,
      complete: false,
      blocked: true,
      href: null,
    },
  ];
}

export function supplierChecklistProgress(items: readonly SupplierChecklistItem[]): {
  complete: number;
  total: number;
  percent: number;
} {
  const complete = items.filter((item) => item.complete).length;
  const total = items.length;
  return { complete, total, percent: Math.round((complete / total) * 100) };
}

export function firstSupplierChecklistAction(
  items: readonly SupplierChecklistItem[],
): SupplierChecklistItem | null {
  return items.find((item) => !item.complete && !item.blocked && item.href) ?? null;
}

export function parseExportMarketCodes(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
}

export function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function formOptionalString(formData: FormData, name: string): string | null {
  return formString(formData, name) || null;
}

export function formStringList(formData: FormData, name: string): string[] {
  return [
    ...new Set(
      formData
        .getAll(name)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

export function formFoundedYear(formData: FormData): number | null {
  const raw = formString(formData, "foundedYear");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : Number.NaN;
}

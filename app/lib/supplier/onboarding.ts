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
  businessIdentityVerified: boolean;
  company: SupplierCompanyState | null;
}): SupplierChecklistItem[] {
  const hasCompany = Boolean(input.company);
  const hasSelections = Boolean(
    input.company &&
      input.company.supplierTypeKeys.length > 0 &&
      input.company.applicationContextKeys.length > 0,
  );

  return [
    {
      id: "identity",
      label: "İş kimliğini doğrula",
      description: input.businessIdentityVerified
        ? "Doğrulanmış şirket kimliği Supplier kaydına bağlanabilir."
        : "Şirket profili oluşturmadan önce iş kimliği doğrulaması tamamlanmalıdır.",
      complete: input.businessIdentityVerified,
      blocked: false,
      href: input.businessIdentityVerified ? "/onboarding/business-identity/status" : "/onboarding/business-identity",
    },
    {
      id: "profile",
      label: "Minimum şirket profilini tamamla",
      description: input.company?.completeness.complete
        ? "Zorunlu şirket profili alanları tamamlandı."
        : "Yasal ad, ülke, şehir, açıklama ve gerekli profil alanlarını kaydedin.",
      complete: Boolean(input.company?.completeness.complete),
      blocked: !input.businessIdentityVerified,
      href: input.businessIdentityVerified ? "/supplier/company" : null,
    },
    {
      id: "capabilities",
      label: "Tedarikçi türlerini ve kullanım bağlamlarını seç",
      description: hasSelections
        ? "Tedarikçi türleri ve en az bir kullanım bağlamı kaydedildi."
        : "Bir veya daha fazla tedarikçi türü ve en az bir kullanım bağlamı seçin. Üretim kabiliyeti üretici olmayan şirketler için isteğe bağlıdır.",
      complete: hasSelections,
      blocked: !hasCompany,
      href: hasCompany ? "/supplier/capabilities" : null,
    },
    {
      id: "documents",
      label: "Şirket belgelerini yükle",
      description:
        "Şirket belgesi modülü ayrı bir güvenli yükleme ve inceleme diliminde etkinleştirilecek.",
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

export function firstSupplierChecklistAction(items: readonly SupplierChecklistItem[]): SupplierChecklistItem | null {
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

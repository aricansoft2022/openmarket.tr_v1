import { intendedUses, type IntendedUse } from "../db/schema";
import { emailDomain } from "./transitions.server";

export type WorkspaceFormErrors = {
  intendedUse?: string;
  form?: string;
};

export type IdentityFormValues = {
  companyName: string;
  companyEmail: string;
  applicantNote: string;
};

export type IdentityFormErrors = Partial<Record<keyof IdentityFormValues | "form", string>>;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function validateWorkspaceSelection(formData: FormData): {
  intendedUse: IntendedUse | null;
  errors: WorkspaceFormErrors;
} {
  const intendedUse = text(formData, "intendedUse");
  if (!intendedUses.includes(intendedUse as IntendedUse)) {
    return {
      intendedUse: null,
      errors: { intendedUse: "Alıcı, tedarikçi veya her ikisini seçin." },
    };
  }

  return { intendedUse: intendedUse as IntendedUse, errors: {} };
}

export function validateBusinessIdentity(formData: FormData): {
  values: IdentityFormValues;
  errors: IdentityFormErrors;
} {
  const values: IdentityFormValues = {
    companyName: text(formData, "companyName"),
    companyEmail: text(formData, "companyEmail").toLowerCase(),
    applicantNote: text(formData, "applicantNote"),
  };
  const errors: IdentityFormErrors = {};

  if (values.companyName.length < 2 || values.companyName.length > 160) {
    errors.companyName = "Şirket adı 2–160 karakter olmalıdır.";
  }

  try {
    emailDomain(values.companyEmail);
  } catch {
    errors.companyEmail = "Geçerli bir şirket e-postası girin.";
  }

  if (values.companyEmail.length > 320) {
    errors.companyEmail = "E-posta adresi çok uzun.";
  }

  if (values.applicantNote.length > 1200) {
    errors.applicantNote = "Açıklama 1200 karakteri geçemez.";
  }

  return { values, errors };
}

export function hasOnboardingErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

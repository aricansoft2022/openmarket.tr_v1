import { preferredLanguages, type PreferredLanguage } from "../db/schema";

export type EmailRequestValues = {
  email: string;
  preferredLanguage: PreferredLanguage | "";
};

export type EmailRequestErrors = Partial<Record<keyof EmailRequestValues | "form", string>>;

export type ResetPasswordErrors = Partial<
  Record<"token" | "password" | "confirmPassword" | "form", string>
>;

function raw(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function trimmed(formData: FormData, key: string): string {
  return raw(formData, key).trim();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateEmailRequest(formData: FormData): {
  values: EmailRequestValues;
  errors: EmailRequestErrors;
} {
  const values: EmailRequestValues = {
    email: trimmed(formData, "email").toLowerCase(),
    preferredLanguage: trimmed(formData, "preferredLanguage") as PreferredLanguage | "",
  };
  const errors: EmailRequestErrors = {};

  if (!isEmail(values.email)) errors.email = "Geçerli bir e-posta adresi girin.";
  if (!preferredLanguages.includes(values.preferredLanguage as PreferredLanguage)) {
    errors.preferredLanguage = "Türkçe veya İngilizce seçin.";
  }

  return { values, errors };
}

export function validateResetPassword(formData: FormData): {
  token: string;
  password: string;
  errors: ResetPasswordErrors;
} {
  const token = trimmed(formData, "token");
  const password = raw(formData, "password");
  const confirmPassword = raw(formData, "confirmPassword");
  const errors: ResetPasswordErrors = {};

  if (!token) errors.token = "Şifre sıfırlama bağlantısı eksik veya geçersiz.";
  if (password.length < 8 || password.length > 128) {
    errors.password = "Şifre 8–128 karakter olmalıdır.";
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = "Şifreler eşleşmiyor.";
  }

  return { token, password, errors };
}

export function hasRecoveryErrors(errors: EmailRequestErrors | ResetPasswordErrors): boolean {
  return Object.keys(errors).length > 0;
}

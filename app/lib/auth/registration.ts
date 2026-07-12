import {
  intendedUses,
  preferredLanguages,
  type IntendedUse,
  type PreferredLanguage,
} from "../db/schema/preferences";

export type RegistrationValues = {
  name: string;
  email: string;
  country: string;
  preferredLanguage: PreferredLanguage | "";
  intendedUse: IntendedUse | "";
};

export type RegistrationErrors = Partial<
  Record<keyof RegistrationValues | "password" | "confirmPassword" | "form", string>
>;

export type LoginValues = {
  email: string;
};

export type LoginErrors = Partial<Record<keyof LoginValues | "password" | "form", string>>;

function readRawString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readString(formData: FormData, key: string): string {
  return readRawString(formData, key).trim();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateRegistration(formData: FormData): {
  values: RegistrationValues;
  password: string;
  errors: RegistrationErrors;
} {
  const values: RegistrationValues = {
    name: readString(formData, "name"),
    email: readString(formData, "email").toLowerCase(),
    country: readString(formData, "country"),
    preferredLanguage: readString(formData, "preferredLanguage") as PreferredLanguage | "",
    intendedUse: readString(formData, "intendedUse") as IntendedUse | "",
  };
  const password = readRawString(formData, "password");
  const confirmPassword = readRawString(formData, "confirmPassword");
  const errors: RegistrationErrors = {};

  if (values.name.length < 2 || values.name.length > 120) {
    errors.name = "Ad soyad 2–120 karakter olmalıdır.";
  }
  if (!isEmail(values.email)) {
    errors.email = "Geçerli bir e-posta adresi girin.";
  }
  if (values.country.length < 2 || values.country.length > 80) {
    errors.country = "Ülke 2–80 karakter olmalıdır.";
  }
  if (!preferredLanguages.includes(values.preferredLanguage as PreferredLanguage)) {
    errors.preferredLanguage = "Türkçe veya İngilizce seçin.";
  }
  if (!intendedUses.includes(values.intendedUse as IntendedUse)) {
    errors.intendedUse = "Alıcı, tedarikçi veya her ikisini seçin.";
  }
  if (password.length < 8 || password.length > 128) {
    errors.password = "Şifre 8–128 karakter olmalıdır.";
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = "Şifreler eşleşmiyor.";
  }

  return { values, password, errors };
}

export function validateLogin(formData: FormData): {
  values: LoginValues;
  password: string;
  errors: LoginErrors;
} {
  const values = { email: readString(formData, "email").toLowerCase() };
  const password = readRawString(formData, "password");
  const errors: LoginErrors = {};

  if (!isEmail(values.email)) {
    errors.email = "Geçerli bir e-posta adresi girin.";
  }
  if (!password) {
    errors.password = "Şifrenizi girin.";
  }

  return { values, password, errors };
}

export function hasErrors(errors: RegistrationErrors | LoginErrors): boolean {
  return Object.keys(errors).length > 0;
}

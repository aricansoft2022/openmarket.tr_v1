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

export function supplierFormErrors(error: unknown): SupplierFormErrors | null {
  if (error instanceof SupplierProfileValidationError) {
    switch (error.code) {
      case "INVALID_LEGAL_NAME":
        return { legalName: "Yasal şirket adı 2–200 karakter arasında olmalıdır." };
      case "INVALID_TRADING_NAME":
        return { tradingName: "Ticari ad boş bırakılmalı veya 2–200 karakter olmalıdır." };
      case "INVALID_COUNTRY":
        return { countryCode: "Ülke kodu iki harfli biçimde girilmelidir." };
      case "INVALID_CITY":
        return { city: "Şehir 2–120 karakter arasında olmalıdır." };
      case "INVALID_WEBSITE":
        return { website: "Web sitesi http:// veya https:// ile başlayan geçerli bir adres olmalıdır." };
      case "INVALID_DESCRIPTION":
        return { description: "Şirket açıklaması 20–4000 karakter arasında olmalıdır." };
      case "INVALID_FOUNDED_YEAR":
        return { foundedYear: "Kuruluş yılı 1800–2100 arasında olmalıdır." };
      case "INVALID_SUPPLIER_TYPE":
        return { supplierTypeKeys: "Tedarikçi türleri yalnızca aktif katalogdan seçilebilir." };
      case "INVALID_APPLICATION_CONTEXT":
        return { applicationContextKeys: "Kullanım bağlamı sabit launch listesinden seçilmelidir." };
      case "INVALID_PRODUCTION_CAPABILITY":
        return {
          productionCapabilityKeys: "Üretim kabiliyetleri yalnızca aktif katalogdan seçilebilir.",
        };
      case "INVALID_EXPORT_MARKET":
        return { exportMarkets: "İhracat pazarları iki harfli ülke kodlarıyla girilmelidir." };
    }
  }

  if (error instanceof SupplierProfileActionError) {
    switch (error.code) {
      case "UNAUTHENTICATED":
        return { form: "Oturumunuz sona erdi. Yeniden giriş yapın." };
      case "SUPPLIER_INTENT_REQUIRED":
        return { form: "Önce Tedarikçi veya Her ikisi çalışma alanını seçin." };
      case "BUSINESS_IDENTITY_REQUIRED":
        return { form: "Şirket profili için doğrulanmış iş kimliği gereklidir." };
      case "BUSINESS_IDENTITY_MISMATCH":
        return { legalName: "Yasal ad doğrulanmış iş kimliğindeki şirket adıyla eşleşmelidir." };
      case "SUPPLIER_COMPANY_EXISTS":
        return { form: "Bu hesap zaten aktif bir Supplier şirketinin sahibidir." };
      case "SUPPLIER_COMPANY_NOT_FOUND":
        return { form: "Supplier şirketi bulunamadı veya bu hesap için erişilebilir değil." };
      case "FORBIDDEN":
        return { form: "Bu üyelik Supplier profilini düzenleyemez." };
      case "UNKNOWN_SUPPLIER_TYPE":
        return { supplierTypeKeys: "Seçilen tedarikçi türlerinden biri aktif katalogda değil." };
      case "UNKNOWN_PRODUCTION_CAPABILITY":
        return {
          productionCapabilityKeys: "Seçilen üretim kabiliyetlerinden biri aktif katalogda değil.",
        };
    }
  }

  return null;
}

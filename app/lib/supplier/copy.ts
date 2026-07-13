import type { PreferredLanguage } from "../db/schema";

const copy = {
  tr: {
    shell: {
      workspace: "Tedarikçi çalışma alanı",
      overview: "Genel bakış",
      onboarding: "Onboarding",
      company: "Şirket profili",
      capabilities: "Türler ve kabiliyetler",
      documents: "Şirket belgeleri",
      activationBoundary: "Aktivasyon sınırı",
      activationNotice:
        "Profil hazırlığı ticari yetki vermez. Belge onayı tamamlanmadan ürün yayınlama ve RFQ yanıtlama kapalıdır.",
      loadingEyebrow: "Yükleniyor",
      loadingTitle: "Tedarikçi çalışma alanı hazırlanıyor",
      loadingDescription: "Şirket, üyelik ve katalog bilgileri güvenli biçimde yükleniyor.",
      errorEyebrow: "Hata durumu",
      errorTitle: "Bu ekran şu anda açılamıyor",
      errorDescription: "Tedarikçi çalışma alanı yüklenemedi. Lütfen yeniden deneyin.",
      overviewAction: "Genel bakışa dön",
      securityAction: "Hesap güvenliği",
      roles: {
        owner: "Sahip",
        admin: "Yönetici",
        editor: "Editör",
        viewer: "Görüntüleyici",
      },
      statuses: {
        supplier_draft: "Tedarikçi taslağı",
        company_documents_required: "Şirket belgeleri gerekli",
        company_documents_pending: "Şirket belgeleri inceleniyor",
        company_documents_rejected: "Şirket belgeleri reddedildi",
        active_supplier: "Aktif tedarikçi",
        reactivation_required: "Yeniden aktivasyon gerekli",
        suspended_supplier: "Tedarikçi askıya alındı",
        notCreated: "Kurulum bekleniyor",
      },
    },
    checklist: {
      identity: {
        label: "İş kimliğini doğrula",
        complete: "Doğrulanmış şirket kimliği Supplier kaydına bağlanabilir.",
        incomplete: "Şirket profili oluşturmadan önce iş kimliği doğrulaması tamamlanmalıdır.",
      },
      profile: {
        label: "Minimum şirket profilini tamamla",
        complete: "Zorunlu şirket profili alanları tamamlandı.",
        incomplete: "Yasal ad, ülke, şehir, açıklama ve gerekli profil alanlarını kaydedin.",
      },
      capabilities: {
        label: "Tedarikçi türlerini ve kullanım bağlamlarını seç",
        complete: "Tedarikçi türleri ve en az bir kullanım bağlamı kaydedildi.",
        incomplete:
          "Bir veya daha fazla tedarikçi türü ve en az bir kullanım bağlamı seçin. Üretim kabiliyeti üretici olmayan şirketler için isteğe bağlıdır.",
      },
      documents: {
        label: "Şirket belgelerini yükle",
        description:
          "Şirket belgesi modülü ayrı bir güvenli yükleme ve inceleme diliminde etkinleştirilecek.",
      },
    },
    formErrors: {
      legalName: "Yasal şirket adı 2–200 karakter arasında olmalıdır.",
      tradingName: "Ticari ad boş bırakılmalı veya 2–200 karakter olmalıdır.",
      country: "Ülke kodu iki harfli biçimde girilmelidir.",
      city: "Şehir 2–120 karakter arasında olmalıdır.",
      website: "Web sitesi http:// veya https:// ile başlayan geçerli bir adres olmalıdır.",
      description: "Şirket açıklaması 20–4000 karakter arasında olmalıdır.",
      foundedYear: "Kuruluş yılı 1800–2100 arasında olmalıdır.",
      supplierType: "Tedarikçi türleri yalnızca aktif katalogdan seçilebilir.",
      context: "Kullanım bağlamı sabit launch listesinden seçilmelidir.",
      capability: "Üretim kabiliyetleri yalnızca aktif katalogdan seçilebilir.",
      markets: "İhracat pazarları iki harfli ülke kodlarıyla girilmelidir.",
      unauthenticated: "Oturumunuz sona erdi. Yeniden giriş yapın.",
      intent: "Önce Tedarikçi veya Her ikisi çalışma alanını seçin.",
      identity: "Şirket profili için doğrulanmış iş kimliği gereklidir.",
      mismatch: "Yasal ad doğrulanmış iş kimliğindeki şirket adıyla eşleşmelidir.",
      exists: "Bu hesap zaten aktif bir Supplier şirketinin sahibidir.",
      notFound: "Supplier şirketi bulunamadı veya bu hesap için erişilebilir değil.",
      forbidden: "Bu üyelik Supplier profilini düzenleyemez.",
      unknownType: "Seçilen tedarikçi türlerinden biri aktif katalogda değil.",
      unknownCapability: "Seçilen üretim kabiliyetlerinden biri aktif katalogda değil.",
    },
  },
  en: {
    shell: {
      workspace: "Supplier workspace",
      overview: "Overview",
      onboarding: "Onboarding",
      company: "Company profile",
      capabilities: "Types and capabilities",
      documents: "Company documents",
      activationBoundary: "Activation boundary",
      activationNotice:
        "Profile preparation does not grant commercial access. Product publishing and RFQ responses remain disabled until company documents are approved.",
      loadingEyebrow: "Loading",
      loadingTitle: "Preparing the Supplier workspace",
      loadingDescription: "Company, membership and catalogue data are loading securely.",
      errorEyebrow: "Error state",
      errorTitle: "This screen cannot be opened right now",
      errorDescription: "The Supplier workspace could not be loaded. Please try again.",
      overviewAction: "Return to overview",
      securityAction: "Account security",
      roles: {
        owner: "Owner",
        admin: "Admin",
        editor: "Editor",
        viewer: "Viewer",
      },
      statuses: {
        supplier_draft: "Supplier draft",
        company_documents_required: "Company documents required",
        company_documents_pending: "Company documents under review",
        company_documents_rejected: "Company documents rejected",
        active_supplier: "Active Supplier",
        reactivation_required: "Reactivation required",
        suspended_supplier: "Supplier suspended",
        notCreated: "Setup pending",
      },
    },
    checklist: {
      identity: {
        label: "Verify business identity",
        complete: "The verified company identity can be bound to the Supplier record.",
        incomplete:
          "Business identity verification must finish before creating the company profile.",
      },
      profile: {
        label: "Complete the minimum company profile",
        complete: "The required company profile fields are complete.",
        incomplete: "Save the legal name, country, city, description and required profile fields.",
      },
      capabilities: {
        label: "Select Supplier types and application contexts",
        complete: "Supplier types and at least one application context are saved.",
        incomplete:
          "Select one or more Supplier types and at least one application context. Production capabilities are optional for non-manufacturing companies.",
      },
      documents: {
        label: "Upload company documents",
        description:
          "The company-document module will be enabled in a separate secure upload and review slice.",
      },
    },
    formErrors: {
      legalName: "The legal company name must contain 2–200 characters.",
      tradingName: "The trading name must be empty or contain 2–200 characters.",
      country: "Enter a two-letter country-code format.",
      city: "The city must contain 2–120 characters.",
      website: "The website must be a valid address beginning with http:// or https://.",
      description: "The company description must contain 20–4000 characters.",
      foundedYear: "The founded year must be between 1800 and 2100.",
      supplierType: "Supplier types must be selected from the active catalogue.",
      context: "Application contexts must use the fixed launch list.",
      capability: "Production capabilities must be selected from the active catalogue.",
      markets: "Export markets must use two-letter country codes.",
      unauthenticated: "Your session ended. Sign in again.",
      intent: "Select the Supplier or Both workspace first.",
      identity: "A verified business identity is required for the company profile.",
      mismatch: "The legal name must match the company name in the verified business identity.",
      exists: "This account already owns an active Supplier company.",
      notFound: "The Supplier company was not found or is not accessible to this account.",
      forbidden: "This membership cannot edit the Supplier profile.",
      unknownType: "One of the selected Supplier types is not in the active catalogue.",
      unknownCapability:
        "One of the selected production capabilities is not in the active catalogue.",
    },
  },
} as const;

export function supplierCopy(language: PreferredLanguage) {
  return copy[language];
}

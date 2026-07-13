import type { LaunchSupplierTypeKey } from "../catalogue";

export type SupplierDocumentTypeEntry = {
  key: string;
  labelTr: string;
  labelEn: string;
  descriptionTr: string;
  descriptionEn: string;
  publicEligible: boolean;
  expiryExpected: boolean;
  sortOrder: number;
};

export const supplierCompanyDocumentTypes = [
  {
    key: "company_document.chamber_activity",
    labelTr: "Oda kayıt veya faaliyet belgesi",
    labelEn: "Chamber registration or activity document",
    descriptionTr: "Şirketin ilgili oda veya meslek kuruluşundaki güncel kaydını gösterir.",
    descriptionEn: "Shows the company’s current registration with the relevant chamber or trade body.",
    publicEligible: false,
    expiryExpected: true,
    sortOrder: 10,
  },
  {
    key: "company_document.trade_registry",
    labelTr: "Ticaret sicil kaydı",
    labelEn: "Trade registry record",
    descriptionTr: "Şirketin yasal kuruluş ve sicil bilgilerini gösterir.",
    descriptionEn: "Shows the company’s legal incorporation and registry details.",
    publicEligible: false,
    expiryExpected: false,
    sortOrder: 20,
  },
  {
    key: "company_document.tax_company_registration",
    labelTr: "Vergi veya şirket kayıt belgesi",
    labelEn: "Tax or company registration",
    descriptionTr: "Vergi mükellefiyeti veya eşdeğer resmi şirket kaydını gösterir.",
    descriptionEn: "Shows tax registration or an equivalent official company registration.",
    publicEligible: false,
    expiryExpected: false,
    sortOrder: 30,
  },
  {
    key: "company_document.authorized_representative",
    labelTr: "Yetkili temsilci kanıtı",
    labelEn: "Authorized representative evidence",
    descriptionTr: "Başvuruyu ve şirket işlemlerini yapan kişinin temsil yetkisini gösterir.",
    descriptionEn: "Shows that the applicant is authorized to represent the company.",
    publicEligible: false,
    expiryExpected: true,
    sortOrder: 40,
  },
  {
    key: "company_document.company_address",
    labelTr: "Şirket adres kanıtı",
    labelEn: "Company address evidence",
    descriptionTr: "Şirket profilindeki adres veya faaliyet yerini destekler.",
    descriptionEn: "Supports the address or operating location stated in the company profile.",
    publicEligible: false,
    expiryExpected: true,
    sortOrder: 50,
  },
  {
    key: "company_document.exporter_information",
    labelTr: "İhracatçı bilgisi",
    labelEn: "Exporter information",
    descriptionTr: "İhracatçı veya dış ticaret faaliyetini destekleyen resmi bilgiyi gösterir.",
    descriptionEn: "Shows official information supporting exporter or trading-company activity.",
    publicEligible: false,
    expiryExpected: true,
    sortOrder: 60,
  },
  {
    key: "company_document.company_profile",
    labelTr: "Şirket tanıtım dosyası",
    labelEn: "Company profile",
    descriptionTr: "Şirketin ürün aileleri, pazarları, tesisleri ve çalışma modelini açıklar.",
    descriptionEn: "Describes the company’s product families, markets, facilities and operating model.",
    publicEligible: true,
    expiryExpected: false,
    sortOrder: 70,
  },
  {
    key: "company_document.capacity_report",
    labelTr: "Kapasite raporu",
    labelEn: "Capacity report",
    descriptionTr: "Mevcut olduğu durumlarda üretim kapasitesini destekleyen resmi rapordur.",
    descriptionEn: "An official report supporting production capacity where available.",
    publicEligible: false,
    expiryExpected: true,
    sortOrder: 80,
  },
  {
    key: "company_document.industrial_registry",
    labelTr: "Sanayi sicil belgesi",
    labelEn: "Industrial registry",
    descriptionTr: "Uygulanabildiği durumlarda üretim tesisinin sanayi sicil kaydını gösterir.",
    descriptionEn: "Shows the facility’s industrial registration where applicable.",
    publicEligible: false,
    expiryExpected: true,
    sortOrder: 90,
  },
  {
    key: "company_document.facility_information",
    labelTr: "Tesis bilgisi",
    labelEn: "Facility information",
    descriptionTr: "Üretim veya operasyon tesislerinin konum ve kullanım bilgisini açıklar.",
    descriptionEn: "Describes the location and use of production or operating facilities.",
    publicEligible: true,
    expiryExpected: false,
    sortOrder: 100,
  },
  {
    key: "company_document.machinery_production_line_summary",
    labelTr: "Makine veya üretim hattı özeti",
    labelEn: "Machinery or production-line summary",
    descriptionTr: "Beyan edilen üretim süreçlerini destekleyen makine ve hat özetidir.",
    descriptionEn: "Summarizes machinery and production lines supporting declared processes.",
    publicEligible: true,
    expiryExpected: false,
    sortOrder: 110,
  },
  {
    key: "company_document.production_photos",
    labelTr: "Üretim fotoğrafları",
    labelEn: "Production photos",
    descriptionTr: "Üretim tesisi, hat veya süreçleri gösteren güncel görsel kanıttır.",
    descriptionEn: "Current visual evidence of production facilities, lines or processes.",
    publicEligible: true,
    expiryExpected: false,
    sortOrder: 120,
  },
  {
    key: "company_document.quality_management_certificate",
    labelTr: "Kalite yönetim sertifikası",
    labelEn: "Quality management certificate",
    descriptionTr: "Yalnız şirket kalite yönetim sertifikası beyan ettiğinde kullanılır.",
    descriptionEn: "Used only when the company declares a quality-management certification.",
    publicEligible: true,
    expiryExpected: true,
    sortOrder: 130,
  },
] as const satisfies readonly SupplierDocumentTypeEntry[];

export type SupplierCompanyDocumentTypeKey =
  (typeof supplierCompanyDocumentTypes)[number]["key"];

export type SupplierDocumentRequirementLevel = "mandatory" | "conditional" | "optional";

export type SupplierDocumentRequirementRule = {
  key: string;
  documentTypeKey: SupplierCompanyDocumentTypeKey;
  supplierTypeKey: LaunchSupplierTypeKey | null;
  level: SupplierDocumentRequirementLevel;
  noteTr: string;
  noteEn: string;
  sortOrder: number;
};

const baseMandatoryDocumentKeys = [
  "company_document.chamber_activity",
  "company_document.trade_registry",
  "company_document.tax_company_registration",
  "company_document.authorized_representative",
  "company_document.company_address",
  "company_document.company_profile",
] as const satisfies readonly SupplierCompanyDocumentTypeKey[];

const manufacturerSupplierTypes = [
  "supplier_type.manufacturer",
  "supplier_type.manufacturer_exporter",
] as const satisfies readonly LaunchSupplierTypeKey[];

export const supplierDocumentRequirementRules: readonly SupplierDocumentRequirementRule[] = [
  ...baseMandatoryDocumentKeys.map((documentTypeKey, index) => ({
    key: `company_document_rule.base.${documentTypeKey.split(".").at(-1)}`,
    documentTypeKey,
    supplierTypeKey: null,
    level: "mandatory" as const,
    noteTr: "Tüm Supplier şirketleri için launch aktivasyon gereksinimi.",
    noteEn: "Launch activation requirement for every Supplier company.",
    sortOrder: 10 + index,
  })),
  {
    key: "company_document_rule.exporter.manufacturer_exporter",
    documentTypeKey: "company_document.exporter_information",
    supplierTypeKey: "supplier_type.manufacturer_exporter",
    level: "mandatory",
    noteTr: "Üretici-ihracatçı türü için ihracatçı bilgisini destekler.",
    noteEn: "Supports exporter information for the Manufacturer-exporter type.",
    sortOrder: 30,
  },
  {
    key: "company_document_rule.exporter.trading_company",
    documentTypeKey: "company_document.exporter_information",
    supplierTypeKey: "supplier_type.exporter_trading_company",
    level: "mandatory",
    noteTr: "İhracatçı veya dış ticaret şirketi türü için zorunludur.",
    noteEn: "Mandatory for the Exporter or trading company type.",
    sortOrder: 31,
  },
  ...manufacturerSupplierTypes.flatMap((supplierTypeKey, supplierIndex) =>
    ([
      "company_document.facility_information",
      "company_document.machinery_production_line_summary",
      "company_document.production_photos",
    ] as const satisfies readonly SupplierCompanyDocumentTypeKey[]).map(
      (documentTypeKey, documentIndex) => ({
        key: `company_document_rule.manufacturer.${supplierTypeKey.split(".").at(-1)}.${documentTypeKey.split(".").at(-1)}`,
        documentTypeKey,
        supplierTypeKey,
        level: "mandatory" as const,
        noteTr: "Üretici türünün beyan ettiği üretim faaliyetini destekler.",
        noteEn: "Supports the production activity declared by the manufacturer type.",
        sortOrder: 40 + supplierIndex * 10 + documentIndex,
      }),
    ),
  ),
  ...manufacturerSupplierTypes.flatMap((supplierTypeKey, supplierIndex) =>
    ([
      "company_document.capacity_report",
      "company_document.industrial_registry",
    ] as const satisfies readonly SupplierCompanyDocumentTypeKey[]).map(
      (documentTypeKey, documentIndex) => ({
        key: `company_document_rule.conditional.${supplierTypeKey.split(".").at(-1)}.${documentTypeKey.split(".").at(-1)}`,
        documentTypeKey,
        supplierTypeKey,
        level: "conditional" as const,
        noteTr: "Mevcut veya uygulanabilir olduğu durumda istenir; yokluğu tek başına aktivasyonu engellemez.",
        noteEn: "Requested where available or applicable; absence alone does not block activation.",
        sortOrder: 70 + supplierIndex * 10 + documentIndex,
      }),
    ),
  ),
  {
    key: "company_document_rule.optional.quality_management",
    documentTypeKey: "company_document.quality_management_certificate",
    supplierTypeKey: null,
    level: "optional",
    noteTr: "Yalnız kalite yönetim sertifikası beyan edildiğinde yüklenir.",
    noteEn: "Uploaded only when a quality-management certificate is declared.",
    sortOrder: 100,
  },
];

export const supplierCompanyDocumentTypeKeys = supplierCompanyDocumentTypes.map(
  (entry) => entry.key,
);

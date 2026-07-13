export type SupplierCatalogueEntry<Key extends string = string> = {
  key: Key;
  labelTr: string;
  labelEn: string;
  sortOrder: number;
};

// Specification 5.3 defines this list verbatim. Keys are stable identifiers;
// labels may be corrected only through a reviewed seed version.
export const launchSupplierTypes = [
  {
    key: "supplier_type.manufacturer",
    labelTr: "Üretici",
    labelEn: "Manufacturer",
    sortOrder: 10,
  },
  {
    key: "supplier_type.manufacturer_exporter",
    labelTr: "Üretici-ihracatçı",
    labelEn: "Manufacturer-exporter",
    sortOrder: 20,
  },
  {
    key: "supplier_type.exporter_trading_company",
    labelTr: "İhracatçı veya dış ticaret şirketi",
    labelEn: "Exporter or trading company",
    sortOrder: 30,
  },
  {
    key: "supplier_type.authorized_distributor",
    labelTr: "Yetkili distribütör",
    labelEn: "Authorized distributor",
    sortOrder: 40,
  },
  {
    key: "supplier_type.contract_textile_project_supplier",
    labelTr: "Kontrat tekstili proje tedarikçisi",
    labelEn: "Contract textile project supplier",
    sortOrder: 50,
  },
  {
    key: "supplier_type.private_label_supplier",
    labelTr: "Özel marka tedarikçisi",
    labelEn: "Private-label supplier",
    sortOrder: 60,
  },
] as const satisfies readonly SupplierCatalogueEntry[];

export type LaunchSupplierTypeKey = (typeof launchSupplierTypes)[number]["key"];

// The specification requires a database-driven ProductionCapabilityForm but does
// not provide a standalone capability enumeration. This intentionally narrow
// launch set is derived only from explicitly named textile process and service
// families in sections 5, 7, 8, 10, 12 and 21. Expanding it requires a reviewed
// catalogue decision rather than accepting arbitrary user-defined values.
export const launchProductionCapabilities = [
  {
    key: "production_capability.weaving",
    labelTr: "Dokuma",
    labelEn: "Weaving",
    sortOrder: 10,
  },
  {
    key: "production_capability.knitting",
    labelTr: "Örme",
    labelEn: "Knitting",
    sortOrder: 20,
  },
  {
    key: "production_capability.dyeing",
    labelTr: "Boyama",
    labelEn: "Dyeing",
    sortOrder: 30,
  },
  {
    key: "production_capability.printing",
    labelTr: "Baskı",
    labelEn: "Printing",
    sortOrder: 40,
  },
  {
    key: "production_capability.embroidery_logo",
    labelTr: "Nakış ve logo uygulama",
    labelEn: "Embroidery and logo application",
    sortOrder: 50,
  },
  {
    key: "production_capability.quilting",
    labelTr: "Kapitone",
    labelEn: "Quilting",
    sortOrder: 60,
  },
  {
    key: "production_capability.finishing",
    labelTr: "Terbiye ve apre",
    labelEn: "Finishing",
    sortOrder: 70,
  },
  {
    key: "production_capability.made_to_order_customization",
    labelTr: "Siparişe özel üretim ve özelleştirme",
    labelEn: "Made-to-order production and customization",
    sortOrder: 80,
  },
  {
    key: "production_capability.private_label_packaging",
    labelTr: "Özel marka ve ambalajlama",
    labelEn: "Private-label and packaging",
    sortOrder: 90,
  },
] as const satisfies readonly SupplierCatalogueEntry[];

export type LaunchProductionCapabilityKey =
  (typeof launchProductionCapabilities)[number]["key"];

export const launchSupplierTypeKeys = launchSupplierTypes.map((entry) => entry.key);
export const launchProductionCapabilityKeys = launchProductionCapabilities.map(
  (entry) => entry.key,
);

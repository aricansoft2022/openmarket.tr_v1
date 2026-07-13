import { describe, expect, it } from "vitest";

import {
  launchProductionCapabilities,
  launchProductionCapabilityKeys,
  launchSupplierTypeKeys,
  launchSupplierTypes,
} from "./catalogue";

function expectValidCatalogue(
  entries: readonly { key: string; labelTr: string; labelEn: string; sortOrder: number }[],
  namespace: string,
): void {
  expect(new Set(entries.map((entry) => entry.key)).size).toBe(entries.length);
  expect(new Set(entries.map((entry) => entry.sortOrder)).size).toBe(entries.length);

  for (const entry of entries) {
    expect(entry.key).toMatch(new RegExp(`^${namespace}\\.[a-z0-9_]+$`));
    expect(entry.labelTr.trim().length).toBeGreaterThanOrEqual(2);
    expect(entry.labelEn.trim().length).toBeGreaterThanOrEqual(2);
    expect(entry.sortOrder).toBeGreaterThan(0);
  }
}

describe("Supplier launch catalogue", () => {
  it("locks the specification-defined Supplier type inventory", () => {
    expect(launchSupplierTypeKeys).toEqual([
      "supplier_type.manufacturer",
      "supplier_type.manufacturer_exporter",
      "supplier_type.exporter_trading_company",
      "supplier_type.authorized_distributor",
      "supplier_type.contract_textile_project_supplier",
      "supplier_type.private_label_supplier",
    ]);
    expectValidCatalogue(launchSupplierTypes, "supplier_type");
  });

  it("locks the reviewed textile-only production capability inventory", () => {
    expect(launchProductionCapabilityKeys).toEqual([
      "production_capability.weaving",
      "production_capability.knitting",
      "production_capability.dyeing",
      "production_capability.printing",
      "production_capability.embroidery_logo",
      "production_capability.quilting",
      "production_capability.finishing",
      "production_capability.made_to_order_customization",
      "production_capability.private_label_packaging",
    ]);
    expectValidCatalogue(launchProductionCapabilities, "production_capability");
  });
});

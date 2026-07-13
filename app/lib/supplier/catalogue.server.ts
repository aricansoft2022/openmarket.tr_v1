import { notInArray, sql } from "drizzle-orm";

import type { Database } from "../db/client.server";
import { productionCapabilities, supplierTypes } from "../db/schema";
import {
  launchProductionCapabilities,
  launchProductionCapabilityKeys,
  launchSupplierTypeKeys,
  launchSupplierTypes,
} from "./catalogue";

export type SupplierCatalogueSeedResult = {
  supplierTypes: number;
  productionCapabilities: number;
};

/**
 * Restores the complete code-owned launch catalogue and archives any non-launch
 * values instead of deleting historical references.
 */
export async function seedSupplierLaunchCatalogue(
  database: Database,
  now = new Date(),
): Promise<SupplierCatalogueSeedResult> {
  return database.transaction(async (transaction) => {
    const scoped = transaction as unknown as Database;

    await scoped
      .insert(supplierTypes)
      .values(
        launchSupplierTypes.map((entry) => ({
          ...entry,
          active: true,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: supplierTypes.key,
        set: {
          labelTr: sql`excluded.label_tr`,
          labelEn: sql`excluded.label_en`,
          active: true,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
      });

    await scoped
      .update(supplierTypes)
      .set({ active: false, updatedAt: now })
      .where(notInArray(supplierTypes.key, launchSupplierTypeKeys));

    await scoped
      .insert(productionCapabilities)
      .values(
        launchProductionCapabilities.map((entry) => ({
          ...entry,
          active: true,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: productionCapabilities.key,
        set: {
          labelTr: sql`excluded.label_tr`,
          labelEn: sql`excluded.label_en`,
          active: true,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
      });

    await scoped
      .update(productionCapabilities)
      .set({ active: false, updatedAt: now })
      .where(notInArray(productionCapabilities.key, launchProductionCapabilityKeys));

    return {
      supplierTypes: launchSupplierTypes.length,
      productionCapabilities: launchProductionCapabilities.length,
    };
  });
}

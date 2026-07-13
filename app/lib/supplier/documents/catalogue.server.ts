import { notInArray, sql } from "drizzle-orm";

import type { Database } from "../../db/client.server";
import {
  supplierCompanyDocumentTypes as documentTypeTable,
  supplierDocumentRequirementRules as requirementRuleTable,
} from "../../db/schema";
import {
  supplierCompanyDocumentTypeKeys,
  supplierCompanyDocumentTypes,
  supplierDocumentRequirementRules,
} from "./catalogue";

export type SupplierDocumentCatalogueSeedResult = {
  documentTypes: number;
  requirementRules: number;
};

export async function seedSupplierDocumentCatalogue(
  database: Database,
  now = new Date(),
): Promise<SupplierDocumentCatalogueSeedResult> {
  return database.transaction(async (transaction) => {
    const scoped = transaction as unknown as Database;

    await scoped
      .insert(documentTypeTable)
      .values(
        supplierCompanyDocumentTypes.map((entry) => ({
          ...entry,
          active: true,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: documentTypeTable.key,
        set: {
          labelTr: sql`excluded.label_tr`,
          labelEn: sql`excluded.label_en`,
          descriptionTr: sql`excluded.description_tr`,
          descriptionEn: sql`excluded.description_en`,
          publicEligible: sql`excluded.public_eligible`,
          expiryExpected: sql`excluded.expiry_expected`,
          active: true,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
      });

    await scoped
      .update(documentTypeTable)
      .set({ active: false, updatedAt: now })
      .where(notInArray(documentTypeTable.key, supplierCompanyDocumentTypeKeys));

    await scoped
      .insert(requirementRuleTable)
      .values(
        supplierDocumentRequirementRules.map((rule) => ({
          key: rule.key,
          documentTypeKey: rule.documentTypeKey,
          supplierTypeKey: rule.supplierTypeKey,
          level: rule.level,
          noteTr: rule.noteTr,
          noteEn: rule.noteEn,
          active: true,
          sortOrder: rule.sortOrder,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: requirementRuleTable.key,
        set: {
          documentTypeKey: sql`excluded.document_type_key`,
          supplierTypeKey: sql`excluded.supplier_type_key`,
          level: sql`excluded.level`,
          noteTr: sql`excluded.note_tr`,
          noteEn: sql`excluded.note_en`,
          active: true,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
      });

    const activeRuleKeys = supplierDocumentRequirementRules.map((rule) => rule.key);
    await scoped
      .update(requirementRuleTable)
      .set({ active: false, updatedAt: now })
      .where(notInArray(requirementRuleTable.key, activeRuleKeys));

    return {
      documentTypes: supplierCompanyDocumentTypes.length,
      requirementRules: supplierDocumentRequirementRules.length,
    };
  });
}

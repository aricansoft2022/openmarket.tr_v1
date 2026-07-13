import { describe, expect, it } from "vitest";

import { supplierCopy } from "./copy";
import { supplierScreenCopy } from "./screen-copy";

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectStrings);
}

describe("Supplier bilingual screen copy", () => {
  it("provides complete Turkish-first and English screen contracts", () => {
    for (const language of ["tr", "en"] as const) {
      const strings = collectStrings(supplierScreenCopy(language));
      expect(strings.length).toBeGreaterThan(80);
      expect(strings.every((value) => value.trim().length > 0)).toBe(true);
    }
  });

  it("switches shell, checklist and form errors with the account preference", () => {
    expect(supplierCopy("tr").shell.overview).toBe("Genel bakış");
    expect(supplierCopy("en").shell.overview).toBe("Overview");
    expect(supplierCopy("tr").checklist.identity.label).toBe("İş kimliğini doğrula");
    expect(supplierCopy("en").checklist.identity.label).toBe("Verify business identity");
    expect(supplierCopy("tr").formErrors.forbidden).toContain("düzenleyemez");
    expect(supplierCopy("en").formErrors.forbidden).toContain("cannot edit");
  });

  it("keeps activation and document boundaries explicit in both languages", () => {
    expect(supplierScreenCopy("tr").overview.inactiveDescription).toContain("belge onayından");
    expect(supplierScreenCopy("en").overview.inactiveDescription).toContain("document approval");
    expect(supplierScreenCopy("tr").common.draftBoundary).toContain("aktifleştirmez");
    expect(supplierScreenCopy("en").common.draftBoundary).toContain("does not automatically activate");
  });
});

import { describe, expect, it } from "vitest";

import { supplierDocumentCopy, supplierDocumentStateLabel } from "./copy";

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectStrings);
}

describe("Supplier document bilingual copy", () => {
  it("provides non-empty Turkish and English document lifecycle contracts", () => {
    for (const language of ["tr", "en"] as const) {
      const strings = collectStrings(supplierDocumentCopy(language));
      expect(strings.length).toBeGreaterThan(55);
      expect(strings.every((value) => value.trim().length > 0)).toBe(true);
    }
  });

  it("labels every derived lifecycle state in both languages", () => {
    const states = [
      "missing",
      "uploaded",
      "pending_review",
      "approved",
      "rejected",
      "expired",
      "replacement_required",
    ] as const;

    for (const state of states) {
      expect(supplierDocumentStateLabel("tr", state)).not.toBe(
        supplierDocumentStateLabel("en", state),
      );
    }
  });

  it("keeps private scan and immutable review boundaries explicit", () => {
    expect(supplierDocumentCopy("tr").documents.scannerNotice).toContain("güvenlik taraması");
    expect(supplierDocumentCopy("en").documents.scannerNotice).toContain("security scan");
    expect(supplierDocumentCopy("tr").review.description).toContain("immutable");
    expect(supplierDocumentCopy("en").review.description).toContain("immutable");
  });
});

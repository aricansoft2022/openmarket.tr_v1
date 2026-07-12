import { describe, expect, it } from "vitest";

import {
  EvidenceValidationError,
  maximumEvidenceBytes,
  safeDownloadFilename,
  validateEvidenceFile,
} from "./evidence";

describe("business identity evidence validation", () => {
  it("accepts the fixed private evidence MIME types", () => {
    expect(
      validateEvidenceFile({ name: "registry.pdf", type: "application/pdf", size: 2048 }),
    ).toEqual({
      filename: "registry.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
    });
  });

  it("rejects unsupported, empty and oversized files", () => {
    expect(() =>
      validateEvidenceFile({ name: "evidence.svg", type: "image/svg+xml", size: 10 }),
    ).toThrow(EvidenceValidationError);
    expect(() =>
      validateEvidenceFile({ name: "empty.pdf", type: "application/pdf", size: 0 }),
    ).toThrow(EvidenceValidationError);
    expect(() =>
      validateEvidenceFile({
        name: "large.pdf",
        type: "application/pdf",
        size: maximumEvidenceBytes + 1,
      }),
    ).toThrow(EvidenceValidationError);
  });

  it("sanitizes download filenames without using them as storage keys", () => {
    expect(safeDownloadFilename("../company\nregistry.pdf")).toBe("..-company-registry.pdf");
  });
});

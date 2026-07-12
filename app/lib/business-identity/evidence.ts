export const evidenceMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
export type EvidenceMimeType = (typeof evidenceMimeTypes)[number];

export const maximumEvidenceBytes = 10 * 1024 * 1024;
export const maximumEvidenceFilesPerReview = 5;

export type EvidenceFileInput = {
  name: string;
  type: string;
  size: number;
};

export class EvidenceValidationError extends Error {
  constructor(
    public readonly code:
      | "FILE_REQUIRED"
      | "FILENAME_INVALID"
      | "MIME_NOT_ALLOWED"
      | "FILE_EMPTY"
      | "FILE_TOO_LARGE",
    message: string,
  ) {
    super(message);
    this.name = "EvidenceValidationError";
  }
}

export function validateEvidenceFile(input: EvidenceFileInput): {
  filename: string;
  mimeType: EvidenceMimeType;
  sizeBytes: number;
} {
  const filename = input.name.trim();
  if (!filename) {
    throw new EvidenceValidationError("FILE_REQUIRED", "Bir belge seçin.");
  }
  if (filename.length > 180 || /[\u0000-\u001f\u007f]/.test(filename)) {
    throw new EvidenceValidationError("FILENAME_INVALID", "Dosya adı geçerli değil.");
  }
  if (!evidenceMimeTypes.includes(input.type as EvidenceMimeType)) {
    throw new EvidenceValidationError(
      "MIME_NOT_ALLOWED",
      "Yalnız PDF, JPEG veya PNG dosyaları kabul edilir.",
    );
  }
  if (input.size < 1) {
    throw new EvidenceValidationError("FILE_EMPTY", "Boş dosya yüklenemez.");
  }
  if (input.size > maximumEvidenceBytes) {
    throw new EvidenceValidationError("FILE_TOO_LARGE", "Dosya 10 MiB sınırını aşıyor.");
  }

  return {
    filename,
    mimeType: input.type as EvidenceMimeType,
    sizeBytes: input.size,
  };
}

export function safeDownloadFilename(filename: string): string {
  const normalized = filename
    .normalize("NFKC")
    .replace(/[\\/\r\n\t\u0000-\u001f\u007f]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return (normalized || "business-identity-evidence").slice(0, 180);
}

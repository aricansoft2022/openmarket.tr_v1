import type { LaunchSupplierTypeKey } from "../catalogue";
import {
  supplierCompanyDocumentTypes,
  supplierDocumentRequirementRules,
  type SupplierCompanyDocumentTypeKey,
  type SupplierDocumentRequirementLevel,
} from "./catalogue";

export const supplierDocumentMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
export type SupplierDocumentMimeType = (typeof supplierDocumentMimeTypes)[number];
export const maximumSupplierDocumentBytes = 10 * 1024 * 1024;
export const supplierDocumentAccessGrantMinutes = 5;

export type SupplierDocumentFileInput = {
  name: string;
  type: string;
  size: number;
};

export class SupplierDocumentValidationError extends Error {
  constructor(
    public readonly code:
      | "FILE_REQUIRED"
      | "FILENAME_INVALID"
      | "MIME_NOT_ALLOWED"
      | "FILE_EMPTY"
      | "FILE_TOO_LARGE"
      | "DOCUMENT_TYPE_UNKNOWN"
      | "EXPIRY_REQUIRED"
      | "EXPIRY_INVALID"
      | "REASON_REQUIRED",
    message: string,
  ) {
    super(message);
    this.name = "SupplierDocumentValidationError";
  }
}

export type ResolvedSupplierDocumentRequirement = {
  documentTypeKey: SupplierCompanyDocumentTypeKey;
  level: SupplierDocumentRequirementLevel;
  sourceRuleKeys: string[];
  noteTr: string;
  noteEn: string;
};

const levelPriority: Record<SupplierDocumentRequirementLevel, number> = {
  mandatory: 3,
  conditional: 2,
  optional: 1,
};

export function resolveSupplierDocumentRequirements(
  supplierTypeKeys: readonly LaunchSupplierTypeKey[],
): ResolvedSupplierDocumentRequirement[] {
  const activeTypes = new Set(supplierTypeKeys);
  const resolved = new Map<SupplierCompanyDocumentTypeKey, ResolvedSupplierDocumentRequirement>();

  for (const rule of supplierDocumentRequirementRules) {
    if (rule.supplierTypeKey && !activeTypes.has(rule.supplierTypeKey)) continue;
    const current = resolved.get(rule.documentTypeKey);
    if (!current || levelPriority[rule.level] > levelPriority[current.level]) {
      resolved.set(rule.documentTypeKey, {
        documentTypeKey: rule.documentTypeKey,
        level: rule.level,
        sourceRuleKeys: [rule.key],
        noteTr: rule.noteTr,
        noteEn: rule.noteEn,
      });
      continue;
    }
    if (levelPriority[rule.level] === levelPriority[current.level]) {
      current.sourceRuleKeys.push(rule.key);
    }
  }

  return [...resolved.values()].sort((left, right) => {
    const leftType = supplierCompanyDocumentTypes.find((entry) => entry.key === left.documentTypeKey)!;
    const rightType = supplierCompanyDocumentTypes.find((entry) => entry.key === right.documentTypeKey)!;
    return leftType.sortOrder - rightType.sortOrder || left.documentTypeKey.localeCompare(right.documentTypeKey);
  });
}

export function validateSupplierDocumentFile(input: SupplierDocumentFileInput): {
  filename: string;
  mimeType: SupplierDocumentMimeType;
  sizeBytes: number;
} {
  const filename = input.name.trim();
  if (!filename) {
    throw new SupplierDocumentValidationError("FILE_REQUIRED", "Bir şirket belgesi seçin.");
  }
  if (filename.length > 180 || /[\u0000-\u001f\u007f]/.test(filename)) {
    throw new SupplierDocumentValidationError("FILENAME_INVALID", "Dosya adı geçerli değil.");
  }
  if (!supplierDocumentMimeTypes.includes(input.type as SupplierDocumentMimeType)) {
    throw new SupplierDocumentValidationError(
      "MIME_NOT_ALLOWED",
      "Yalnız PDF, JPEG veya PNG şirket belgeleri kabul edilir.",
    );
  }
  if (input.size < 1) {
    throw new SupplierDocumentValidationError("FILE_EMPTY", "Boş dosya yüklenemez.");
  }
  if (input.size > maximumSupplierDocumentBytes) {
    throw new SupplierDocumentValidationError("FILE_TOO_LARGE", "Dosya 10 MiB sınırını aşıyor.");
  }
  return { filename, mimeType: input.type as SupplierDocumentMimeType, sizeBytes: input.size };
}

export function validateSupplierDocumentMetadata(input: {
  documentTypeKey: string;
  issueDate?: Date | null;
  expiresAt?: Date | null;
}): {
  documentTypeKey: SupplierCompanyDocumentTypeKey;
  issueDate: Date | null;
  expiresAt: Date | null;
} {
  const type = supplierCompanyDocumentTypes.find((entry) => entry.key === input.documentTypeKey);
  if (!type) {
    throw new SupplierDocumentValidationError(
      "DOCUMENT_TYPE_UNKNOWN",
      "Belge türü aktif şirket-belgesi kataloğunda değil.",
    );
  }
  const issueDate = input.issueDate ?? null;
  const expiresAt = input.expiresAt ?? null;
  if (type.expiryExpected && !expiresAt) {
    throw new SupplierDocumentValidationError(
      "EXPIRY_REQUIRED",
      "Bu belge türü için son geçerlilik tarihi gereklidir.",
    );
  }
  if (issueDate && expiresAt && expiresAt <= issueDate) {
    throw new SupplierDocumentValidationError(
      "EXPIRY_INVALID",
      "Belge son geçerlilik tarihi düzenlenme tarihinden sonra olmalıdır.",
    );
  }
  return { documentTypeKey: type.key, issueDate, expiresAt };
}

export function validatedSupplierDocumentReason(value: string): string {
  const reason = value.trim();
  if (reason.length < 3 || reason.length > 2000) {
    throw new SupplierDocumentValidationError(
      "REASON_REQUIRED",
      "İnceleme kararı için 3–2000 karakter arasında gerekçe gereklidir.",
    );
  }
  return reason;
}

export type SupplierDocumentDerivedState =
  | "missing"
  | "uploaded"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired"
  | "replacement_required";

export function deriveSupplierDocumentState(input: {
  storageStatus?: "uploading" | "stored_private" | "failed" | "removed" | null;
  evidenceStatus?: "uploaded" | "pending_review" | "approved" | "rejected" | "expired" | "replacement_required" | null;
  scanStatus?: "pending" | "clean" | "rejected" | "failed" | null;
  expiresAt?: Date | null;
  now?: Date;
}): SupplierDocumentDerivedState {
  if (!input.storageStatus || input.storageStatus === "failed" || input.storageStatus === "removed") {
    return "missing";
  }
  if (input.expiresAt && input.expiresAt <= (input.now ?? new Date())) return "expired";
  if (input.scanStatus === "rejected" || input.scanStatus === "failed") return "replacement_required";
  return input.evidenceStatus ?? "uploaded";
}

export function requirementIsSatisfied(
  level: SupplierDocumentRequirementLevel,
  state: SupplierDocumentDerivedState,
): boolean {
  if (level !== "mandatory") return true;
  return state === "approved";
}

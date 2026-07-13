import type { PreferredLanguage } from "../../db/schema";
import { StaffAuthorizationError } from "../../authorization/platform-staff.server";
import { SupplierDocumentValidationError } from "./policy";
import { SupplierDocumentActionError } from "./service.server";

const messages = {
  tr: {
    FILE_REQUIRED: "Bir şirket belgesi seçin.",
    FILENAME_INVALID: "Dosya adı geçerli değil.",
    MIME_NOT_ALLOWED: "Yalnız PDF, JPEG veya PNG dosyaları kabul edilir.",
    FILE_EMPTY: "Boş dosya yüklenemez.",
    FILE_TOO_LARGE: "Dosya 10 MiB sınırını aşıyor.",
    DOCUMENT_TYPE_UNKNOWN: "Belge türü etkin katalogda değil.",
    EXPIRY_INVALID: "Son geçerlilik tarihi düzenlenme tarihinden sonra olmalıdır.",
    REASON_REQUIRED: "Karar için 3–2000 karakter arasında gerekçe gereklidir.",
    UNAUTHENTICATED: "Oturumunuz sona erdi. Yeniden giriş yapın.",
    SUPPLIER_COMPANY_NOT_FOUND: "Supplier şirketi bulunamadı veya erişiminiz yok.",
    FORBIDDEN: "Bu işlem için yetkiniz yok.",
    DOCUMENT_NOT_FOUND: "Belge bulunamadı veya erişiminiz yok.",
    REPLACEMENT_INVALID: "Yenileme aynı şirket ve belge türünün önceki sürümüne bağlanmalıdır.",
    STORAGE_FAILED: "Özel belge depolaması tamamlanamadı.",
    SCAN_PENDING: "Güvenlik taraması tamamlanmadan incelemeye gönderilemez.",
    SCAN_FAILED: "Tarama başarısız veya güvensiz; belge incelemeye gönderilemez.",
    INVALID_TRANSITION: "Belge bu durumdan istenen işleme geçirilemez.",
    PUBLIC_VISIBILITY_FORBIDDEN: "Yalnız onaylı ve herkese açık gösterime uygun belgeler yayınlanabilir.",
    ACCESS_GRANT_INVALID: "Özel erişim bağlantısı geçersiz veya süresi dolmuş.",
    SELF_REVIEW: "Kendi yüklediğiniz belge için inceleme kararı veremezsiniz.",
  },
  en: {
    FILE_REQUIRED: "Select a company document.",
    FILENAME_INVALID: "The filename is invalid.",
    MIME_NOT_ALLOWED: "Only PDF, JPEG or PNG files are accepted.",
    FILE_EMPTY: "An empty file cannot be uploaded.",
    FILE_TOO_LARGE: "The file exceeds the 10 MiB limit.",
    DOCUMENT_TYPE_UNKNOWN: "The document type is not in the active catalogue.",
    EXPIRY_INVALID: "The expiry date must be later than the issue date.",
    REASON_REQUIRED: "A decision reason of 3–2000 characters is required.",
    UNAUTHENTICATED: "Your session ended. Sign in again.",
    SUPPLIER_COMPANY_NOT_FOUND: "The Supplier company was not found or is not accessible.",
    FORBIDDEN: "You do not have permission for this action.",
    DOCUMENT_NOT_FOUND: "The document was not found or is not accessible.",
    REPLACEMENT_INVALID: "A replacement must link to a prior version of the same company and type.",
    STORAGE_FAILED: "Private document storage could not be completed.",
    SCAN_PENDING: "The document cannot be submitted before the security scan finishes.",
    SCAN_FAILED: "The scan failed or was unsafe; the document cannot be submitted.",
    INVALID_TRANSITION: "The document cannot move from its current state to the requested action.",
    PUBLIC_VISIBILITY_FORBIDDEN: "Only approved, publicly eligible documents can be published.",
    ACCESS_GRANT_INVALID: "The private access link is invalid or expired.",
    SELF_REVIEW: "You cannot decide a document that you uploaded.",
  },
} as const;

export function supplierDocumentErrorMessage(
  error: unknown,
  language: PreferredLanguage,
): string | null {
  if (error instanceof SupplierDocumentValidationError) {
    return messages[language][error.code];
  }
  if (error instanceof SupplierDocumentActionError) {
    return messages[language][error.code];
  }
  if (error instanceof StaffAuthorizationError) {
    if (error.code === "SELF_REVIEW") return messages[language].SELF_REVIEW;
    if (error.code === "UNAUTHENTICATED") return messages[language].UNAUTHENTICATED;
    return messages[language].FORBIDDEN;
  }
  return null;
}

import type { PreferredLanguage } from "../../db/schema";
import type { SupplierDocumentDerivedState } from "./policy";

const copy = {
  tr: {
    states: {
      missing: "Eksik",
      uploaded: "Yüklendi",
      pending_review: "İnceleme bekliyor",
      approved: "Onaylandı",
      rejected: "Reddedildi",
      expired: "Süresi doldu",
      replacement_required: "Yenileme gerekli",
    },
    levels: {
      mandatory: "Zorunlu",
      conditional: "Koşullu",
      optional: "İsteğe bağlı",
    },
    documents: {
      title: "Şirket belgeleri",
      description:
        "Aktivasyon için gereken şirket belgelerini, inceleme durumlarını ve yenileme geçmişini yönetin.",
      upload: "Belge yükle",
      complete: "zorunlu belge onaylandı",
      blocker: "açık zorunlu belge engeli",
      scannerNotice:
        "Yüklenen dosya, güvenlik taraması temiz sonuçlanmadan incelemeye gönderilemez.",
      noRequirements: "Bu Supplier türleri için etkin belge gereksinimi bulunamadı.",
      viewHistory: "Belgeyi ve geçmişi görüntüle",
      uploadFirst: "İlk sürümü yükle",
      replace: "Yeni sürüm yükle",
    },
    upload: {
      title: "Şirket belgesi yükle",
      description:
        "PDF, JPEG veya PNG dosyaları özel depolamada tutulur. Maksimum dosya boyutu 10 MiB’dir.",
      type: "Belge türü",
      file: "Dosya",
      issueDate: "Düzenlenme tarihi",
      expiryDate: "Son geçerlilik tarihi",
      expiryHint: "Yalnız belgede geçerlilik tarihi varsa girin.",
      retentionDate: "Saklama sonu",
      retentionHint: "Boş bırakılırsa kurumsal saklama politikası daha sonra uygulanır.",
      submit: "Özel depolamaya yükle",
      submitting: "Yükleniyor…",
      noCompany: "Önce Supplier şirket profilini oluşturun.",
      readOnly: "Bu üyelik şirket belgesi yükleyemez.",
      success:
        "Belge özel depolamaya alındı. Güvenlik taraması tamamlanınca incelemeye gönderilebilir.",
      failure: "Belge yüklenemedi. Dosya ve metadata alanlarını kontrol edin.",
    },
    detail: {
      title: "Belge ayrıntısı ve geçmişi",
      version: "Sürüm",
      file: "Dosya",
      size: "Boyut",
      scan: "Güvenlik taraması",
      issueDate: "Düzenlenme",
      expiryDate: "Geçerlilik sonu",
      submitted: "İncelemeye gönderildi",
      download: "Özel erişim bağlantısı oluştur",
      submitReview: "İncelemeye gönder",
      publicOn: "Onaylı destekleyici belgeyi herkese açık göster",
      publicOff: "Herkese açık görünürlüğü kapat",
      replacement: "Yeni sürüm yükle",
      timeline: "İnceleme geçmişi",
      noTimeline: "Henüz inceleme kararı yok.",
      pendingScan: "Güvenlik taraması bekleniyor.",
      failedScan: "Tarama başarısız; inceleme gönderimi kapalıdır.",
      stored: "Özel depolamada",
      notFound: "Belge bulunamadı veya bu şirkete erişiminiz yok.",
    },
    reviewQueue: {
      title: "Supplier belge inceleme kuyruğu",
      description: "Temiz taramadan geçmiş ve incelemeye gönderilmiş özel şirket belgeleri.",
      empty: "İnceleme bekleyen Supplier şirket belgesi yok.",
      company: "Şirket",
      type: "Belge türü",
      submitted: "Gönderim",
      review: "İncele",
    },
    review: {
      title: "Supplier şirket belgesini incele",
      description:
        "Belge özel kalır. Karar için zorunlu gerekçe ve etkili platform rolü immutable kayda yazılır.",
      approve: "Onayla",
      reject: "Reddet",
      replacement: "Yenileme iste",
      reason: "Karar gerekçesi",
      note: "İnceleme notu",
      download: "Özel belgeyi indir",
      timeline: "Karar geçmişi",
      decide: "Kararı kaydet",
      deciding: "Kaydediliyor…",
      noDocument: "Belge bulunamadı.",
    },
  },
  en: {
    states: {
      missing: "Missing",
      uploaded: "Uploaded",
      pending_review: "Pending review",
      approved: "Approved",
      rejected: "Rejected",
      expired: "Expired",
      replacement_required: "Replacement required",
    },
    levels: {
      mandatory: "Mandatory",
      conditional: "Conditional",
      optional: "Optional",
    },
    documents: {
      title: "Company documents",
      description:
        "Manage company documents required for activation, their review states and replacement history.",
      upload: "Upload document",
      complete: "mandatory documents approved",
      blocker: "open mandatory document blockers",
      scannerNotice:
        "An uploaded file cannot be submitted for review until the security scan returns clean.",
      noRequirements: "No active document requirements were resolved for these Supplier types.",
      viewHistory: "View document and history",
      uploadFirst: "Upload first version",
      replace: "Upload new version",
    },
    upload: {
      title: "Upload company document",
      description:
        "PDF, JPEG and PNG files are stored privately. The maximum file size is 10 MiB.",
      type: "Document type",
      file: "File",
      issueDate: "Issue date",
      expiryDate: "Expiry date",
      expiryHint: "Enter only when the document carries an expiry date.",
      retentionDate: "Retention until",
      retentionHint: "Leave empty until the organizational retention policy is applied.",
      submit: "Upload to private storage",
      submitting: "Uploading…",
      noCompany: "Create the Supplier company profile first.",
      readOnly: "This membership cannot upload company documents.",
      success:
        "The document was stored privately. It can be submitted after the security scan completes.",
      failure: "The document could not be uploaded. Check the file and metadata fields.",
    },
    detail: {
      title: "Document detail and history",
      version: "Version",
      file: "File",
      size: "Size",
      scan: "Security scan",
      issueDate: "Issued",
      expiryDate: "Expires",
      submitted: "Submitted for review",
      download: "Create private access link",
      submitReview: "Submit for review",
      publicOn: "Show approved supporting document publicly",
      publicOff: "Disable public visibility",
      replacement: "Upload new version",
      timeline: "Review history",
      noTimeline: "No review decision has been recorded.",
      pendingScan: "Security scan is pending.",
      failedScan: "The scan failed; review submission is disabled.",
      stored: "Stored privately",
      notFound: "The document was not found or you cannot access this company.",
    },
    reviewQueue: {
      title: "Supplier document review queue",
      description: "Private company documents with a clean scan that were submitted for review.",
      empty: "No Supplier company documents are waiting for review.",
      company: "Company",
      type: "Document type",
      submitted: "Submitted",
      review: "Review",
    },
    review: {
      title: "Review Supplier company document",
      description:
        "The document remains private. The required decision reason and effective platform role are written to immutable history.",
      approve: "Approve",
      reject: "Reject",
      replacement: "Request replacement",
      reason: "Decision reason",
      note: "Review note",
      download: "Download private document",
      timeline: "Decision history",
      decide: "Save decision",
      deciding: "Saving…",
      noDocument: "Document not found.",
    },
  },
} as const;

export function supplierDocumentCopy(language: PreferredLanguage) {
  return copy[language];
}

export function supplierDocumentStateLabel(
  language: PreferredLanguage,
  state: SupplierDocumentDerivedState,
): string {
  return supplierDocumentCopy(language).states[state];
}

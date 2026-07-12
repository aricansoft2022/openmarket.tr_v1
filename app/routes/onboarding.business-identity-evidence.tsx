import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import { OnboardingShell } from "~/components/onboarding-shell";
import {
  EvidenceActionError,
  listBusinessIdentityEvidence,
  removeBusinessIdentityEvidence,
  uploadBusinessIdentityEvidence,
} from "~/lib/business-identity/evidence.server";
import {
  EvidenceValidationError,
  maximumEvidenceFilesPerReview,
  maximumEvidenceBytes,
} from "~/lib/business-identity/evidence";

import type { Route } from "./+types/onboarding.business-identity-evidence";

type ActionData = { error?: string };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Manuel istisna belgeleri — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const evidence = await listBusinessIdentityEvidence(env, request);
  if (!evidence) throw redirect("/auth/login");
  if (!evidence.reviewId) throw redirect("/onboarding/business-identity/status");
  if (evidence.reviewStatus !== "pending" && evidence.reviewStatus !== "rejected") {
    throw redirect("/onboarding/business-identity/status");
  }

  const url = new URL(request.url);
  return {
    ...evidence,
    uploaded: url.searchParams.get("uploaded") === "1",
    removed: url.searchParams.get("removed") === "1",
  };
}

function publicEvidenceError(error: unknown): { message: string; status: number } {
  if (error instanceof EvidenceValidationError) {
    return { message: error.message, status: 400 };
  }
  if (error instanceof EvidenceActionError) {
    if (error.code === "UNAUTHENTICATED") {
      return { message: "Oturumunuz sona erdi. Yeniden giriş yapın.", status: 401 };
    }
    if (error.code === "FILE_LIMIT_REACHED") {
      return {
        message: `Bir başvuruya en fazla ${maximumEvidenceFilesPerReview} belge eklenebilir.`,
        status: 409,
      };
    }
    if (error.code === "REVIEW_NOT_ELIGIBLE") {
      return { message: "Bu başvuru artık belge değişikliğine açık değil.", status: 409 };
    }
    if (error.code === "EVIDENCE_NOT_FOUND") {
      return { message: "Belge bulunamadı veya bu hesaba ait değil.", status: 404 };
    }
  }
  return { message: "Belge işlemi tamamlanamadı. Lütfen yeniden deneyin.", status: 503 };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "upload") {
      const value = formData.get("file");
      if (!(value instanceof File)) {
        throw new EvidenceValidationError("FILE_REQUIRED", "Bir belge seçin.");
      }
      await uploadBusinessIdentityEvidence(env, request, value);
      return redirect("/onboarding/business-identity/evidence?uploaded=1");
    }

    if (intent === "remove") {
      const evidenceId = formData.get("evidenceId");
      if (typeof evidenceId !== "string" || !evidenceId) {
        return data<ActionData>({ error: "Silinecek belge seçilmedi." }, { status: 400 });
      }
      await removeBusinessIdentityEvidence(env, request, evidenceId);
      return redirect("/onboarding/business-identity/evidence?removed=1");
    }

    return data<ActionData>({ error: "Geçersiz belge işlemi." }, { status: 400 });
  } catch (error) {
    const publicError = publicEvidenceError(error);
    if (publicError.status === 401) throw redirect("/auth/login");
    return data<ActionData>({ error: publicError.message }, { status: publicError.status });
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export default function BusinessIdentityEvidence({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const activeCount = loaderData.files.filter(
    (file) => file.status === "uploading" || file.status === "stored_private",
  ).length;
  const full = activeCount >= maximumEvidenceFilesPerReview;

  return (
    <OnboardingShell
      current="A10"
      title="Manuel inceleme belgelerinizi ekleyin."
      description="Belgeler public URL almaz. Yalnız başvuru sahibi ve ileride yetkilendirilecek reviewer/admin akışları erişebilir."
    >
      <div className="identity-grid">
        <div className="auth-form">
          {loaderData.uploaded ? (
            <div className="form-alert" role="status">
              Belge private depoya kaydedildi. Bu işlem başvuruyu otomatik onaylamaz.
            </div>
          ) : null}
          {loaderData.removed ? (
            <div className="form-alert" role="status">
              Belge erişimden kaldırıldı.
            </div>
          ) : null}
          {actionData?.error ? (
            <div className="form-alert" role="alert">
              {actionData.error}
            </div>
          ) : null}

          <Form method="post" encType="multipart/form-data" className="auth-form">
            <input type="hidden" name="intent" value="upload" />
            <div className="field-group">
              <label htmlFor="file">Belge</label>
              <input
                id="file"
                name="file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                disabled={full || submitting}
                required
              />
              <p className="form-note">
                PDF, JPEG veya PNG · En fazla {(maximumEvidenceBytes / (1024 * 1024)).toFixed(0)}{" "}
                MiB · Başvuru başına {maximumEvidenceFilesPerReview} dosya
              </p>
            </div>
            <button
              className="button button--primary auth-submit"
              type="submit"
              disabled={full || submitting}
            >
              {submitting
                ? "Belge kaydediliyor…"
                : full
                  ? "Dosya sınırına ulaşıldı"
                  : "Private belge yükle"}
            </button>
          </Form>

          <section className="evidence-list" aria-labelledby="evidence-list-heading">
            <div>
              <p className="eyebrow">Private evidence</p>
              <h2 id="evidence-list-heading">Yüklenen belgeler</h2>
            </div>
            {loaderData.files.length === 0 ? (
              <p className="form-note">Henüz belge eklenmedi.</p>
            ) : (
              <ul>
                {loaderData.files.map((file) => (
                  <li key={file.id}>
                    <div>
                      <strong>{file.originalFilename}</strong>
                      <span>
                        {formatBytes(file.sizeBytes)} · {file.status}
                      </span>
                    </div>
                    <div className="evidence-actions">
                      {file.status === "stored_private" ? (
                        <Link
                          className="button"
                          to={`/onboarding/business-identity/evidence/${file.id}/download`}
                          reloadDocument
                        >
                          İndir
                        </Link>
                      ) : null}
                      <Form method="post">
                        <input type="hidden" name="intent" value="remove" />
                        <input type="hidden" name="evidenceId" value={file.id} />
                        <button className="button" type="submit" disabled={submitting}>
                          Kaldır
                        </button>
                      </Form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="identity-sidebar">
          <section className="domain-explanation">
            <p className="eyebrow">Güvenlik sınırı</p>
            <h2>Private saklama, onay değildir.</h2>
            <ul>
              <li>Dosya adı R2 object key olarak kullanılmaz.</li>
              <li>SHA-256, MIME türü ve boyut PostgreSQL metadata’sında tutulur.</li>
              <li>İndirme public URL yerine session sahiplik kontrolünden geçer.</li>
              <li>Belge yüklemek Buyer veya Supplier aktivasyonu açmaz.</li>
              <li>Reviewer yetkisi ve tarama/inceleme sonucu sonraki dilimde eklenir.</li>
            </ul>
          </section>
          <Link className="button" to="/onboarding/business-identity/status">
            Başvuru durumuna dön
          </Link>
        </aside>
      </div>
    </OnboardingShell>
  );
}

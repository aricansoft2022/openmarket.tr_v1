import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import { StaffAuthorizationError } from "~/lib/authorization/platform-staff.server";
import {
  decidePermissionedBusinessIdentityReview,
  loadBusinessIdentityReviewDetail,
} from "~/lib/business-identity/review.server";
import { BusinessIdentityTransitionError } from "~/lib/business-identity/transitions.server";

import type { Route } from "./+types/admin.business-identity-review-detail";

type ActionData = { error?: string };

export function meta({}: Route.MetaArgs) {
  return [{ title: "İş kimliği incelemesi — OpenMarket.tr" }];
}

function loginRedirect(reviewId: string) {
  return redirect(
    `/auth/login?returnTo=${encodeURIComponent(`/admin/business-identity/reviews/${reviewId}`)}`,
  );
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const reviewId = params.reviewId;
  if (!reviewId) throw new Response("Not found", { status: 404 });

  try {
    const context = await loadBusinessIdentityReviewDetail(env, request, reviewId);
    return { access: "granted" as const, ...context };
  } catch (error) {
    if (error instanceof StaffAuthorizationError) {
      if (error.code === "UNAUTHENTICATED") throw loginRedirect(reviewId);
      return data({ access: "denied" as const }, { status: 403 });
    }
    if (error instanceof BusinessIdentityTransitionError && error.code === "REVIEW_NOT_FOUND") {
      throw new Response("Pending review not found", { status: 404 });
    }
    throw error;
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const reviewId = params.reviewId;
  if (!reviewId) return data<ActionData>({ error: "İnceleme bulunamadı." }, { status: 404 });

  const formData = await request.formData();
  const decision = formData.get("decision");
  const reviewNote = formData.get("reviewNote");
  const rejectionReason = formData.get("rejectionReason");

  if (decision !== "verified" && decision !== "rejected") {
    return data<ActionData>({ error: "Geçerli bir karar seçin." }, { status: 400 });
  }
  if (typeof reviewNote !== "string" || reviewNote.trim().length < 3) {
    return data<ActionData>(
      { error: "İnceleme notu en az 3 karakter olmalıdır." },
      { status: 400 },
    );
  }
  if (
    decision === "rejected" &&
    (typeof rejectionReason !== "string" || rejectionReason.trim().length < 3)
  ) {
    return data<ActionData>({ error: "Red kararı için gerekçe zorunludur." }, { status: 400 });
  }

  try {
    await decidePermissionedBusinessIdentityReview(env, request, {
      reviewId,
      decision,
      reviewNote,
      rejectionReason: typeof rejectionReason === "string" ? rejectionReason : undefined,
    });
    return redirect(`/admin/business-identity/reviews?decided=${decision}`);
  } catch (error) {
    if (error instanceof StaffAuthorizationError) {
      if (error.code === "UNAUTHENTICATED") throw loginRedirect(reviewId);
      return data<ActionData>(
        {
          error:
            error.code === "SELF_REVIEW"
              ? "Kendi iş kimliği başvurunuz hakkında karar veremezsiniz."
              : "Bu kararı vermek için aktif Reviewer veya yönetici yetkisi gerekir.",
        },
        { status: 403 },
      );
    }
    if (error instanceof BusinessIdentityTransitionError) {
      return data<ActionData>({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export default function BusinessIdentityReviewDetail({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  if (loaderData.access === "denied") {
    return (
      <main className="staff-review staff-review--centered">
        <p className="eyebrow">X04 · Yetki reddedildi</p>
        <h1>Bu başvuruyu inceleyemezsiniz.</h1>
        <p>
          Yetkiniz bulunmuyor, atamanız kaldırılmış veya başvuru size ait olabilir. Arayüz
          görünürlüğü hiçbir zaman sunucu yetkilendirmesinin yerine geçmez.
        </p>
        <Link className="button" to="/admin/business-identity/reviews">
          Kuyruğa dön
        </Link>
      </main>
    );
  }

  const review = loaderData.value;

  return (
    <main className="staff-review">
      <header className="staff-review__header">
        <div>
          <p className="eyebrow">İş kimliği · Bekleyen inceleme</p>
          <h1>{review.companyName}</h1>
          <p>
            Etkin rol: <strong>{loaderData.effectiveRole}</strong> · Gönderim:{" "}
            {formatDate(review.submittedAt)}
          </p>
        </div>
        <Link className="button" to="/admin/business-identity/reviews">
          Kuyruğa dön
        </Link>
      </header>

      {actionData?.error ? (
        <div className="form-alert" role="alert">
          {actionData.error}
        </div>
      ) : null}

      <div className="staff-review__grid">
        <section className="staff-review__panel">
          <p className="eyebrow">Başvuru bilgileri</p>
          <dl className="staff-review__meta">
            <div>
              <dt>Başvuru sahibi</dt>
              <dd>{review.applicantName}</dd>
            </div>
            <div>
              <dt>Hesap e-postası</dt>
              <dd>{review.applicantEmail}</dd>
            </div>
            <div>
              <dt>Şirket e-postası</dt>
              <dd>{review.companyEmail ?? "Bağlı değil"}</dd>
            </div>
            <div>
              <dt>Alan adı</dt>
              <dd>{review.submittedDomain}</dd>
            </div>
            <div>
              <dt>Yöntem</dt>
              <dd>{review.method}</dd>
            </div>
          </dl>
          <h2>Başvuru notu</h2>
          <p>{review.applicantNote ?? "Başvuru sahibi ek açıklama bırakmadı."}</p>
        </section>

        <section className="staff-review__panel">
          <p className="eyebrow">Private evidence</p>
          <h2>Belgeler</h2>
          {review.evidence.length === 0 ? (
            <p>Bu başvuru için saklanan aktif belge yok.</p>
          ) : (
            <ul className="staff-review__evidence">
              {review.evidence.map((file) => (
                <li key={file.id}>
                  <div>
                    <strong>{file.originalFilename}</strong>
                    <span>
                      {formatBytes(file.sizeBytes)} · {file.mimeType} · SHA-256{" "}
                      {file.sha256?.slice(0, 12)}…
                    </span>
                  </div>
                  <Link
                    className="button"
                    reloadDocument
                    to={`/admin/business-identity/reviews/${review.id}/evidence/${file.id}/download`}
                  >
                    Private indir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="staff-review__decision">
        <p className="eyebrow">Gerekçeli karar</p>
        <h2>İncelemeyi sonuçlandırın</h2>
        <p>
          Onay Buyer aktivasyonunu yalnızca Buyer niyeti varsa açar. Supplier aktivasyonu bu
          karardan bağımsızdır.
        </p>
        <Form method="post" className="auth-form">
          <div className="field-group">
            <label htmlFor="reviewNote">İnceleme notu</label>
            <textarea id="reviewNote" name="reviewNote" rows={4} required minLength={3} />
          </div>
          <div className="field-group">
            <label htmlFor="rejectionReason">Red gerekçesi</label>
            <textarea id="rejectionReason" name="rejectionReason" rows={3} />
            <p className="form-note">Yalnız red kararı için zorunludur.</p>
          </div>
          <div className="staff-review__actions">
            <button
              className="button button--primary"
              type="submit"
              name="decision"
              value="verified"
              disabled={submitting}
            >
              {submitting ? "Karar kaydediliyor…" : "İş kimliğini doğrula"}
            </button>
            <button
              className="button"
              type="submit"
              name="decision"
              value="rejected"
              disabled={submitting}
            >
              Gerekçeyle reddet
            </button>
          </div>
        </Form>
      </section>
    </main>
  );
}

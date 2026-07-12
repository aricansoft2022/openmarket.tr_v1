import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { OnboardingShell } from "~/components/onboarding-shell";
import { loadOnboardingState } from "~/lib/business-identity/onboarding.server";

import type { Route } from "./+types/onboarding.business-identity-status";

export function meta({}: Route.MetaArgs) {
  return [{ title: "İş kimliği durumu — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const state = await loadOnboardingState(env, request);
  if (!state) throw redirect("/auth/login");
  if (!state.user.emailVerified) throw redirect("/auth/verify-email");
  if (!state.latestReview) throw redirect("/onboarding/business-identity");

  const url = new URL(request.url);
  return {
    ...state,
    justSubmitted: url.searchParams.get("submitted") === "1",
  };
}

const statusCopy = {
  pending: {
    title: "İnceleme bekleniyor.",
    description:
      "Başvurunuz kaydedildi. Public e-posta veya farklı şirket e-postası gibi durumlar manuel ya da ayrı e-posta doğrulaması gerektirir.",
  },
  verified: {
    title: "İş kimliği doğrulandı.",
    description:
      "İş kimliği kanıtınız doğrulandı. Buyer seçiminiz varsa ticari Buyer çalışma alanınız aktiftir.",
  },
  rejected: {
    title: "Başvuru güncellenmeli.",
    description:
      "Başvuru kabul edilmedi. Red nedenini inceleyip aynı state-machine üzerinden yeni bir başvuru gönderebilirsiniz.",
  },
  draft: {
    title: "Başvuru tamamlanmadı.",
    description: "İş kimliği bilgilerinizi tamamlayıp başvuruyu gönderin.",
  },
} as const;

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default function BusinessIdentityStatus({ loaderData }: Route.ComponentProps) {
  const review = loaderData.latestReview!;
  const copy = statusCopy[review.status];
  const buyerActive = loaderData.buyerStatus === "active";

  return (
    <OnboardingShell current="A10" title={copy.title} description={copy.description}>
      <div className="status-stack">
        {loaderData.justSubmitted ? (
          <div className="form-alert" role="status">
            Başvurunuz güvenli biçimde kaydedildi. Bu ekran her zaman veritabanındaki güncel durumu
            gösterir.
          </div>
        ) : null}

        <section className="review-status-card" data-status={review.status}>
          <p className="eyebrow">Review status · {review.status}</p>
          <h2>{review.companyName}</h2>
          <p>{review.companyEmail ?? review.submittedDomain}</p>

          <dl className="review-status-meta">
            <div>
              <dt>İnceleme yöntemi</dt>
              <dd>
                {review.method === "manual_exception"
                  ? "Manuel istisna"
                  : review.method === "admin_override"
                    ? "Yönetici kararı"
                    : "Şirket e-postası"}
              </dd>
            </div>
            <div>
              <dt>Şirket e-postası</dt>
              <dd>{review.companyEmailStatus ?? "Bağlı değil"}</dd>
            </div>
            <div>
              <dt>Gönderim</dt>
              <dd>{formatDate(review.submittedAt)}</dd>
            </div>
            <div>
              <dt>Karar</dt>
              <dd>{formatDate(review.reviewedAt)}</dd>
            </div>
            <div>
              <dt>Buyer durumu</dt>
              <dd>{loaderData.buyerStatus ?? "Talep edilmedi"}</dd>
            </div>
            <div>
              <dt>Workspace niyeti</dt>
              <dd>{loaderData.intendedUse}</dd>
            </div>
          </dl>
        </section>

        {review.status === "rejected" ? (
          <section className="rejection-panel" aria-labelledby="rejection-heading">
            <p className="eyebrow">Red nedeni</p>
            <h2 id="rejection-heading">Başvuruyu düzeltin</h2>
            <p>
              {review.rejectionReason ??
                "Başvurunun güncellenmesi gerekiyor. Ayrıntı için inceleme notunu kullanın."}
            </p>
            {review.reviewNote ? <p>{review.reviewNote}</p> : null}
            <Link className="button button--primary" to="/onboarding/business-identity">
              Yeniden başvuru yap
            </Link>
          </section>
        ) : null}

        <section className="status-timeline" aria-labelledby="timeline-heading">
          <p className="eyebrow">Timeline</p>
          <h2 id="timeline-heading">Doğrulama adımları</h2>
          <ol>
            <li>Hesap e-postası doğrulandı.</li>
            <li>Çalışma alanı tercihi kaydedildi: {loaderData.intendedUse}.</li>
            <li>İş kimliği başvurusu gönderildi: {formatDate(review.submittedAt)}.</li>
            <li>
              {review.status === "pending"
                ? "İnceleme veya şirket e-postası doğrulaması bekleniyor."
                : review.status === "verified"
                  ? "İş kimliği doğrulandı."
                  : "Başvuru reddedildi ve yeniden başvuru açıldı."}
            </li>
            <li>
              {buyerActive
                ? "Buyer ticari çalışma alanı aktif."
                : loaderData.intendedUse === "supplier"
                  ? "Buyer çalışma alanı talep edilmedi; Supplier aktivasyonu ayrı ilerler."
                  : "Buyer ticari işlemleri doğrulanmış iş kimliği bekliyor."}
            </li>
          </ol>
        </section>

        <div className="continue-bar">
          <p>
            İş kimliği doğrulaması supplier ürün yayınlama yetkisi vermez; supplier aktivasyonu
            şirket profili ve zorunlu belgelerle ayrıca tamamlanır.
          </p>
          {review.status === "verified" ? (
            <Link className="button button--primary" to={buyerActive ? "/" : "/"}>
              Platforma devam et
            </Link>
          ) : (
            <Link className="button" to="/">
              Ana sayfaya dön
            </Link>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}

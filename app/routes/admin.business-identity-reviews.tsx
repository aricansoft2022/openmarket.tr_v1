import { env } from "cloudflare:workers";
import { data, Link, redirect } from "react-router";

import { StaffAuthorizationError } from "~/lib/authorization/platform-staff.server";
import { loadBusinessIdentityReviewQueue } from "~/lib/business-identity/review.server";

import type { Route } from "./+types/admin.business-identity-reviews";

export function meta({}: Route.MetaArgs) {
  return [{ title: "İş kimliği inceleme kuyruğu — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const context = await loadBusinessIdentityReviewQueue(env, request);
    const url = new URL(request.url);
    return {
      access: "granted" as const,
      ...context,
      decided: url.searchParams.get("decided"),
    };
  } catch (error) {
    if (error instanceof StaffAuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        throw redirect(`/auth/login?returnTo=${encodeURIComponent("/admin/business-identity/reviews")}`);
      }
      return data({ access: "denied" as const }, { status: 403 });
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

export default function BusinessIdentityReviewQueue({ loaderData }: Route.ComponentProps) {
  if (loaderData.access === "denied") {
    return (
      <main className="staff-review staff-review--centered">
        <p className="eyebrow">X04 · Yetki gerekli</p>
        <h1>Bu inceleme kuyruğuna erişemezsiniz.</h1>
        <p>
          Buyer, Supplier veya Moderator durumu iş kimliği inceleme yetkisi vermez. Aktif Compliance
          Reviewer ya da yönetici ataması gerekir.
        </p>
        <Link className="button" to="/">
          Ana sayfaya dön
        </Link>
      </main>
    );
  }

  return (
    <main className="staff-review">
      <header className="staff-review__header">
        <div>
          <p className="eyebrow">Operasyon · İş kimliği</p>
          <h1>Bekleyen incelemeler</h1>
          <p>
            Etkin rol: <strong>{loaderData.effectiveRole}</strong>. Kendi başvurunuz bu listede
            gösterilmez.
          </p>
        </div>
        <Link className="button" to="/">
          Platforma dön
        </Link>
      </header>

      {loaderData.decided ? (
        <div className="form-alert" role="status">
          İnceleme kararı kaydedildi: {loaderData.decided}.
        </div>
      ) : null}

      {loaderData.value.length === 0 ? (
        <section className="staff-review__empty">
          <p className="eyebrow">Kuyruk boş</p>
          <h2>Bekleyen başvuru yok.</h2>
          <p>Yeni bir manuel istisna veya ayrı şirket e-postası başvurusu geldiğinde burada görünür.</p>
        </section>
      ) : (
        <div className="staff-review__table-wrap">
          <table className="staff-review__table">
            <thead>
              <tr>
                <th>Şirket</th>
                <th>Başvuru sahibi</th>
                <th>Yöntem</th>
                <th>Gönderim</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loaderData.value.map((review) => (
                <tr key={review.id}>
                  <td>
                    <strong>{review.companyName}</strong>
                    <span>{review.companyEmail ?? review.submittedDomain}</span>
                  </td>
                  <td>
                    {review.applicantName}
                    <span>{review.applicantEmail}</span>
                  </td>
                  <td>{review.method}</td>
                  <td>{formatDate(review.submittedAt)}</td>
                  <td>
                    <Link className="button" to={`/admin/business-identity/reviews/${review.id}`}>
                      İncele
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import {
  SupplierRouteError,
  SupplierRouteFallback,
  SupplierShell,
} from "~/components/supplier-shell";
import {
  buildSupplierOnboardingChecklist,
  firstSupplierChecklistAction,
  supplierChecklistProgress,
} from "~/lib/supplier/onboarding";
import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";

import type { Route } from "./+types/supplier.onboarding";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tedarikçi onboarding — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  return context;
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S02" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S02" error={error} />;
}

export default function SupplierOnboarding({ loaderData }: Route.ComponentProps) {
  const checklist = buildSupplierOnboardingChecklist({
    language: loaderData.preferredLanguage,
    businessIdentityVerified: loaderData.businessIdentityVerified,
    company: loaderData.company,
  });
  const progress = supplierChecklistProgress(checklist);
  const nextAction = firstSupplierChecklistAction(checklist);
  const blockers = checklist.filter((item) => !item.complete);

  return (
    <SupplierShell
      current="S02"
      language={loaderData.preferredLanguage}
      companyName={loaderData.company?.company.legalName ?? loaderData.verifiedCompanyName}
      status={loaderData.company?.company.status}
      membershipRole={loaderData.company?.membershipRole}
    >
      <section className="supplier-page">
        <div className="supplier-page__heading supplier-page__heading--split">
          <div>
            <p className="eyebrow">S02 · Supplier onboarding checklist</p>
            <h1>Aktivasyon yolunu adım adım izleyin</h1>
            <p>
              Tamamlanan profil adımları taslak hazırlığını ilerletir. Belge incelemesi bitmeden
              Supplier aktif olmaz.
            </p>
          </div>
          <div className="supplier-progress-number">
            <strong>%{progress.percent}</strong>
            <span>
              {progress.complete}/{progress.total} tamamlandı
            </span>
          </div>
        </div>

        <ol className="supplier-stepper" aria-label="Tedarikçi onboarding adımları">
          {checklist.map((item, index) => (
            <li
              key={item.id}
              className={item.complete ? "is-complete" : item.blocked ? "is-blocked" : "is-current"}
            >
              <span className="supplier-stepper__index" aria-hidden="true">
                {item.complete ? "✓" : index + 1}
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </div>
              {item.href ? (
                <Link className="supplier-stepper__link" to={item.href}>
                  {item.complete ? "Görüntüle" : "Devam et"}
                </Link>
              ) : (
                <span className="supplier-stepper__locked">Kilitli</span>
              )}
            </li>
          ))}
        </ol>

        <div className="supplier-checklist-grid">
          {checklist.map((item) => (
            <section className="supplier-checklist-card" key={item.id}>
              <div className="supplier-checklist-card__status">
                <span
                  className={
                    item.complete ? "is-complete" : item.blocked ? "is-blocked" : "is-open"
                  }
                >
                  {item.complete ? "Tamamlandı" : item.blocked ? "Bloke" : "Açık"}
                </span>
              </div>
              <h2>{item.label}</h2>
              <p>{item.description}</p>
              {item.href ? (
                <Link to={item.href}>{item.complete ? "Kaydı incele" : "Bu adımı tamamla"}</Link>
              ) : (
                <small>Bu adım ilgili güvenli modül birleştirildiğinde açılacak.</small>
              )}
            </section>
          ))}
        </div>

        <section className="supplier-blocking-panel">
          <div>
            <p className="eyebrow">Blocking issue panel</p>
            <h2>
              {blockers.length === 0
                ? "Aktivasyon engeli yok"
                : `${blockers.length} açık engel var`}
            </h2>
          </div>
          <ul>
            {blockers.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong>
                <span>
                  {item.blocked
                    ? "Önceki bağımlılık veya sonraki modül bekleniyor."
                    : "Kullanıcı işlemi gerekli."}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="supplier-continue-bar">
          <div>
            <strong>
              Supplier durumu: {loaderData.company?.company.status ?? "supplier_not_created"}
            </strong>
            <p>Checklist tamamlanması tek başına aktivasyon kararı üretmez.</p>
          </div>
          {nextAction?.href ? (
            <Link className="button button--primary" to={nextAction.href}>
              {nextAction.label}
            </Link>
          ) : (
            <button className="button button--primary" type="button" disabled>
              Belge modülü bekleniyor
            </button>
          )}
        </div>
      </section>
    </SupplierShell>
  );
}

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
import { supplierScreenCopy } from "~/lib/supplier/screen-copy";

import type { Route } from "./+types/supplier.onboarding";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Supplier onboarding — OpenMarket.tr" }];
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
  const screenCopy = supplierScreenCopy(loaderData.preferredLanguage);
  const copy = screenCopy.onboarding;
  const common = screenCopy.common;
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
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>
          <div className="supplier-progress-number">
            <strong>%{progress.percent}</strong>
            <span>
              {progress.complete}/{progress.total} {copy.completedSuffix}
            </span>
          </div>
        </div>

        <ol className="supplier-stepper" aria-label={copy.title}>
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
                  {item.complete ? common.view : common.continue}
                </Link>
              ) : (
                <span className="supplier-stepper__locked">{common.locked}</span>
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
                  {item.complete ? common.complete : item.blocked ? common.blocked : common.open}
                </span>
              </div>
              <h2>{item.label}</h2>
              <p>{item.description}</p>
              {item.href ? (
                <Link to={item.href}>{item.complete ? copy.inspect : copy.completeAction}</Link>
              ) : (
                <small>{copy.lockedDescription}</small>
              )}
            </section>
          ))}
        </div>

        <section className="supplier-blocking-panel">
          <div>
            <p className="eyebrow">{copy.blockerEyebrow}</p>
            <h2>
              {blockers.length === 0
                ? copy.noBlockers
                : `${blockers.length} ${copy.blockersSuffix}`}
            </h2>
          </div>
          <ul>
            {blockers.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.blocked ? copy.dependencyBlocked : copy.userActionRequired}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="supplier-continue-bar">
          <div>
            <strong>
              {common.status}: {loaderData.company?.company.status ?? copy.stateNotCreated}
            </strong>
            <p>{copy.activationWarning}</p>
          </div>
          {nextAction?.href ? (
            <Link className="button button--primary" to={nextAction.href}>
              {nextAction.label}
            </Link>
          ) : (
            <button className="button button--primary" type="button" disabled>
              {copy.documentsPending}
            </button>
          )}
        </div>
      </section>
    </SupplierShell>
  );
}

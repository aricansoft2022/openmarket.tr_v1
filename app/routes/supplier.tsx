import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import {
  SupplierRouteError,
  SupplierRouteFallback,
  SupplierShell,
} from "~/components/supplier-shell";
import {
  buildSupplierOnboardingChecklist,
  supplierChecklistProgress,
} from "~/lib/supplier/onboarding";
import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";
import { supplierScreenCopy } from "~/lib/supplier/screen-copy";

import type { Route } from "./+types/supplier";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Supplier overview / Tedarikçi genel bakış — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  return context;
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S01" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S01" error={error} />;
}

export default function SupplierOverview({ loaderData }: Route.ComponentProps) {
  const copy = supplierScreenCopy(loaderData.preferredLanguage).overview;
  const checklist = buildSupplierOnboardingChecklist({
    language: loaderData.preferredLanguage,
    businessIdentityVerified: loaderData.businessIdentityVerified,
    company: loaderData.company,
  });
  const progress = supplierChecklistProgress(checklist);
  const progressLabel = `${progress.complete} / ${progress.total} ${copy.progressSuffix}`;

  return (
    <SupplierShell
      current="S01"
      language={loaderData.preferredLanguage}
      companyName={loaderData.company?.company.legalName ?? loaderData.verifiedCompanyName}
      status={loaderData.company?.company.status}
      membershipRole={loaderData.company?.membershipRole}
    >
      <section className="supplier-page">
        <div className="supplier-page__heading supplier-page__heading--split">
          <div>
            <p className="eyebrow">S01 · Supplier overview</p>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>
          <Link className="button button--primary" to="/supplier/onboarding">
            {copy.onboardingAction}
          </Link>
        </div>

        {!loaderData.hasSupplierIntent ? (
          <div className="supplier-state supplier-state--warning">
            <p className="eyebrow">{copy.workspaceRequired}</p>
            <h2>{copy.workspaceMissingTitle}</h2>
            <p>{copy.workspaceMissingDescription}</p>
            <Link className="button button--primary" to="/onboarding/workspaces">
              {copy.workspaceAction}
            </Link>
          </div>
        ) : !loaderData.businessIdentityVerified ? (
          <div className="supplier-state supplier-state--warning">
            <p className="eyebrow">{copy.identityBlocker}</p>
            <h2>{copy.identityTitle}</h2>
            <p>{copy.identityDescription}</p>
            <Link className="button button--primary" to="/onboarding/business-identity/status">
              {copy.identityAction}
            </Link>
          </div>
        ) : !loaderData.company ? (
          <div className="supplier-state supplier-state--empty">
            <p className="eyebrow">{copy.emptyEyebrow}</p>
            <h2>{copy.emptyTitle}</h2>
            <p>
              {copy.emptyDescription} <strong>{loaderData.verifiedCompanyName}</strong>
            </p>
            <Link className="button button--primary" to="/supplier/company">
              {copy.createCompany}
            </Link>
          </div>
        ) : null}

        <section className="supplier-activation-banner" aria-label={copy.activationEyebrow}>
          <div>
            <p className="eyebrow">{copy.activationEyebrow}</p>
            <h2>
              {loaderData.company?.company.status === "active_supplier"
                ? copy.activeTitle
                : copy.inactiveTitle}
            </h2>
            <p>
              {loaderData.company?.company.status === "active_supplier"
                ? copy.activeDescription
                : copy.inactiveDescription}
            </p>
          </div>
          <span className="supplier-status-pill">
            {loaderData.company?.company.status ?? "supplier_not_created"}
          </span>
        </section>

        <section className="supplier-progress-panel">
          <div className="supplier-progress-panel__header">
            <div>
              <p className="eyebrow">{copy.progressEyebrow}</p>
              <h2>{progressLabel}</h2>
            </div>
            <strong>%{progress.percent}</strong>
          </div>
          <div
            className="supplier-progress-track"
            aria-label={`${copy.progressEyebrow}: ${progress.percent}%`}
          >
            <i style={{ width: `${progress.percent}%` }} />
          </div>
          <ol className="supplier-progress-list">
            {checklist.map((item) => (
              <li key={item.id} className={item.complete ? "is-complete" : undefined}>
                <span aria-hidden="true">{item.complete ? "✓" : "•"}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="supplier-dashboard-grid">
          <section className="supplier-dashboard-card">
            <p className="eyebrow">{copy.productEyebrow}</p>
            <h2>{copy.productTitle}</h2>
            <p>{copy.productDescription}</p>
            <button className="button button--secondary" type="button" disabled>
              {copy.productLocked}
            </button>
          </section>
          <section className="supplier-dashboard-card">
            <p className="eyebrow">{copy.rfqEyebrow}</p>
            <h2>{copy.rfqTitle}</h2>
            <p>{copy.rfqDescription}</p>
          </section>
          <section className="supplier-dashboard-card">
            <p className="eyebrow">{copy.enquiryEyebrow}</p>
            <h2>{copy.enquiryTitle}</h2>
            <p>{copy.enquiryDescription}</p>
          </section>
          <section className="supplier-dashboard-card">
            <p className="eyebrow">{copy.documentsEyebrow}</p>
            <h2>{copy.documentsTitle}</h2>
            <p>{copy.documentsDescription}</p>
          </section>
        </div>
      </section>
    </SupplierShell>
  );
}

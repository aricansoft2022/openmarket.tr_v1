import type { ReactNode } from "react";
import { Link, isRouteErrorResponse } from "react-router";

import type {
  PreferredLanguage,
  SupplierMembershipRole,
  SupplierWorkspaceStatus,
} from "~/lib/db/schema";
import { supplierCopy } from "~/lib/supplier/copy";

const navigation = [
  { id: "S01", key: "overview", href: "/supplier" },
  { id: "S02", key: "onboarding", href: "/supplier/onboarding" },
  { id: "S03", key: "company", href: "/supplier/company" },
  { id: "S04", key: "capabilities", href: "/supplier/capabilities" },
] as const;

export function SupplierShell({
  current,
  language = "tr",
  companyName,
  status,
  membershipRole,
  children,
}: {
  current: "S01" | "S02" | "S03" | "S04";
  language?: PreferredLanguage;
  companyName?: string | null;
  status?: SupplierWorkspaceStatus | null;
  membershipRole?: SupplierMembershipRole | null;
  children: ReactNode;
}) {
  const copy = supplierCopy(language).shell;

  return (
    <main className="supplier-layout" lang={language}>
      <header className="supplier-header">
        <Link
          className="brand"
          to="/"
          aria-label={language === "tr" ? "OpenMarket.tr ana sayfa" : "OpenMarket.tr home"}
        >
          <span className="woven-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          OpenMarket<span className="brand__dot">.tr</span>
        </Link>
        <div className="supplier-header__identity">
          <span>{companyName || copy.workspace}</span>
          {membershipRole ? <small>{copy.roles[membershipRole]}</small> : null}
        </div>
      </header>

      <div className="supplier-workspace">
        <aside className="supplier-sidebar">
          <div className="supplier-sidebar__title">
            <p className="eyebrow">Supplier workspace</p>
            <strong>{status ? copy.statuses[status] : copy.statuses.notCreated}</strong>
          </div>
          <nav aria-label={copy.workspace}>
            <ul>
              {navigation.map((item) => (
                <li key={item.id}>
                  <Link
                    className={item.id === current ? "is-active" : undefined}
                    aria-current={item.id === current ? "page" : undefined}
                    to={item.href}
                  >
                    <span>{item.id}</span>
                    {copy[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="supplier-sidebar__notice">
            <strong>{copy.activationBoundary}</strong>
            <p>{copy.activationNotice}</p>
          </div>
        </aside>
        <section className="supplier-main">{children}</section>
      </div>
    </main>
  );
}

export function SupplierRouteFallback({
  current,
  language = "tr",
}: {
  current: "S01" | "S02" | "S03" | "S04";
  language?: PreferredLanguage;
}) {
  const copy = supplierCopy(language).shell;

  return (
    <SupplierShell current={current} language={language}>
      <section className="supplier-page" aria-busy="true">
        <div className="supplier-page__heading">
          <p className="eyebrow">{copy.loadingEyebrow}</p>
          <h1>{copy.loadingTitle}</h1>
          <p>{copy.loadingDescription}</p>
        </div>
        <div className="supplier-skeleton" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </section>
    </SupplierShell>
  );
}

export function SupplierRouteError({
  current,
  language = "tr",
  error,
}: {
  current: "S01" | "S02" | "S03" | "S04";
  language?: PreferredLanguage;
  error: unknown;
}) {
  const copy = supplierCopy(language).shell;
  const message = isRouteErrorResponse(error)
    ? error.statusText || copy.errorDescription
    : copy.errorDescription;

  return (
    <SupplierShell current={current} language={language}>
      <section className="supplier-page">
        <div className="supplier-state supplier-state--error" role="alert">
          <p className="eyebrow">{copy.errorEyebrow}</p>
          <h1>{copy.errorTitle}</h1>
          <p>{message}</p>
          <div className="supplier-actions">
            <Link className="button button--primary" to="/supplier">
              {copy.overviewAction}
            </Link>
            <Link className="button button--secondary" to="/account/security">
              {copy.securityAction}
            </Link>
          </div>
        </div>
      </section>
    </SupplierShell>
  );
}

import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import {
  SupplierRouteError,
  SupplierRouteFallback,
  SupplierShell,
} from "~/components/supplier-shell";
import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";
import { supplierDocumentCopy, supplierDocumentStateLabel } from "~/lib/supplier/documents/copy";
import { loadSupplierDocumentWorkspace } from "~/lib/supplier/documents/service.server";

import type { Route } from "./+types/supplier.documents";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Supplier company documents — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const [context, workspace] = await Promise.all([
    loadSupplierOnboardingRouteContext(env, request),
    loadSupplierDocumentWorkspace(env, request),
  ]);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  return { context, workspace };
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S05" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S05" error={error} />;
}

export default function SupplierDocuments({ loaderData }: Route.ComponentProps) {
  const { context, workspace } = loaderData;
  const copy = supplierDocumentCopy(context.preferredLanguage);

  if (!workspace) {
    return (
      <SupplierShell
        current="S05"
        language={context.preferredLanguage}
        companyName={context.verifiedCompanyName}
      >
        <section className="supplier-page">
          <div className="supplier-state supplier-state--empty">
            <p className="eyebrow">S05 · Company document requirements</p>
            <h1>{copy.documents.title}</h1>
            <p>{copy.upload.noCompany}</p>
            <Link className="button button--primary" to="/supplier/company">
              {context.preferredLanguage === "tr"
                ? "Şirket profilini oluştur"
                : "Create company profile"}
            </Link>
          </div>
        </section>
      </SupplierShell>
    );
  }

  const mandatory = workspace.requirements.filter(
    (requirement) => requirement.level === "mandatory",
  );
  const approved = mandatory.filter((requirement) => requirement.satisfied).length;
  const blockers = mandatory.length - approved;
  const primaryLabel = context.preferredLanguage === "en" ? "labelEn" : "labelTr";
  const primaryDescription = context.preferredLanguage === "en" ? "descriptionEn" : "descriptionTr";
  const primaryNote = context.preferredLanguage === "en" ? "noteEn" : "noteTr";

  return (
    <SupplierShell
      current="S05"
      language={context.preferredLanguage}
      companyName={workspace.company.legalName}
      status={workspace.company.status}
      membershipRole={workspace.membershipRole}
    >
      <section className="supplier-page">
        <div className="supplier-page__heading supplier-page__heading--split">
          <div>
            <p className="eyebrow">S05 · Company document requirements</p>
            <h1>{copy.documents.title}</h1>
            <p>{copy.documents.description}</p>
          </div>
          {workspace.canEdit ? (
            <Link className="button button--primary" to="/supplier/documents/upload">
              {copy.documents.upload}
            </Link>
          ) : null}
        </div>

        <section className="supplier-document-summary" aria-label={copy.documents.title}>
          <div>
            <strong>
              {approved} / {mandatory.length}
            </strong>
            <span>{copy.documents.complete}</span>
          </div>
          <div>
            <strong>{blockers}</strong>
            <span>{copy.documents.blocker}</span>
          </div>
          <p>{copy.documents.scannerNotice}</p>
        </section>

        {workspace.requirements.length === 0 ? (
          <div className="supplier-state supplier-state--empty">
            <p>{copy.documents.noRequirements}</p>
          </div>
        ) : (
          <div className="supplier-document-requirements">
            {workspace.requirements.map((requirement) => {
              const current = requirement.documents[0] ?? null;
              return (
                <article
                  className="supplier-document-requirement"
                  key={requirement.documentTypeKey}
                >
                  <header>
                    <div>
                      <span className={`supplier-document-level is-${requirement.level}`}>
                        {copy.levels[requirement.level]}
                      </span>
                      <h2>{requirement[primaryLabel]}</h2>
                    </div>
                    <span className={`supplier-document-state is-${requirement.currentState}`}>
                      {supplierDocumentStateLabel(
                        context.preferredLanguage,
                        requirement.currentState,
                      )}
                    </span>
                  </header>
                  <p>{requirement[primaryDescription]}</p>
                  <small>{requirement[primaryNote]}</small>
                  <footer>
                    {current ? (
                      <Link to={`/supplier/documents/${current.id}`}>
                        {copy.documents.viewHistory}
                      </Link>
                    ) : workspace.canEdit ? (
                      <Link
                        to={`/supplier/documents/upload?type=${encodeURIComponent(
                          requirement.documentTypeKey,
                        )}`}
                      >
                        {copy.documents.uploadFirst}
                      </Link>
                    ) : null}
                    {current && workspace.canEdit ? (
                      <Link
                        to={`/supplier/documents/upload?type=${encodeURIComponent(
                          requirement.documentTypeKey,
                        )}&replaces=${current.id}`}
                      >
                        {copy.documents.replace}
                      </Link>
                    ) : null}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </SupplierShell>
  );
}

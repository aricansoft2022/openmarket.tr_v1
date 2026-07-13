import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { loadOnboardingState } from "~/lib/business-identity/onboarding.server";
import { supplierDocumentCopy } from "~/lib/supplier/documents/copy";
import { loadSupplierDocumentReviewQueue } from "~/lib/supplier/documents/service.server";

import type { Route } from "./+types/admin.supplier-documents";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Supplier document review queue — OpenMarket.tr" }];
}

function formatDate(value: Date | string | null, language: "tr" | "en"): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function loader({ request }: Route.LoaderArgs) {
  const [account, queue] = await Promise.all([
    loadOnboardingState(env, request),
    loadSupplierDocumentReviewQueue(env, request),
  ]);
  if (!account || !queue) throw redirect("/auth/login");
  return { account, queue };
}

export default function SupplierDocumentReviewQueue({ loaderData }: Route.ComponentProps) {
  const language = loaderData.account.preferredLanguage;
  const copy = supplierDocumentCopy(language).reviewQueue;

  return (
    <main className="review-shell supplier-review-shell" lang={language}>
      <header className="review-shell__header">
        <div>
          <p className="eyebrow">D17 · Supplier document queue</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="review-shell__actor">
          <strong>{loaderData.account.user.email}</strong>
          <span>{loaderData.queue.actor.role}</span>
        </div>
      </header>

      {loaderData.queue.documents.length === 0 ? (
        <section className="supplier-state supplier-state--empty">
          <p>{copy.empty}</p>
        </section>
      ) : (
        <section className="supplier-review-table" aria-label={copy.title}>
          <div className="supplier-review-table__head">
            <span>{copy.company}</span>
            <span>{copy.type}</span>
            <span>{copy.submitted}</span>
            <span aria-hidden="true" />
          </div>
          {loaderData.queue.documents.map((document) => (
            <article key={document.id}>
              <strong>{document.companyName}</strong>
              <code>{document.documentTypeKey}</code>
              <span>{formatDate(document.submittedAt, language)}</span>
              <Link to={`/admin/supplier-documents/${document.id}`}>{copy.review}</Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

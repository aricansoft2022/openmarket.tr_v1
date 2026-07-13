import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import { loadOnboardingState } from "~/lib/business-identity/onboarding.server";
import { supplierDocumentCopy } from "~/lib/supplier/documents/copy";
import { supplierDocumentErrorMessage } from "~/lib/supplier/documents/errors";
import {
  createSupplierDocumentAccessGrant,
  decideSupplierCompanyDocument,
  loadSupplierDocumentReviewDetail,
} from "~/lib/supplier/documents/service.server";

import type { Route } from "./+types/admin.supplier-documents.$documentId";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Review Supplier company document — OpenMarket.tr" }];
}

function formatDate(value: Date | string | null, language: "tr" | "en"): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 / 1024).toFixed(1)} MiB`;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const [account, detail] = await Promise.all([
    loadOnboardingState(env, request),
    loadSupplierDocumentReviewDetail(env, request, params.documentId),
  ]);
  if (!account || !detail) throw redirect("/auth/login");
  return { account, detail };
}

export async function action({ request, params }: Route.ActionArgs) {
  const account = await loadOnboardingState(env, request);
  if (!account) throw redirect("/auth/login");
  const copy = supplierDocumentCopy(account.preferredLanguage);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  try {
    if (intent === "access") {
      const grant = await createSupplierDocumentAccessGrant(env, request, params.documentId);
      return redirect(`/supplier/document-access/${grant.token}`);
    }
    if (
      intent === "approved" ||
      intent === "rejected" ||
      intent === "replacement_required"
    ) {
      await decideSupplierCompanyDocument(env, request, {
        documentId: params.documentId,
        decision: intent,
        reason: String(formData.get("reason") ?? ""),
        reviewNote: String(formData.get("reviewNote") ?? "").trim() || null,
      });
      return redirect(`/admin/supplier-documents/${params.documentId}?decided=1`);
    }
    return data({ error: copy.review.noDocument }, { status: 400 });
  } catch (error) {
    return data(
      {
        error:
          supplierDocumentErrorMessage(error, account.preferredLanguage) ?? copy.review.noDocument,
      },
      { status: 400 },
    );
  }
}

export default function SupplierDocumentReview({ loaderData, actionData }: Route.ComponentProps) {
  const language = loaderData.account.preferredLanguage;
  const copy = supplierDocumentCopy(language);
  const navigation = useNavigation();
  const deciding = navigation.state === "submitting";
  const decided = new URL(
    typeof window === "undefined" ? "http://localhost" : window.location.href,
  ).searchParams.get("decided");
  const { detail } = loaderData;

  if (!detail.document) {
    return (
      <main className="review-shell supplier-review-shell" lang={language}>
        <section className="supplier-state supplier-state--error">
          <h1>{copy.review.noDocument}</h1>
          <Link className="button button--primary" to="/admin/supplier-documents">
            {language === "tr" ? "Kuyruğa dön" : "Return to queue"}
          </Link>
        </section>
      </main>
    );
  }

  const document = detail.document;

  return (
    <main className="review-shell supplier-review-shell" lang={language}>
      <header className="review-shell__header">
        <div>
          <p className="eyebrow">D18 · Supplier document review</p>
          <h1>{copy.review.title}</h1>
          <p>{copy.review.description}</p>
        </div>
        <div className="review-shell__actor">
          <strong>{loaderData.account.user.email}</strong>
          <span>{detail.actor.role}</span>
        </div>
      </header>

      {decided ? (
        <div className="form-success" role="status">
          {language === "tr" ? "İnceleme kararı kaydedildi." : "Review decision saved."}
        </div>
      ) : null}
      {actionData?.error ? (
        <div className="form-alert" role="alert">
          {actionData.error}
        </div>
      ) : null}

      <section className="supplier-admin-document-card">
        <header>
          <div>
            <p className="eyebrow">{document.documentTypeKey}</p>
            <h2>{document.companyName}</h2>
          </div>
          <span className={`supplier-document-state is-${document.evidenceStatus}`}>
            {copy.states[document.evidenceStatus]}
          </span>
        </header>
        <dl>
          <div>
            <dt>{copy.detail.file}</dt>
            <dd>{document.originalFilename}</dd>
          </div>
          <div>
            <dt>{copy.detail.size}</dt>
            <dd>{formatBytes(document.sizeBytes)}</dd>
          </div>
          <div>
            <dt>{copy.detail.scan}</dt>
            <dd>{document.scanStatus}</dd>
          </div>
          <div>
            <dt>{copy.detail.issueDate}</dt>
            <dd>{formatDate(document.issueDate, language)}</dd>
          </div>
          <div>
            <dt>{copy.detail.expiryDate}</dt>
            <dd>{formatDate(document.expiresAt, language)}</dd>
          </div>
          <div>
            <dt>{copy.detail.submitted}</dt>
            <dd>{formatDate(document.submittedAt, language)}</dd>
          </div>
        </dl>
        <p className="supplier-document-hash">SHA-256: {document.sha256}</p>
        <Form method="post">
          <button className="button button--secondary" name="intent" value="access" type="submit">
            {copy.review.download}
          </button>
        </Form>
      </section>

      {document.evidenceStatus === "pending_review" ? (
        <Form className="supplier-review-decision" method="post">
          <fieldset disabled={deciding}>
            <label className="supplier-field supplier-field--wide">
              <span>{copy.review.reason}</span>
              <textarea name="reason" rows={5} minLength={3} maxLength={2000} required />
            </label>
            <label className="supplier-field supplier-field--wide">
              <span>{copy.review.note}</span>
              <textarea name="reviewNote" rows={4} maxLength={4000} />
            </label>
            <div className="supplier-review-decisions">
              <button className="button button--primary" name="intent" value="approved" type="submit">
                {copy.review.approve}
              </button>
              <button className="button button--secondary" name="intent" value="replacement_required" type="submit">
                {copy.review.replacement}
              </button>
              <button className="button button--secondary" name="intent" value="rejected" type="submit">
                {copy.review.reject}
              </button>
            </div>
          </fieldset>
        </Form>
      ) : null}

      <section className="supplier-document-timeline">
        <p className="eyebrow">{copy.review.timeline}</p>
        {detail.timeline.length === 0 ? (
          <p>{copy.detail.noTimeline}</p>
        ) : (
          <ol>
            {detail.timeline.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{copy.states[event.decision]}</strong>
                  <span>{formatDate(event.createdAt, language)}</span>
                </div>
                <p>{event.reason}</p>
                {event.reviewNote ? <small>{event.reviewNote}</small> : null}
                <code>{event.effectiveRole}</code>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

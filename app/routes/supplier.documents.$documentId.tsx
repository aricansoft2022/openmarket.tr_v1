import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import {
  SupplierRouteError,
  SupplierRouteFallback,
  SupplierShell,
} from "~/components/supplier-shell";
import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";
import {
  supplierDocumentCopy,
  supplierDocumentStateLabel,
} from "~/lib/supplier/documents/copy";
import { supplierDocumentErrorMessage } from "~/lib/supplier/documents/errors";
import {
  createSupplierDocumentAccessGrant,
  setSupplierDocumentPublicVisibility,
  submitSupplierCompanyDocumentForReview,
} from "~/lib/supplier/documents/service.server";
import { loadSupplierMemberDocumentDetail } from "~/lib/supplier/documents/views.server";

import type { Route } from "./+types/supplier.documents.$documentId";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Supplier document detail — OpenMarket.tr" }];
}

function formatDate(value: Date | string | null, language: "tr" | "en"): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 / 1024).toFixed(1)} MiB`;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const [context, detail] = await Promise.all([
    loadSupplierOnboardingRouteContext(env, request),
    loadSupplierMemberDocumentDetail(env, request, params.documentId),
  ]);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  return {
    context,
    detail,
    stored: new URL(request.url).searchParams.get("stored") === "1",
    submitted: new URL(request.url).searchParams.get("submitted") === "1",
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");
  const copy = supplierDocumentCopy(context.preferredLanguage);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  try {
    if (intent === "submit-review") {
      await submitSupplierCompanyDocumentForReview(env, request, params.documentId);
      return redirect(`/supplier/documents/${params.documentId}?submitted=1`);
    }
    if (intent === "access") {
      const grant = await createSupplierDocumentAccessGrant(env, request, params.documentId);
      return redirect(`/supplier/document-access/${grant.token}`);
    }
    if (intent === "visibility-on" || intent === "visibility-off") {
      await setSupplierDocumentPublicVisibility(env, request, {
        documentId: params.documentId,
        visible: intent === "visibility-on",
      });
      return redirect(`/supplier/documents/${params.documentId}`);
    }
    return data({ error: copy.detail.notFound }, { status: 400 });
  } catch (error) {
    return data(
      { error: supplierDocumentErrorMessage(error, context.preferredLanguage) ?? copy.detail.notFound },
      { status: 400 },
    );
  }
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S07" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S07" error={error} />;
}

export default function SupplierDocumentDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { context, detail } = loaderData;
  const copy = supplierDocumentCopy(context.preferredLanguage);
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  if (!detail) {
    return (
      <SupplierShell current="S07" language={context.preferredLanguage}>
        <section className="supplier-page">
          <div className="supplier-state supplier-state--error">
            <h1>{copy.detail.notFound}</h1>
            <Link className="button button--primary" to="/supplier/documents">
              {context.preferredLanguage === "tr" ? "Belgelere dön" : "Return to documents"}
            </Link>
          </div>
        </section>
      </SupplierShell>
    );
  }

  const { workspace, document, timeline } = detail;
  const label = context.preferredLanguage === "en" ? document.labelEn : document.labelTr;
  const description =
    context.preferredLanguage === "en" ? document.descriptionEn : document.descriptionTr;
  const canSubmit =
    workspace.canEdit &&
    document.storageStatus === "stored_private" &&
    document.scanStatus === "clean" &&
    (["uploaded", "rejected", "replacement_required"] as const).includes(
      document.evidenceStatus as "uploaded" | "rejected" | "replacement_required",
    );
  const canPublish =
    workspace.canEdit && document.publicEligible && document.evidenceStatus === "approved";

  return (
    <SupplierShell
      current="S07"
      language={context.preferredLanguage}
      companyName={workspace.company.legalName}
      status={workspace.company.status as never}
      membershipRole={workspace.membershipRole}
    >
      <section className="supplier-page">
        <div className="supplier-page__heading supplier-page__heading--split">
          <div>
            <p className="eyebrow">S07 · Company document detail</p>
            <h1>{copy.detail.title}</h1>
            <p>{description}</p>
          </div>
          <span className={`supplier-document-state is-${document.derivedState}`}>
            {supplierDocumentStateLabel(context.preferredLanguage, document.derivedState)}
          </span>
        </div>

        {loaderData.stored ? (
          <div className="form-success" role="status">
            {copy.upload.success}
          </div>
        ) : null}
        {loaderData.submitted ? (
          <div className="form-success" role="status">
            {context.preferredLanguage === "tr"
              ? "Belge inceleme kuyruğuna gönderildi."
              : "The document was submitted to the review queue."}
          </div>
        ) : null}
        {actionData?.error ? (
          <div className="form-alert" role="alert">
            {actionData.error}
          </div>
        ) : null}

        <section className="supplier-document-detail-card">
          <header>
            <div>
              <p className="eyebrow">{document.documentTypeKey}</p>
              <h2>{label}</h2>
            </div>
            <strong>
              {copy.detail.version} {document.version}
            </strong>
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
              <dd>{formatDate(document.issueDate, context.preferredLanguage)}</dd>
            </div>
            <div>
              <dt>{copy.detail.expiryDate}</dt>
              <dd>{formatDate(document.expiresAt, context.preferredLanguage)}</dd>
            </div>
            <div>
              <dt>{copy.detail.submitted}</dt>
              <dd>{formatDate(document.submittedAt, context.preferredLanguage)}</dd>
            </div>
          </dl>
          <p className="supplier-document-hash">SHA-256: {document.sha256 ?? "pending"}</p>
        </section>

        {document.scanStatus === "pending" ? (
          <div className="supplier-document-private-notice">
            <strong>{copy.detail.pendingScan}</strong>
            <p>{copy.documents.scannerNotice}</p>
          </div>
        ) : document.scanStatus === "failed" || document.scanStatus === "rejected" ? (
          <div className="supplier-state supplier-state--warning">
            <p>{copy.detail.failedScan}</p>
            {document.scanNote ? <small>{document.scanNote}</small> : null}
          </div>
        ) : null}

        <div className="supplier-document-actions">
          <Form method="post">
            <button className="button button--secondary" name="intent" value="access" type="submit">
              {copy.detail.download}
            </button>
          </Form>
          {canSubmit ? (
            <Form method="post">
              <button
                className="button button--primary"
                name="intent"
                value="submit-review"
                type="submit"
                disabled={submitting}
              >
                {copy.detail.submitReview}
              </button>
            </Form>
          ) : null}
          {workspace.canEdit ? (
            <Link
              className="button button--secondary"
              to={`/supplier/documents/upload?type=${encodeURIComponent(
                document.documentTypeKey,
              )}&replaces=${document.id}`}
            >
              {copy.detail.replacement}
            </Link>
          ) : null}
          {canPublish ? (
            <Form method="post">
              <button
                className="button button--secondary"
                name="intent"
                value={document.publicVisible ? "visibility-off" : "visibility-on"}
                type="submit"
              >
                {document.publicVisible ? copy.detail.publicOff : copy.detail.publicOn}
              </button>
            </Form>
          ) : null}
        </div>

        <section className="supplier-document-timeline">
          <p className="eyebrow">{copy.detail.timeline}</p>
          {timeline.length === 0 ? (
            <p>{copy.detail.noTimeline}</p>
          ) : (
            <ol>
              {timeline.map((event) => (
                <li key={event.id}>
                  <div>
                    <strong>{copy.states[event.decision]}</strong>
                    <span>{formatDate(event.createdAt, context.preferredLanguage)}</span>
                  </div>
                  <p>{event.reason}</p>
                  {event.reviewNote ? <small>{event.reviewNote}</small> : null}
                  <code>{event.effectiveRole}</code>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </SupplierShell>
  );
}

import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import {
  SupplierRouteError,
  SupplierRouteFallback,
  SupplierShell,
} from "~/components/supplier-shell";
import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";
import { supplierDocumentCopy } from "~/lib/supplier/documents/copy";
import { supplierDocumentErrorMessage } from "~/lib/supplier/documents/errors";
import {
  loadSupplierDocumentWorkspace,
  uploadSupplierCompanyDocument,
} from "~/lib/supplier/documents/service.server";

import type { Route } from "./+types/supplier.documents.upload";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Upload Supplier company document — OpenMarket.tr" }];
}

function optionalDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(`${value.trim()}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function loader({ request }: Route.LoaderArgs) {
  const [context, workspace] = await Promise.all([
    loadSupplierOnboardingRouteContext(env, request),
    loadSupplierDocumentWorkspace(env, request),
  ]);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  const url = new URL(request.url);
  return {
    context,
    workspace,
    selectedType: url.searchParams.get("type"),
    replacesDocumentId: url.searchParams.get("replaces"),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const [context, workspace] = await Promise.all([
    loadSupplierOnboardingRouteContext(env, request),
    loadSupplierDocumentWorkspace(env, request),
  ]);
  if (!context) throw redirect("/auth/login");
  const copy = supplierDocumentCopy(context.preferredLanguage);
  if (!workspace) return data({ error: copy.upload.noCompany }, { status: 409 });
  if (!workspace.canEdit) return data({ error: copy.upload.readOnly }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return data({ error: copy.upload.failure }, { status: 400 });
  }

  try {
    const uploaded = await uploadSupplierCompanyDocument(env, request, {
      companyId: workspace.company.id,
      documentTypeKey: String(formData.get("documentTypeKey") ?? ""),
      file,
      issueDate: optionalDate(formData.get("issueDate")),
      expiresAt: optionalDate(formData.get("expiresAt")),
      retentionUntil: optionalDate(formData.get("retentionUntil")),
      replacesDocumentId: String(formData.get("replacesDocumentId") ?? "").trim() || null,
    });
    return redirect(`/supplier/documents/${uploaded.id}?stored=1`);
  } catch (error) {
    return data(
      { error: supplierDocumentErrorMessage(error, context.preferredLanguage) ?? copy.upload.failure },
      { status: 400 },
    );
  }
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S06" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S06" error={error} />;
}

export default function SupplierDocumentUpload({ loaderData, actionData }: Route.ComponentProps) {
  const { context, workspace } = loaderData;
  const copy = supplierDocumentCopy(context.preferredLanguage);
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const primaryLabel = context.preferredLanguage === "en" ? "labelEn" : "labelTr";

  return (
    <SupplierShell
      current="S06"
      language={context.preferredLanguage}
      companyName={workspace?.company.legalName ?? context.verifiedCompanyName}
      status={workspace?.company.status as never}
      membershipRole={workspace?.membershipRole}
    >
      <section className="supplier-page">
        <div className="supplier-page__heading">
          <p className="eyebrow">S06 · Company document upload</p>
          <h1>{copy.upload.title}</h1>
          <p>{copy.upload.description}</p>
        </div>

        {actionData?.error ? (
          <div className="form-alert" role="alert">
            {actionData.error}
          </div>
        ) : null}

        {!workspace ? (
          <div className="supplier-state supplier-state--empty">
            <p>{copy.upload.noCompany}</p>
            <Link className="button button--primary" to="/supplier/company">
              {context.preferredLanguage === "tr"
                ? "Şirket profilini oluştur"
                : "Create company profile"}
            </Link>
          </div>
        ) : !workspace.canEdit ? (
          <div className="supplier-state supplier-state--warning">
            <p>{copy.upload.readOnly}</p>
            <Link className="button button--secondary" to="/supplier/documents">
              {context.preferredLanguage === "tr" ? "Belgelere dön" : "Return to documents"}
            </Link>
          </div>
        ) : (
          <Form className="supplier-form supplier-document-upload-form" method="post" encType="multipart/form-data">
            <fieldset disabled={submitting}>
              <input
                type="hidden"
                name="replacesDocumentId"
                value={loaderData.replacesDocumentId ?? ""}
              />

              <label className="supplier-field supplier-field--wide">
                <span>{copy.upload.type}</span>
                <select name="documentTypeKey" defaultValue={loaderData.selectedType ?? ""} required>
                  <option value="" disabled>
                    {context.preferredLanguage === "tr" ? "Belge türü seçin" : "Select document type"}
                  </option>
                  {workspace.requirements.map((requirement) => (
                    <option key={requirement.documentTypeKey} value={requirement.documentTypeKey}>
                      {requirement[primaryLabel]} · {copy.levels[requirement.level]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="supplier-field supplier-field--wide">
                <span>{copy.upload.file}</span>
                <input name="file" type="file" accept="application/pdf,image/jpeg,image/png" required />
              </label>

              <div className="supplier-form-grid">
                <label className="supplier-field">
                  <span>{copy.upload.issueDate}</span>
                  <input name="issueDate" type="date" />
                </label>
                <label className="supplier-field">
                  <span>{copy.upload.expiryDate}</span>
                  <input name="expiresAt" type="date" />
                  <small>{copy.upload.expiryHint}</small>
                </label>
                <label className="supplier-field supplier-field--wide">
                  <span>{copy.upload.retentionDate}</span>
                  <input name="retentionUntil" type="date" />
                  <small>{copy.upload.retentionHint}</small>
                </label>
              </div>

              <div className="supplier-document-private-notice">
                <strong>{context.preferredLanguage === "tr" ? "Özel depolama" : "Private storage"}</strong>
                <p>{copy.documents.scannerNotice}</p>
              </div>

              <div className="supplier-save-bar">
                <Link className="button button--secondary" to="/supplier/documents">
                  {context.preferredLanguage === "tr" ? "Vazgeç" : "Cancel"}
                </Link>
                <button className="button button--primary" type="submit">
                  {submitting ? copy.upload.submitting : copy.upload.submit}
                </button>
              </div>
            </fieldset>
          </Form>
        )}
      </section>
    </SupplierShell>
  );
}

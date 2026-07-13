import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import {
  SupplierRouteError,
  SupplierRouteFallback,
  SupplierShell,
} from "~/components/supplier-shell";
import { supplierFormErrors, type SupplierFormErrors } from "~/lib/supplier/form-errors";
import {
  formFoundedYear,
  formOptionalString,
  formString,
  parseExportMarketCodes,
} from "~/lib/supplier/onboarding";
import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";
import { createSupplierCompany, updateSupplierCompanyProfile } from "~/lib/supplier/profile.server";
import { supplierScreenCopy } from "~/lib/supplier/screen-copy";

import type { Route } from "./+types/supplier.company";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Supplier company profile / Tedarikçi şirket profili — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  return { ...context, saved: new URL(request.url).searchParams.get("saved") === "1" };
}

type CompanyFormValues = {
  legalName: string;
  tradingName: string;
  countryCode: string;
  city: string;
  website: string;
  description: string;
  foundedYear: string;
  exportMarkets: string;
};

function companyFormValues(formData: FormData): CompanyFormValues {
  return {
    legalName: formString(formData, "legalName"),
    tradingName: formString(formData, "tradingName"),
    countryCode: formString(formData, "countryCode"),
    city: formString(formData, "city"),
    website: formString(formData, "website"),
    description: formString(formData, "description"),
    foundedYear: formString(formData, "foundedYear"),
    exportMarkets: formString(formData, "exportMarkets"),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");

  const copy = supplierScreenCopy(context.preferredLanguage).company;
  const formData = await request.formData();
  const values = companyFormValues(formData);
  const reject = (errors: SupplierFormErrors, status: number) =>
    data({ errors, values }, { status });

  if (!context.hasSupplierIntent) {
    return reject({ form: copy.intentFailure }, 403);
  }
  if (!context.businessIdentityVerified) {
    return reject({ form: copy.identityFailure }, 409);
  }
  if (context.company && !context.canEditCompany) {
    return reject({ form: copy.readOnlyFailure }, 403);
  }

  const input = {
    legalName: values.legalName,
    tradingName: formOptionalString(formData, "tradingName"),
    countryCode: values.countryCode,
    city: values.city,
    website: formOptionalString(formData, "website"),
    description: formOptionalString(formData, "description"),
    foundedYear: formFoundedYear(formData),
    supplierTypeKeys: context.company?.supplierTypeKeys ?? [],
    applicationContextKeys: context.company?.applicationContextKeys ?? [],
    productionCapabilityKeys: context.company?.productionCapabilityKeys ?? [],
    exportMarketCountryCodes: parseExportMarketCodes(values.exportMarkets),
  };

  try {
    if (context.company) {
      await updateSupplierCompanyProfile(env, request, context.company.company.id, input);
    } else {
      await createSupplierCompany(env, request, input);
    }
    return redirect("/supplier/company?saved=1");
  } catch (error) {
    const errors = supplierFormErrors(error, context.preferredLanguage);
    if (errors) return reject(errors, 400);
    return reject({ form: copy.saveFailure }, 503);
  }
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S03" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S03" error={error} />;
}

export default function SupplierCompanyProfile({ loaderData, actionData }: Route.ComponentProps) {
  const screenCopy = supplierScreenCopy(loaderData.preferredLanguage);
  const copy = screenCopy.company;
  const common = screenCopy.common;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const company = loaderData.company;
  const readOnly = Boolean(company && !loaderData.canEditCompany);
  const blocked = !loaderData.hasSupplierIntent || !loaderData.businessIdentityVerified;
  const values: CompanyFormValues = actionData?.values ?? {
    legalName: company?.company.legalName ?? loaderData.verifiedCompanyName ?? "",
    tradingName: company?.company.tradingName ?? "",
    countryCode: company?.company.countryCode ?? "TR",
    city: company?.company.city ?? "",
    website: company?.company.website ?? "",
    description: company?.company.description ?? "",
    foundedYear: company?.company.foundedYear?.toString() ?? "",
    exportMarkets: company?.exportMarketCountryCodes.join(", ") ?? "",
  };
  const errors = actionData?.errors;

  return (
    <SupplierShell
      current="S03"
      language={loaderData.preferredLanguage}
      companyName={company?.company.legalName ?? loaderData.verifiedCompanyName}
      status={company?.company.status}
      membershipRole={company?.membershipRole}
    >
      <section className="supplier-page">
        <div className="supplier-page__heading supplier-page__heading--split">
          <div>
            <p className="eyebrow">S03 · Company profile</p>
            <h1>{company ? copy.updateTitle : copy.createTitle}</h1>
            <p>{copy.description}</p>
          </div>
          {company ? <span className="supplier-status-pill">{company.company.status}</span> : null}
        </div>

        {loaderData.saved ? (
          <div className="form-success" role="status">
            {copy.saved}
          </div>
        ) : null}
        {errors?.form ? (
          <div className="form-alert" role="alert">
            {errors.form}
          </div>
        ) : null}

        {!loaderData.hasSupplierIntent ? (
          <div className="supplier-state supplier-state--warning">
            <h2>{copy.intentTitle}</h2>
            <p>{copy.intentDescription}</p>
            <Link className="button button--primary" to="/onboarding/workspaces">
              {screenCopy.overview.workspaceAction}
            </Link>
          </div>
        ) : !loaderData.businessIdentityVerified ? (
          <div className="supplier-state supplier-state--warning">
            <h2>{copy.identityTitle}</h2>
            <p>{copy.identityDescription}</p>
            <Link className="button button--primary" to="/onboarding/business-identity/status">
              {copy.identityAction}
            </Link>
          </div>
        ) : null}

        {readOnly ? (
          <div className="supplier-readonly-notice">
            <strong>{common.readOnly}</strong>
            <p>{common.readOnlyDescription}</p>
          </div>
        ) : null}

        <Form className="supplier-form" method="post" noValidate>
          <fieldset disabled={blocked || readOnly || submitting}>
            <div className="supplier-form-grid">
              <label className="supplier-field supplier-field--wide">
                <span>{copy.legalName}</span>
                <input
                  name="legalName"
                  defaultValue={values.legalName}
                  autoComplete="organization"
                />
                <small>
                  {copy.verifiedName}: {loaderData.verifiedCompanyName ?? copy.none}
                </small>
                {errors?.legalName ? <em role="alert">{errors.legalName}</em> : null}
              </label>

              <label className="supplier-field">
                <span>{copy.tradingName}</span>
                <input name="tradingName" defaultValue={values.tradingName} />
                {errors?.tradingName ? <em role="alert">{errors.tradingName}</em> : null}
              </label>

              <label className="supplier-field">
                <span>{copy.foundedYear}</span>
                <input name="foundedYear" inputMode="numeric" defaultValue={values.foundedYear} />
                {errors?.foundedYear ? <em role="alert">{errors.foundedYear}</em> : null}
              </label>

              <label className="supplier-field">
                <span>{copy.countryCode}</span>
                <input name="countryCode" maxLength={2} defaultValue={values.countryCode} />
                <small>{copy.countryHint}</small>
                {errors?.countryCode ? <em role="alert">{errors.countryCode}</em> : null}
              </label>

              <label className="supplier-field">
                <span>{copy.city}</span>
                <input name="city" defaultValue={values.city} autoComplete="address-level2" />
                {errors?.city ? <em role="alert">{errors.city}</em> : null}
              </label>

              <label className="supplier-field supplier-field--wide">
                <span>{copy.website}</span>
                <input
                  name="website"
                  type="url"
                  placeholder="https://"
                  defaultValue={values.website}
                />
                {errors?.website ? <em role="alert">{errors.website}</em> : null}
              </label>

              <label className="supplier-field supplier-field--wide">
                <span>{copy.descriptionLabel}</span>
                <textarea name="description" rows={6} defaultValue={values.description} />
                <small>{copy.descriptionHint}</small>
                {errors?.description ? <em role="alert">{errors.description}</em> : null}
              </label>

              <label className="supplier-field supplier-field--wide">
                <span>{copy.exportMarkets}</span>
                <input
                  name="exportMarkets"
                  placeholder="DE, GB, US"
                  defaultValue={values.exportMarkets}
                />
                <small>{copy.exportHint}</small>
                {errors?.exportMarkets ? <em role="alert">{errors.exportMarkets}</em> : null}
              </label>
            </div>

            <section className="supplier-media-placeholder" aria-label={copy.mediaTitle}>
              <div>
                <p className="eyebrow">{copy.mediaEyebrow}</p>
                <h2>{copy.mediaTitle}</h2>
                <p>{copy.mediaDescription}</p>
              </div>
              <button className="button button--secondary" type="button" disabled>
                {copy.mediaLocked}
              </button>
            </section>

            <div className="supplier-save-bar">
              <div>
                <strong>
                  {readOnly ? common.readOnly : company ? copy.existing : copy.newCompany}
                </strong>
                <p>{common.draftBoundary}</p>
              </div>
              <button className="button button--primary" type="submit">
                {submitting ? copy.saving : company ? copy.save : copy.create}
              </button>
            </div>
          </fieldset>
        </Form>
      </section>
    </SupplierShell>
  );
}

import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import {
  SupplierRouteError,
  SupplierRouteFallback,
  SupplierShell,
} from "~/components/supplier-shell";
import { supplierFormErrors, type SupplierFormErrors } from "~/lib/supplier/form-errors";
import { formStringList } from "~/lib/supplier/onboarding";
import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";
import { updateSupplierCompanyProfile } from "~/lib/supplier/profile.server";

import type { Route } from "./+types/supplier.capabilities";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tedarikçi türleri ve kabiliyetler — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  return { ...context, saved: new URL(request.url).searchParams.get("saved") === "1" };
}

type CapabilityFormValues = {
  supplierTypeKeys: string[];
  applicationContextKeys: string[];
  productionCapabilityKeys: string[];
};

function capabilityFormValues(formData: FormData): CapabilityFormValues {
  return {
    supplierTypeKeys: formStringList(formData, "supplierTypeKeys"),
    applicationContextKeys: formStringList(formData, "applicationContextKeys"),
    productionCapabilityKeys: formStringList(formData, "productionCapabilityKeys"),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");

  const formData = await request.formData();
  const values = capabilityFormValues(formData);
  const reject = (errors: SupplierFormErrors, status: number) =>
    data({ errors, values }, { status });

  if (!context.company) {
    return reject({ form: "Önce Supplier şirket profilini oluşturun." }, 409);
  }
  if (!context.canEditCompany) {
    return reject({ form: "Bu üyelik tedarikçi türlerini ve kabiliyetleri düzenleyemez." }, 403);
  }

  const input = {
    legalName: context.company.company.legalName,
    tradingName: context.company.company.tradingName,
    countryCode: context.company.company.countryCode,
    city: context.company.company.city,
    website: context.company.company.website,
    description: context.company.company.description,
    foundedYear: context.company.company.foundedYear,
    supplierTypeKeys: values.supplierTypeKeys,
    applicationContextKeys: values.applicationContextKeys,
    productionCapabilityKeys: values.productionCapabilityKeys,
    exportMarketCountryCodes: context.company.exportMarketCountryCodes,
  };

  try {
    await updateSupplierCompanyProfile(env, request, context.company.company.id, input);
    return redirect("/supplier/capabilities?saved=1");
  } catch (error) {
    const errors = supplierFormErrors(error, context.preferredLanguage);
    if (errors) return reject(errors, 400);
    return reject(
      { form: "Tür ve kabiliyet seçimleri kaydedilemedi. Lütfen yeniden deneyin." },
      503,
    );
  }
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S04" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S04" error={error} />;
}

export default function SupplierCapabilities({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const company = loaderData.company;
  const readOnly = Boolean(company && !loaderData.canEditCompany);
  const values: CapabilityFormValues = actionData?.values ?? {
    supplierTypeKeys: company?.supplierTypeKeys ?? [],
    applicationContextKeys: company?.applicationContextKeys ?? [],
    productionCapabilityKeys: company?.productionCapabilityKeys ?? [],
  };
  const errors = actionData?.errors;

  return (
    <SupplierShell
      current="S04"
      language={loaderData.preferredLanguage}
      companyName={company?.company.legalName ?? loaderData.verifiedCompanyName}
      status={company?.company.status}
      membershipRole={company?.membershipRole}
    >
      <section className="supplier-page">
        <div className="supplier-page__heading supplier-page__heading--split">
          <div>
            <p className="eyebrow">S04 · Supplier types and capabilities</p>
            <h1>Şirketinizin tedarik rolünü tanımlayın</h1>
            <p>
              Birden fazla tedarikçi türü seçilebilir. Üretim kabiliyetleri yalnızca gerçekten
              yürüttüğünüz süreçler için işaretlenmelidir.
            </p>
          </div>
          {company ? <span className="supplier-status-pill">{company.company.status}</span> : null}
        </div>

        {!company ? (
          <div className="supplier-state supplier-state--empty">
            <p className="eyebrow">Ön koşul</p>
            <h2>Önce şirket profilini oluşturun</h2>
            <p>Tür ve kabiliyet seçimleri identity-bound Supplier şirketine bağlanır.</p>
            <Link className="button button--primary" to="/supplier/company">
              Şirket profiline git
            </Link>
          </div>
        ) : (
          <>
            {loaderData.saved ? (
              <div className="form-success" role="status">
                Tedarikçi türleri ve kabiliyetler kaydedildi. Supplier taslak durumu korunuyor.
              </div>
            ) : null}
            {errors?.form ? (
              <div className="form-alert" role="alert">
                {errors.form}
              </div>
            ) : null}
            {readOnly ? (
              <div className="supplier-readonly-notice">
                <strong>Salt okunur üyelik</strong>
                <p>Görüntüleyici rolü seçimleri görebilir ancak değiştiremez.</p>
              </div>
            ) : null}

            <Form className="supplier-form" method="post" noValidate>
              <fieldset disabled={readOnly || submitting}>
                <section className="supplier-form-section">
                  <div className="supplier-form-section__heading">
                    <div>
                      <p className="eyebrow">Supplier type cards</p>
                      <h2>Tedarikçi türleri</h2>
                    </div>
                    <span>Çoklu seçim</span>
                  </div>
                  <div className="supplier-choice-grid supplier-choice-grid--types">
                    {loaderData.supplierTypes.map((entry) => (
                      <label className="supplier-choice-card" key={entry.key}>
                        <input
                          type="checkbox"
                          name="supplierTypeKeys"
                          value={entry.key}
                          defaultChecked={values.supplierTypeKeys.includes(entry.key)}
                        />
                        <span aria-hidden="true" />
                        <div>
                          <strong>{entry.labelTr}</strong>
                          <small>{entry.labelEn}</small>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors?.supplierTypeKeys ? (
                    <p className="field-error" role="alert">
                      {errors.supplierTypeKeys}
                    </p>
                  ) : null}
                </section>

                <section className="supplier-form-section">
                  <div className="supplier-form-section__heading">
                    <div>
                      <p className="eyebrow">Application context selector</p>
                      <h2>Hizmet verdiğiniz kullanım bağlamları</h2>
                    </div>
                    <span>En az bir seçim</span>
                  </div>
                  <div className="supplier-choice-grid">
                    {loaderData.applicationContexts.map((entry) => (
                      <label className="supplier-choice-card" key={entry.key}>
                        <input
                          type="checkbox"
                          name="applicationContextKeys"
                          value={entry.key}
                          defaultChecked={values.applicationContextKeys.includes(entry.key)}
                        />
                        <span aria-hidden="true" />
                        <div>
                          <strong>{entry.labelTr}</strong>
                          <small>{entry.labelEn}</small>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors?.applicationContextKeys ? (
                    <p className="field-error" role="alert">
                      {errors.applicationContextKeys}
                    </p>
                  ) : null}
                </section>

                <section className="supplier-form-section">
                  <div className="supplier-form-section__heading">
                    <div>
                      <p className="eyebrow">Production capability form</p>
                      <h2>Üretim ve özelleştirme kabiliyetleri</h2>
                    </div>
                    <span>İsteğe bağlı</span>
                  </div>
                  <p className="supplier-form-section__intro">
                    İhracatçı, dış ticaret şirketi veya distribütörseniz üretim kabiliyeti seçmeden
                    profilinizi tamamlayabilirsiniz.
                  </p>
                  <div className="supplier-capability-list">
                    {loaderData.productionCapabilities.map((entry) => (
                      <label key={entry.key}>
                        <input
                          type="checkbox"
                          name="productionCapabilityKeys"
                          value={entry.key}
                          defaultChecked={values.productionCapabilityKeys.includes(entry.key)}
                        />
                        <span>
                          <strong>{entry.labelTr}</strong>
                          <small>{entry.labelEn}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors?.productionCapabilityKeys ? (
                    <p className="field-error" role="alert">
                      {errors.productionCapabilityKeys}
                    </p>
                  ) : null}
                </section>

                <div className="supplier-save-bar">
                  <div>
                    <strong>{readOnly ? "Salt okunur" : "Katalog kontrollü seçim"}</strong>
                    <p>Özel veya serbest metin tedarikçi türü eklenemez.</p>
                  </div>
                  <button className="button button--primary" type="submit">
                    {submitting ? "Kaydediliyor…" : "Seçimleri kaydet"}
                  </button>
                </div>
              </fieldset>
            </Form>
          </>
        )}
      </section>
    </SupplierShell>
  );
}

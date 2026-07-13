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

import type { Route } from "./+types/supplier.company";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tedarikçi şirket profili — OpenMarket.tr" }];
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

  const formData = await request.formData();
  const values = companyFormValues(formData);
  const reject = (errors: SupplierFormErrors, status: number) =>
    data({ errors, values }, { status });

  if (!context.hasSupplierIntent) {
    return reject({ form: "Önce Tedarikçi veya Her ikisi çalışma alanını seçin." }, 403);
  }
  if (!context.businessIdentityVerified) {
    return reject({ form: "Supplier şirketi için doğrulanmış iş kimliği gereklidir." }, 409);
  }
  if (context.company && !context.canEditCompany) {
    return reject({ form: "Bu üyelik şirket profilini yalnızca görüntüleyebilir." }, 403);
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
    return reject({ form: "Şirket profili kaydedilemedi. Lütfen yeniden deneyin." }, 503);
  }
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S03" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S03" error={error} />;
}

export default function SupplierCompanyProfile({ loaderData, actionData }: Route.ComponentProps) {
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
            <h1>{company ? "Şirket profilini güncelleyin" : "Supplier şirketini oluşturun"}</h1>
            <p>
              Yasal şirket adı doğrulanmış iş kimliğiyle eşleşir. Profil kaydı şirketi aktif hale
              getirmez.
            </p>
          </div>
          {company ? <span className="supplier-status-pill">{company.company.status}</span> : null}
        </div>

        {loaderData.saved ? (
          <div className="form-success" role="status">
            Şirket profili kaydedildi. Supplier durumu değişmeden korunuyor.
          </div>
        ) : null}
        {errors?.form ? (
          <div className="form-alert" role="alert">
            {errors.form}
          </div>
        ) : null}

        {!loaderData.hasSupplierIntent ? (
          <div className="supplier-state supplier-state--warning">
            <h2>Tedarikçi çalışma alanı izni yok</h2>
            <p>Bu ekranı düzenlemek için çalışma alanı tercihini genişletin.</p>
            <Link className="button button--primary" to="/onboarding/workspaces">
              Çalışma alanını güncelle
            </Link>
          </div>
        ) : !loaderData.businessIdentityVerified ? (
          <div className="supplier-state supplier-state--warning">
            <h2>Doğrulanmış iş kimliği gerekli</h2>
            <p>Yasal şirket adı ancak doğrulanmış bir iş kimliği kaydına bağlanabilir.</p>
            <Link className="button button--primary" to="/onboarding/business-identity/status">
              Doğrulama durumunu aç
            </Link>
          </div>
        ) : null}

        {readOnly ? (
          <div className="supplier-readonly-notice">
            <strong>Salt okunur üyelik</strong>
            <p>Görüntüleyici rolü profil alanlarını inceleyebilir ancak kaydedemez.</p>
          </div>
        ) : null}

        <Form className="supplier-form" method="post" noValidate>
          <fieldset disabled={blocked || readOnly || submitting}>
            <div className="supplier-form-grid">
              <label className="supplier-field supplier-field--wide">
                <span>Yasal şirket adı</span>
                <input
                  name="legalName"
                  defaultValue={values.legalName}
                  autoComplete="organization"
                />
                <small>
                  Doğrulanmış şirket adı: {loaderData.verifiedCompanyName ?? "henüz yok"}
                </small>
                {errors?.legalName ? <em role="alert">{errors.legalName}</em> : null}
              </label>

              <label className="supplier-field">
                <span>Ticari ad</span>
                <input name="tradingName" defaultValue={values.tradingName} />
                {errors?.tradingName ? <em role="alert">{errors.tradingName}</em> : null}
              </label>

              <label className="supplier-field">
                <span>Kuruluş yılı</span>
                <input name="foundedYear" inputMode="numeric" defaultValue={values.foundedYear} />
                {errors?.foundedYear ? <em role="alert">{errors.foundedYear}</em> : null}
              </label>

              <label className="supplier-field">
                <span>Ülke kodu</span>
                <input name="countryCode" maxLength={2} defaultValue={values.countryCode} />
                <small>İki harfli ülke kodu biçimi kullanılır.</small>
                {errors?.countryCode ? <em role="alert">{errors.countryCode}</em> : null}
              </label>

              <label className="supplier-field">
                <span>Şehir</span>
                <input name="city" defaultValue={values.city} autoComplete="address-level2" />
                {errors?.city ? <em role="alert">{errors.city}</em> : null}
              </label>

              <label className="supplier-field supplier-field--wide">
                <span>Web sitesi</span>
                <input
                  name="website"
                  type="url"
                  placeholder="https://"
                  defaultValue={values.website}
                />
                {errors?.website ? <em role="alert">{errors.website}</em> : null}
              </label>

              <label className="supplier-field supplier-field--wide">
                <span>Şirket açıklaması</span>
                <textarea name="description" rows={6} defaultValue={values.description} />
                <small>
                  Ürün aileleri, hedef sektörler ve şirketin çalışma biçimini en az 20 karakterle
                  açıklayın.
                </small>
                {errors?.description ? <em role="alert">{errors.description}</em> : null}
              </label>

              <label className="supplier-field supplier-field--wide">
                <span>İhracat pazarları</span>
                <input
                  name="exportMarkets"
                  placeholder="DE, GB, US"
                  defaultValue={values.exportMarkets}
                />
                <small>İki harfli kodları virgül, boşluk veya noktalı virgülle ayırın.</small>
                {errors?.exportMarkets ? <em role="alert">{errors.exportMarkets}</em> : null}
              </label>
            </div>

            <section className="supplier-media-placeholder" aria-label="Şirket medya yükleyici">
              <div>
                <p className="eyebrow">Media uploader</p>
                <h2>Şirket görselleri</h2>
                <p>
                  Logo, tesis ve üretim fotoğrafı yükleme Cloudflare Images yapılandırmasıyla ayrı
                  bir medya diliminde etkinleştirilecek.
                </p>
              </div>
              <button className="button button--secondary" type="button" disabled>
                Medya yükleme henüz kapalı
              </button>
            </section>

            <div className="supplier-save-bar">
              <div>
                <strong>
                  {readOnly
                    ? "Salt okunur"
                    : company
                      ? "Mevcut şirket kaydı"
                      : "Yeni Supplier şirketi"}
                </strong>
                <p>Kaydetme işlemi Supplier durumunu otomatik olarak aktifleştirmez.</p>
              </div>
              <button className="button button--primary" type="submit">
                {submitting ? "Kaydediliyor…" : company ? "Profili kaydet" : "Şirketi oluştur"}
              </button>
            </div>
          </fieldset>
        </Form>
      </section>
    </SupplierShell>
  );
}

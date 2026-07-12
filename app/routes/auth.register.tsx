import { env } from "cloudflare:workers";
import { data, Form, redirect, useNavigation } from "react-router";

import { AuthShell, FieldError } from "~/components/auth-shell";
import { TurnstileField } from "~/components/turnstile-field";
import { readAuthError, registerWithPreferences } from "~/lib/auth/registration.server";
import { hasErrors, type RegistrationErrors, validateRegistration } from "~/lib/auth/registration";
import type { IntendedUse, PreferredLanguage } from "~/lib/db/schema";
import {
  enforceAuthRequest,
  publicAbuseControlError,
  turnstileClientConfiguration,
} from "~/lib/security/auth-abuse.server";

import type { Route } from "./+types/auth.register";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Kayıt ol — OpenMarket.tr" }];
}

export function loader() {
  return turnstileClientConfiguration(env);
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { values, password, errors } = validateRegistration(formData);

  if (hasErrors(errors)) {
    return data({ errors, values }, { status: 400 });
  }

  const abuseResult = await enforceAuthRequest({
    env,
    request,
    formData,
    action: "register",
  });

  if (!abuseResult.ok) {
    const publicError = publicAbuseControlError(abuseResult);
    const responseErrors: RegistrationErrors = { form: publicError.message };
    return data(
      { errors: responseErrors, values },
      { status: publicError.status, headers: publicError.headers },
    );
  }

  try {
    const response = await registerWithPreferences(env, request, {
      name: values.name,
      email: values.email,
      password,
      country: values.country,
      preferredLanguage: values.preferredLanguage as PreferredLanguage,
      intendedUse: values.intendedUse as IntendedUse,
    });

    if (!response.ok) {
      const responseErrors: RegistrationErrors = {
        form: await readAuthError(response),
      };
      return data({ errors: responseErrors, values }, { status: response.status });
    }

    return redirect("/auth/verify-email");
  } catch {
    const responseErrors: RegistrationErrors = {
      form: "Hesap ve tercihler kaydedilemedi. Hiçbir kısmi hesap bırakılmadı; yeniden deneyebilirsiniz.",
    };
    return data({ errors: responseErrors, values }, { status: 503 });
  }
}

export default function Register({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const errors = actionData?.errors;
  const values = actionData?.values;
  const securityUnavailable = !loaderData.bypass && !loaderData.siteKey;

  return (
    <AuthShell
      eyebrow="A02 · Yeni hesap"
      title="Tekstili doğru verilerle buluşturalım."
      description="Hesabınız ücretsizdir. Alıcı veya tedarikçi seçimi yalnızca başlangıç çalışma alanınızı belirler; ticari yetki vermez."
      alternate={{
        label: "Zaten hesabınız var mı?",
        linkLabel: "Giriş yapın",
        href: "/auth/login",
      }}
    >
      <Form method="post" className="auth-form" noValidate>
        {errors?.form ? (
          <div className="form-alert" role="alert">
            {errors.form}
          </div>
        ) : null}

        <div className="field-group">
          <label htmlFor="name">Ad soyad</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={values?.name}
            aria-invalid={Boolean(errors?.name)}
            aria-describedby={errors?.name ? "name-error" : undefined}
            required
          />
          <FieldError id="name-error" message={errors?.name} />
        </div>

        <div className="field-group">
          <label htmlFor="email">E-posta</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={values?.email}
            aria-invalid={Boolean(errors?.email)}
            aria-describedby={errors?.email ? "register-email-error" : undefined}
            required
          />
          <FieldError id="register-email-error" message={errors?.email} />
        </div>

        <div className="field-group">
          <label htmlFor="country">Ülke</label>
          <input
            id="country"
            name="country"
            autoComplete="country-name"
            defaultValue={values?.country}
            aria-invalid={Boolean(errors?.country)}
            aria-describedby={errors?.country ? "country-error" : undefined}
            required
          />
          <FieldError id="country-error" message={errors?.country} />
        </div>

        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="preferredLanguage">Arayüz dili</label>
            <select
              id="preferredLanguage"
              name="preferredLanguage"
              defaultValue={values?.preferredLanguage || "tr"}
              aria-invalid={Boolean(errors?.preferredLanguage)}
              aria-describedby={errors?.preferredLanguage ? "language-error" : undefined}
              required
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
            <FieldError id="language-error" message={errors?.preferredLanguage} />
          </div>

          <fieldset className="field-group field-group--fieldset">
            <legend>Kullanım amacı</legend>
            <label className="choice-row">
              <input
                type="radio"
                name="intendedUse"
                value="buyer"
                defaultChecked={values?.intendedUse === "buyer"}
              />
              Alıcı
            </label>
            <label className="choice-row">
              <input
                type="radio"
                name="intendedUse"
                value="supplier"
                defaultChecked={values?.intendedUse === "supplier"}
              />
              Tedarikçi
            </label>
            <label className="choice-row">
              <input
                type="radio"
                name="intendedUse"
                value="both"
                defaultChecked={!values?.intendedUse || values.intendedUse === "both"}
              />
              Her ikisi
            </label>
            <FieldError id="intended-use-error" message={errors?.intendedUse} />
          </fieldset>
        </div>

        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              aria-invalid={Boolean(errors?.password)}
              aria-describedby={errors?.password ? "register-password-error" : undefined}
              required
            />
            <FieldError id="register-password-error" message={errors?.password} />
          </div>

          <div className="field-group">
            <label htmlFor="confirmPassword">Şifreyi doğrula</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              aria-invalid={Boolean(errors?.confirmPassword)}
              aria-describedby={errors?.confirmPassword ? "confirm-password-error" : undefined}
              required
            />
            <FieldError id="confirm-password-error" message={errors?.confirmPassword} />
          </div>
        </div>

        <TurnstileField siteKey={loaderData.siteKey} action="register" bypass={loaderData.bypass} />

        <button
          className="button button--primary auth-submit"
          type="submit"
          disabled={submitting || securityUnavailable}
        >
          {submitting ? "Hesap oluşturuluyor…" : "Ücretsiz hesap oluştur"}
        </button>
        <p className="form-note">
          Kayıt tamamlandıktan sonra e-posta doğrulaması gerekir. Bu işlem işletme doğrulaması veya
          alıcı/tedarikçi aktivasyonu anlamına gelmez.
        </p>
      </Form>
    </AuthShell>
  );
}

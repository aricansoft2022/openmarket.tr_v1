import { env } from "cloudflare:workers";
import { data, Form, Link, useNavigation } from "react-router";

import { AuthShell, FieldError } from "~/components/auth-shell";
import { TurnstileField } from "~/components/turnstile-field";
import {
  hasRecoveryErrors,
  type EmailRequestErrors,
  validateEmailRequest,
} from "~/lib/auth/recovery";
import { requestVerificationEmail } from "~/lib/auth/recovery.server";
import type { PreferredLanguage } from "~/lib/db/schema";
import {
  enforceAuthRequest,
  publicAbuseControlError,
  turnstileClientConfiguration,
} from "~/lib/security/auth-abuse.server";

import type { Route } from "./+types/auth.verify-email";

export function meta({}: Route.MetaArgs) {
  return [{ title: "E-posta doğrulama — OpenMarket.tr" }];
}

export function loader() {
  return turnstileClientConfiguration(env);
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { values, errors } = validateEmailRequest(formData);

  if (hasRecoveryErrors(errors)) {
    return data({ sent: false, values, errors }, { status: 400 });
  }

  const abuseResult = await enforceAuthRequest({
    env,
    request,
    formData,
    action: "resend-verification",
  });

  if (!abuseResult.ok) {
    const publicError = publicAbuseControlError(abuseResult);
    const responseErrors: EmailRequestErrors = { form: publicError.message };
    return data(
      { sent: false, values, errors: responseErrors },
      { status: publicError.status, headers: publicError.headers },
    );
  }

  try {
    const response = await requestVerificationEmail(env, request, {
      email: values.email,
      preferredLanguage: values.preferredLanguage as PreferredLanguage,
    });

    if (response.status === 429) {
      const responseErrors: EmailRequestErrors = {
        form: "Çok fazla doğrulama isteği yapıldı. Lütfen daha sonra yeniden deneyin.",
      };
      return data({ sent: false, values, errors: responseErrors }, { status: 429 });
    }

    if (!response.ok) throw new Error("Verification request failed.");

    const responseErrors: EmailRequestErrors = {};
    return data({ sent: true, values: { ...values, email: "" }, errors: responseErrors });
  } catch {
    const responseErrors: EmailRequestErrors = {
      form: "Doğrulama isteği şu anda alınamıyor. Lütfen yeniden deneyin.",
    };
    return data({ sent: false, values, errors: responseErrors }, { status: 503 });
  }
}

export default function VerifyEmail({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const errors = actionData?.errors;
  const securityUnavailable = !loaderData.bypass && !loaderData.siteKey;

  return (
    <AuthShell
      eyebrow="A04 · Hesap doğrulama"
      title="E-posta adresinizi doğrulayın."
      description="Doğrulama hesabın size ait olduğunu kanıtlar; alıcı veya tedarikçi ticari aktivasyonunu tek başına açmaz."
      alternate={{
        label: "Hesabınız doğrulandı mı?",
        linkLabel: "Giriş yapın",
        href: "/auth/login",
      }}
    >
      <Form method="post" className="auth-form" noValidate>
        {actionData?.sent ? (
          <div className="form-alert" role="status">
            Adres kayıtlıysa yeni doğrulama bağlantısı hazırlanmıştır. Gelen kutunuzu ve spam
            klasörünü kontrol edin.
          </div>
        ) : null}
        {errors?.form ? (
          <div className="form-alert" role="alert">
            {errors.form}
          </div>
        ) : null}

        <div className="field-group">
          <label htmlFor="email">Kayıt e-postası</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={actionData?.values.email}
            aria-invalid={Boolean(errors?.email)}
            aria-describedby={errors?.email ? "verification-email-error" : undefined}
            required
          />
          <FieldError id="verification-email-error" message={errors?.email} />
        </div>

        <div className="field-group">
          <label htmlFor="preferredLanguage">E-posta dili</label>
          <select
            id="preferredLanguage"
            name="preferredLanguage"
            defaultValue={actionData?.values.preferredLanguage || "tr"}
            aria-invalid={Boolean(errors?.preferredLanguage)}
            aria-describedby={errors?.preferredLanguage ? "verification-language-error" : undefined}
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
          <FieldError id="verification-language-error" message={errors?.preferredLanguage} />
        </div>

        <TurnstileField
          siteKey={loaderData.siteKey}
          action="resend-verification"
          bypass={loaderData.bypass}
        />

        <button
          className="button button--primary auth-submit"
          type="submit"
          disabled={submitting || securityUnavailable}
        >
          {submitting ? "Bağlantı hazırlanıyor…" : "Doğrulama bağlantısını yeniden gönder"}
        </button>
        <p className="form-note">
          E-posta adresini yanlış mı yazdınız? <Link to="/auth/register">Kayıt formuna dönün.</Link>
        </p>
      </Form>
    </AuthShell>
  );
}

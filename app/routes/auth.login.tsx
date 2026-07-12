import { env } from "cloudflare:workers";
import { data, Form, redirect, useNavigation } from "react-router";

import { AuthShell, FieldError } from "~/components/auth-shell";
import {
  readAuthError,
  responseSessionHeaders,
  signInWithEmail,
} from "~/lib/auth/registration.server";
import { hasErrors, type LoginErrors, validateLogin } from "~/lib/auth/registration";

import type { Route } from "./+types/auth.login";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Giriş yap — OpenMarket.tr" }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { values, password, errors } = validateLogin(formData);

  if (hasErrors(errors)) {
    return data({ errors, values }, { status: 400 });
  }

  try {
    const response = await signInWithEmail(env, request, {
      email: values.email,
      password,
    });

    if (!response.ok) {
      const responseErrors: LoginErrors = { form: await readAuthError(response) };
      return data({ errors: responseErrors, values }, { status: response.status });
    }

    return redirect("/", { headers: responseSessionHeaders(response) });
  } catch {
    const responseErrors: LoginErrors = {
      form: "Giriş servisine şu anda ulaşılamıyor. Lütfen yeniden deneyin.",
    };
    return data({ errors: responseErrors, values }, { status: 503 });
  }
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const errors = actionData?.errors;

  return (
    <AuthShell
      eyebrow="A01 · Hesap erişimi"
      title="Tekrar hoş geldiniz."
      description="Kayıt e-postanızla giriş yapın. Giriş e-postası, açık işletme iletişim bilgisi olarak yayımlanmaz."
      alternate={{ label: "Henüz hesabınız yok mu?", linkLabel: "Kayıt olun", href: "/kayit" }}
    >
      <Form method="post" className="auth-form" noValidate>
        {errors?.form ? (
          <div className="form-alert" role="alert">
            {errors.form}
          </div>
        ) : null}

        <div className="field-group">
          <label htmlFor="email">E-posta</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={actionData?.values.email}
            aria-invalid={Boolean(errors?.email)}
            aria-describedby={errors?.email ? "email-error" : undefined}
            required
          />
          <FieldError id="email-error" message={errors?.email} />
        </div>

        <div className="field-group">
          <label htmlFor="password">Şifre</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors?.password)}
            aria-describedby={errors?.password ? "password-error" : undefined}
            required
          />
          <FieldError id="password-error" message={errors?.password} />
        </div>

        <button className="button button--primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
        <p className="form-note">
          Şifre sıfırlama ve Google ile giriş, sonraki güvenlik diliminde etkinleştirilecek.
        </p>
      </Form>
    </AuthShell>
  );
}

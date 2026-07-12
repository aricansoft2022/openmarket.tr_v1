import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import { AuthShell, FieldError } from "~/components/auth-shell";
import {
  hasRecoveryErrors,
  type ResetPasswordErrors,
  validateResetPassword,
} from "~/lib/auth/recovery";
import { resetPassword } from "~/lib/auth/recovery.server";

import type { Route } from "./+types/auth.reset-password";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Yeni şifre — OpenMarket.tr" }];
}

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const providerError = url.searchParams.get("error");

  return {
    token,
    tokenInvalid: Boolean(providerError) || !token,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { token, password, errors } = validateResetPassword(formData);

  if (hasRecoveryErrors(errors)) {
    return data({ token, errors }, { status: 400 });
  }

  try {
    const response = await resetPassword(env, request, {
      token,
      newPassword: password,
    });

    if (!response.ok) {
      const responseErrors: ResetPasswordErrors = {
        token: "Bu bağlantı geçersiz, süresi dolmuş veya daha önce kullanılmış.",
      };
      return data({ token: "", errors: responseErrors }, { status: 400 });
    }

    return redirect("/auth/login?reset=success");
  } catch {
    const responseErrors: ResetPasswordErrors = {
      form: "Şifre şu anda güncellenemiyor. Lütfen yeniden deneyin.",
    };
    return data({ token, errors: responseErrors }, { status: 503 });
  }
}

export default function ResetPassword({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const token = actionData?.token ?? loaderData.token;
  const errors = actionData?.errors;
  const tokenInvalid = loaderData.tokenInvalid || Boolean(errors?.token && !token);

  return (
    <AuthShell
      eyebrow="A07 · Yeni şifre"
      title={tokenInvalid ? "Bağlantı geçerli değil." : "Yeni şifrenizi belirleyin."}
      description={
        tokenInvalid
          ? "Şifre sıfırlama bağlantısı süresi dolmuş, kullanılmış veya eksik olabilir."
          : "Yeni şifre kaydedildiğinde mevcut oturumların tamamı güvenlik amacıyla kapatılır."
      }
      alternate={{
        label: tokenInvalid ? "Yeni bağlantı gerekiyor mu?" : "İşlemi iptal etmek ister misiniz?",
        linkLabel: tokenInvalid ? "Sıfırlama isteyin" : "Girişe dönün",
        href: tokenInvalid ? "/auth/forgot-password" : "/auth/login",
      }}
    >
      {tokenInvalid ? (
        <div className="auth-form auth-success" role="alert">
          <div className="form-alert">
            Token ayrıntıları güvenlik nedeniyle gösterilmez. Yeni bir şifre sıfırlama bağlantısı isteyin.
          </div>
          <Link className="button button--primary auth-submit" to="/auth/forgot-password">
            Yeni bağlantı iste
          </Link>
        </div>
      ) : (
        <Form method="post" className="auth-form" noValidate>
          <input type="hidden" name="token" value={token} />
          {errors?.form ? (
            <div className="form-alert" role="alert">
              {errors.form}
            </div>
          ) : null}
          <FieldError id="reset-token-error" message={errors?.token} />

          <div className="field-group">
            <label htmlFor="password">Yeni şifre</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              aria-invalid={Boolean(errors?.password)}
              aria-describedby={errors?.password ? "reset-password-error" : undefined}
              required
            />
            <FieldError id="reset-password-error" message={errors?.password} />
          </div>

          <div className="field-group">
            <label htmlFor="confirmPassword">Yeni şifreyi doğrula</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              aria-invalid={Boolean(errors?.confirmPassword)}
              aria-describedby={errors?.confirmPassword ? "reset-confirm-error" : undefined}
              required
            />
            <FieldError id="reset-confirm-error" message={errors?.confirmPassword} />
          </div>

          <button className="button button--primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Şifre güncelleniyor…" : "Şifreyi güncelle"}
          </button>
        </Form>
      )}
    </AuthShell>
  );
}

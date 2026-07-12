import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import { AuthShell, FieldError } from "~/components/auth-shell";
import {
  beginGoogleAccountLink,
  loadAccountSecurity,
  unlinkGoogleAccount,
} from "~/lib/auth/account-linking.server";
import { enforceAuthRequest, publicAbuseControlError } from "~/lib/security/auth-abuse.server";

import type { Route } from "./+types/account.security";

type SecurityActionData = {
  error?: string;
  passwordError?: string;
};

export function meta({}: Route.MetaArgs) {
  return [{ title: "Hesap güvenliği — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const snapshot = await loadAccountSecurity(env, request);
  if (!snapshot) throw redirect("/auth/login");

  const url = new URL(request.url);
  return {
    ...snapshot,
    linked: url.searchParams.get("linked") === "success" && snapshot.googleLinked,
    unlinked: url.searchParams.get("unlinked") === "success" && !snapshot.googleLinked,
    linkError: url.searchParams.get("linked") === "error",
  };
}

function publicAccountError(response: Response, intent: string): string {
  if (response.status === 401) return "Oturumunuz sona erdi. Yeniden giriş yapın.";
  if (response.status === 403) return "Mevcut şifreniz doğrulanamadı.";
  if (response.status === 404) return "Google hesabı bu kullanıcıya bağlı değil.";
  if (response.status === 409) {
    return intent === "link-google"
      ? "Google hesabı zaten bağlı."
      : "Son giriş yöntemi kaldırılamaz; önce başka bir giriş yöntemi ekleyin.";
  }
  if (response.status === 503) return "Google bağlantısı bu ortamda henüz kullanılamıyor.";
  return "Hesap güvenliği işlemi tamamlanamadı. Lütfen yeniden deneyin.";
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (intent !== "link-google" && intent !== "unlink-google") {
    return data<SecurityActionData>({ error: "Geçersiz hesap güvenliği işlemi." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return data<SecurityActionData>({ passwordError: "Mevcut şifrenizi girin." }, { status: 400 });
  }

  const abuseResult = await enforceAuthRequest({
    env,
    request,
    formData,
    action: intent === "link-google" ? "account-link" : "account-unlink",
  });
  if (!abuseResult.ok) {
    const publicError = publicAbuseControlError(abuseResult);
    return data<SecurityActionData>(
      { error: publicError.message },
      { status: publicError.status, headers: publicError.headers },
    );
  }

  const response =
    intent === "link-google"
      ? await beginGoogleAccountLink(env, request, password)
      : await unlinkGoogleAccount(env, request, password);

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) {
      return data<SecurityActionData>(
        { error: "Google yönlendirmesi doğrulanamadı." },
        { status: 502 },
      );
    }
    return redirect(location, { headers: response.headers });
  }

  if (!response.ok) {
    if (response.status === 401) throw redirect("/auth/login");
    return data<SecurityActionData>(
      { error: publicAccountError(response, intent) },
      { status: response.status },
    );
  }

  return redirect("/account/security?unlinked=success");
}

export default function AccountSecurity({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const currentIntent = navigation.formData?.get("intent");

  return (
    <AuthShell
      eyebrow="Hesap · Güvenlik"
      title="Giriş yöntemlerinizi yönetin."
      description="Google hesabı yalnızca açık onayınız ve mevcut şifrenizin yeniden doğrulanmasıyla bağlanır veya kaldırılır."
      alternate={{ label: "Ana sayfaya dönmek ister misiniz?", linkLabel: "Ana sayfa", href: "/" }}
    >
      <div className="auth-form">
        {loaderData.linked ? (
          <div className="form-alert" role="status">
            Google hesabı güvenle bağlandı.
          </div>
        ) : null}
        {loaderData.unlinked ? (
          <div className="form-alert" role="status">
            Google bağlantısı kaldırıldı. E-posta ve şifre girişiniz korunuyor.
          </div>
        ) : null}
        {loaderData.linkError ? (
          <div className="form-alert" role="alert">
            Google bağlantısı tamamlanamadı. Hesap bilgileriniz değiştirilmedi.
          </div>
        ) : null}
        {actionData?.error ? (
          <div className="form-alert" role="alert">
            {actionData.error}
          </div>
        ) : null}

        <section className="account-security-section" aria-labelledby="identity-heading">
          <p className="eyebrow">Oturum sahibi</p>
          <h2 id="identity-heading">{loaderData.user.name}</h2>
          <p>{loaderData.user.email}</p>
        </section>

        <section className="account-security-section" aria-labelledby="methods-heading">
          <p className="eyebrow">Giriş yöntemleri</p>
          <h2 id="methods-heading">Bağlı hesaplar</h2>
          <ul className="account-method-list">
            {loaderData.methods.map((method) => (
              <li key={method.id}>
                <strong>
                  {method.providerId === "credential" ? "E-posta ve şifre" : "Google"}
                </strong>
                <span>
                  {method.providerId === "credential"
                    ? "Birincil giriş yöntemi"
                    : "Açıkça bağlandı"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {!loaderData.googleLinked ? (
          <Form method="post" className="auth-form" noValidate>
            <input type="hidden" name="intent" value="link-google" />
            <div className="field-group">
              <label htmlFor="link-password">Mevcut şifre</label>
              <input
                id="link-password"
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                maxLength={128}
                aria-invalid={Boolean(actionData?.passwordError)}
                aria-describedby={actionData?.passwordError ? "link-password-error" : undefined}
                required
              />
              <FieldError id="link-password-error" message={actionData?.passwordError} />
            </div>
            <button
              className="button button--primary auth-submit"
              type="submit"
              disabled={submitting || !loaderData.googleConfigured}
            >
              {submitting && currentIntent === "link-google"
                ? "Google bağlantısı başlatılıyor…"
                : "Google hesabını bağla"}
            </button>
            <p className="form-note">
              {loaderData.googleConfigured
                ? "Google e-postası farklıysa bağlantı reddedilir; profiliniz otomatik değiştirilmez."
                : "Google bağlantısı bu ortamda henüz yapılandırılmadı."}
            </p>
          </Form>
        ) : (
          <Form method="post" className="auth-form" noValidate>
            <input type="hidden" name="intent" value="unlink-google" />
            <div className="field-group">
              <label htmlFor="unlink-password">Mevcut şifre</label>
              <input
                id="unlink-password"
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                maxLength={128}
                aria-invalid={Boolean(actionData?.passwordError)}
                aria-describedby={actionData?.passwordError ? "unlink-password-error" : undefined}
                required
              />
              <FieldError id="unlink-password-error" message={actionData?.passwordError} />
            </div>
            <button
              className="button auth-submit"
              type="submit"
              disabled={submitting || !loaderData.canUnlinkGoogle}
            >
              {submitting && currentIntent === "unlink-google"
                ? "Google bağlantısı kaldırılıyor…"
                : "Google bağlantısını kaldır"}
            </button>
            <p className="form-note">
              Son giriş yöntemi kaldırılamaz.{" "}
              <Link to="/auth/forgot-password">Şifre erişimini yenileyin</Link>.
            </p>
          </Form>
        )}
      </div>
    </AuthShell>
  );
}

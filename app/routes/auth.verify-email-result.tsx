import { Link } from "react-router";

import { AuthShell } from "~/components/auth-shell";

import type { Route } from "./+types/auth.verify-email-result";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Doğrulama sonucu — OpenMarket.tr" }];
}

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const verified = url.searchParams.get("verified") === "1";

  return {
    state: !error && verified ? ("success" as const) : ("error" as const),
  };
}

export default function VerifyEmailResult({ loaderData }: Route.ComponentProps) {
  const success = loaderData.state === "success";

  return (
    <AuthShell
      eyebrow="A05 · Doğrulama sonucu"
      title={success ? "E-posta doğrulandı." : "Bağlantı kullanılamıyor."}
      description={
        success
          ? "Hesap e-postanız doğrulandı. Ticari işlem yapabilmek için iş kimliği adımları ayrıca tamamlanacaktır."
          : "Doğrulama bağlantısı geçersiz, süresi dolmuş veya daha önce kullanılmış olabilir."
      }
      alternate={{
        label: success ? "Devam etmeye hazır mısınız?" : "Yeni bağlantı gerekiyor mu?",
        linkLabel: success ? "Giriş yapın" : "Yeniden gönderin",
        href: success ? "/auth/login" : "/auth/verify-email",
      }}
    >
      <div className="auth-form auth-success" role={success ? "status" : "alert"}>
        <div className="form-alert">
          {success
            ? "Doğrulama tamamlandı. Hesap erişiminiz açıldı."
            : "Güvenlik nedeniyle token ayrıntıları gösterilmez. Yeni bir doğrulama bağlantısı isteyin."}
        </div>
        <Link
          className="button button--primary auth-submit"
          to={success ? "/auth/login" : "/auth/verify-email"}
        >
          {success ? "Girişe devam et" : "Yeni bağlantı iste"}
        </Link>
      </div>
    </AuthShell>
  );
}

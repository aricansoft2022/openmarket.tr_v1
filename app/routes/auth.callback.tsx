import { Link } from "react-router";

import { AuthShell } from "~/components/auth-shell";

import type { Route } from "./+types/auth.callback";

type CallbackState =
  | "success"
  | "account-not-linked"
  | "unavailable"
  | "provider-error"
  | "processing";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Google giriş sonucu — OpenMarket.tr" }];
}

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const error = url.searchParams.get("error")?.toLowerCase();

  let state: CallbackState = "processing";

  if (status === "success" && !error) state = "success";
  else if (error === "account_not_linked") state = "account-not-linked";
  else if (error === "google_unavailable") state = "unavailable";
  else if (error || status === "error") state = "provider-error";

  return { state };
}

const copy: Record<
  CallbackState,
  { title: string; description: string; message: string; action: string; href: string }
> = {
  success: {
    title: "Google ile giriş tamamlandı.",
    description:
      "Bağlı hesabınızla güvenli oturum açıldı. Google profil bilgileri ticari işletme yetkisi oluşturmaz.",
    message: "Hesabınıza devam edebilirsiniz.",
    action: "Ana sayfaya devam et",
    href: "/",
  },
  "account-not-linked": {
    title: "Hesap otomatik bağlanmadı.",
    description:
      "Aynı e-posta görülse bile Google hesabını mevcut hesaba sessizce bağlamıyoruz.",
    message:
      "Önce e-posta ve şifrenizle giriş yapın. Açık onaylı hesap bağlama adımı daha sonra sunulacaktır.",
    action: "E-posta ile giriş yap",
    href: "/auth/login",
  },
  unavailable: {
    title: "Google ile giriş henüz etkin değil.",
    description:
      "Bu ortamda Google OAuth yapılandırması tamamlanmadığı için giriş başlatılmadı.",
    message: "E-posta ve şifre ile güvenli biçimde devam edebilirsiniz.",
    action: "Giriş ekranına dön",
    href: "/auth/login",
  },
  "provider-error": {
    title: "Google girişi tamamlanamadı.",
    description:
      "İstek reddedilmiş, süresi dolmuş veya sağlayıcı yanıtı doğrulanamamış olabilir.",
    message: "Hesap veya sağlayıcı ayrıntıları gösterilmez. Yeniden deneyebilir ya da e-posta ile giriş yapabilirsiniz.",
    action: "Giriş ekranına dön",
    href: "/auth/login",
  },
  processing: {
    title: "Google giriş sonucu bekleniyor.",
    description:
      "Bu sayfa doğrudan açılmış olabilir. Sağlayıcı dönüşü tamamlanmadıysa giriş ekranından yeniden başlatın.",
    message: "Güvenlik nedeniyle callback parametreleri veya token ayrıntıları gösterilmez.",
    action: "Giriş ekranına dön",
    href: "/auth/login",
  },
};

export default function AuthCallback({ loaderData }: Route.ComponentProps) {
  const current = copy[loaderData.state];
  const success = loaderData.state === "success";

  return (
    <AuthShell
      eyebrow="A03 · Google OAuth dönüşü"
      title={current.title}
      description={current.description}
      alternate={{
        label: success ? "Hesabınıza geçmek ister misiniz?" : "Başka bir yöntem kullanmak ister misiniz?",
        linkLabel: current.action,
        href: current.href,
      }}
    >
      <div className="auth-form auth-success" role={success ? "status" : "alert"}>
        <div className="form-alert">{current.message}</div>
        <Link className="button button--primary auth-submit" to={current.href}>
          {current.action}
        </Link>
      </div>
    </AuthShell>
  );
}

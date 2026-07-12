import { Link } from "react-router";

import type { Route } from "./+types/auth.registration-success";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Hesap oluşturuldu — OpenMarket.tr" }];
}

export default function RegistrationSuccess() {
  return (
    <main className="system-page auth-success">
      <p className="eyebrow">A03 · Kayıt tamamlandı</p>
      <h1>Hesabınız oluşturuldu.</h1>
      <p>
        Ülke, dil ve kullanım tercihleriniz hesabınızla birlikte kaydedildi. Ticari alıcı veya
        tedarikçi yetkileri, sonraki işletme doğrulama adımlarından sonra açılır.
      </p>
      <div className="hero__actions">
        <Link className="button button--primary" to="/">
          Ana sayfaya dön
        </Link>
        <Link className="button" to="/giris">
          Giriş ekranını aç
        </Link>
      </div>
    </main>
  );
}

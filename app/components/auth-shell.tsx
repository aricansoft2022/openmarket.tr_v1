import type { ReactNode } from "react";
import { Link } from "react-router";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  alternate,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  alternate: { label: string; linkLabel: string; href: string };
}) {
  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand" to="/" aria-label="OpenMarket.tr ana sayfa">
          <span className="woven-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            OpenMarket<span className="brand__dot">.</span>tr
          </span>
        </Link>
        <span className="auth-header__note">Ücretsiz B2B dizin ve RFQ platformu</span>
      </header>

      <div className="auth-layout">
        <section className="auth-intro" aria-labelledby="auth-title">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
          <dl className="auth-principles">
            <div>
              <dt>Ücretsiz kullanım</dt>
              <dd>Ücretli üyelik, kredi veya komisyon yok.</dd>
            </div>
            <div>
              <dt>Ayrı iş kimliği</dt>
              <dd>Kayıt olmak ticari aktivasyonu otomatik olarak açmaz.</dd>
            </div>
          </dl>
        </section>

        <section className="auth-panel">
          {children}
          <p className="auth-alternate">
            {alternate.label} <Link to={alternate.href}>{alternate.linkLabel}</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  ) : null;
}

import type { ReactNode } from "react";
import { Link } from "react-router";

const steps = [
  { id: "A08", label: "Çalışma alanı", href: "/onboarding/workspaces" },
  { id: "A09", label: "İş kimliği", href: "/onboarding/business-identity" },
  { id: "A10", label: "Durum", href: "/onboarding/business-identity/status" },
] as const;

export function OnboardingShell({
  current,
  title,
  description,
  children,
}: {
  current: "A08" | "A09" | "A10";
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="onboarding-layout">
      <header className="onboarding-header">
        <Link className="brand" to="/" aria-label="OpenMarket.tr ana sayfa">
          <span className="woven-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          OpenMarket<span className="brand__dot">.tr</span>
        </Link>
        <Link to="/account/security">Hesap güvenliği</Link>
      </header>

      <ol className="onboarding-steps" aria-label="Onboarding adımları">
        {steps.map((step) => {
          const active = step.id === current;
          return (
            <li key={step.id} aria-current={active ? "step" : undefined}>
              <span>{step.id}</span>
              <Link to={step.href}>{step.label}</Link>
            </li>
          );
        })}
      </ol>

      <section className="onboarding-intro">
        <p className="eyebrow">{current} · Hesap onboarding</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      <section className="onboarding-panel">{children}</section>

      <footer className="onboarding-footer">
        <span>Ücretsiz kullanım ticari doğrulama kurallarını değiştirmez.</span>
        <Link to="/">Daha sonra devam et</Link>
      </footer>
    </main>
  );
}

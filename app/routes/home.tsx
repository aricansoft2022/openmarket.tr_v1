import { env } from "cloudflare:workers";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "OpenMarket.tr — Textile sourcing, structured" },
    {
      name: "description",
      content:
        "Türkiye merkezli ev ve kontrat tekstili tedarikçileri için ücretsiz B2B dizin ve RFQ platformu.",
    },
  ];
}

export function loader() {
  return {
    environment: env.APP_ENV,
    commitSha: env.COMMIT_SHA,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <div className="utility-bar">
        <span>B2B Directory &amp; RFQ Platform</span>
        <span>Free use. No paid ranking.</span>
      </div>
      <header className="public-header">
        <a className="brand" href="/" aria-label="OpenMarket.tr ana sayfa">
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
        </a>
        <span className="status-chip">Phase 1 identity foundation</span>
      </header>

      <section className="hero">
        <p className="eyebrow">Home &amp; Contract Textiles</p>
        <h1>
          Textile sourcing, <em>structured.</em>
        </h1>
        <p className="hero__copy">
          Ürün, tedarikçi ve çok kalemli satın alma taleplerini tekstile özgü verilerle
          yapılandıran, ücretsiz ve bağış destekli B2B platform.
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href="/kayit">
            Ücretsiz hesap oluştur
          </a>
          <a className="button" href="/giris">
            Giriş yap
          </a>
          <a className="button" href="/health">
            Sistem durumu
          </a>
        </div>
      </section>

      <section className="foundation-grid" aria-label="Foundation status">
        <article>
          <span className="eyebrow">01</span>
          <h2>Source of truth</h2>
          <p>Ürün ve teknik kararlar yalnızca version 2.1 spec üzerinden ilerler.</p>
        </article>
        <article>
          <span className="eyebrow">02</span>
          <h2>Identity foundation</h2>
          <p>Better Auth, PostgreSQL oturumları ve kayıt tercihleri ayrı veri sınırlarında tutulur.</p>
        </article>
        <article>
          <span className="eyebrow">03</span>
          <h2>Safe handoff</h2>
          <p>Her çalışma oturumu STATUS, HANDOFF, DECISIONS ve test sonuçlarını günceller.</p>
        </article>
      </section>

      <footer className="foundation-footer">
        <span>Environment: {loaderData.environment}</span>
        <span>Commit: {loaderData.commitSha}</span>
      </footer>
    </main>
  );
}

import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import {
  SupplierRouteError,
  SupplierRouteFallback,
  SupplierShell,
} from "~/components/supplier-shell";
import {
  buildSupplierOnboardingChecklist,
  supplierChecklistProgress,
} from "~/lib/supplier/onboarding";
import { loadSupplierOnboardingRouteContext } from "~/lib/supplier/onboarding.server";

import type { Route } from "./+types/supplier";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tedarikçi genel bakış — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const context = await loadSupplierOnboardingRouteContext(env, request);
  if (!context) throw redirect("/auth/login");
  if (!context.account.emailVerified) throw redirect("/auth/verify-email");
  return context;
}

export function HydrateFallback() {
  return <SupplierRouteFallback current="S01" />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SupplierRouteError current="S01" error={error} />;
}

export default function SupplierOverview({ loaderData }: Route.ComponentProps) {
  const checklist = buildSupplierOnboardingChecklist({
    language: loaderData.preferredLanguage,
    businessIdentityVerified: loaderData.businessIdentityVerified,
    company: loaderData.company,
  });
  const progress = supplierChecklistProgress(checklist);

  return (
    <SupplierShell
      current="S01"
      language={loaderData.preferredLanguage}
      companyName={loaderData.company?.company.legalName ?? loaderData.verifiedCompanyName}
      status={loaderData.company?.company.status}
      membershipRole={loaderData.company?.membershipRole}
    >
      <section className="supplier-page">
        <div className="supplier-page__heading supplier-page__heading--split">
          <div>
            <p className="eyebrow">S01 · Tedarikçi genel bakış</p>
            <h1>Şirketinizi ticari aktivasyona hazırlayın</h1>
            <p>
              Profil, katalog ve belge adımları birbirinden ayrı doğrulanır. Taslak durumdayken
              ticari etkileşim kapalı kalır.
            </p>
          </div>
          <Link className="button button--primary" to="/supplier/onboarding">
            Onboarding adımlarını aç
          </Link>
        </div>

        {!loaderData.hasSupplierIntent ? (
          <div className="supplier-state supplier-state--warning">
            <p className="eyebrow">Çalışma alanı gerekli</p>
            <h2>Tedarikçi çalışma alanı seçilmedi</h2>
            <p>
              Buyer hesabınızı koruyarak çalışma alanı tercihini “Her ikisi” olarak
              genişletebilirsiniz. Bu seçim tek başına ticari yetki vermez.
            </p>
            <Link className="button button--primary" to="/onboarding/workspaces">
              Çalışma alanını güncelle
            </Link>
          </div>
        ) : !loaderData.businessIdentityVerified ? (
          <div className="supplier-state supplier-state--warning">
            <p className="eyebrow">Aktivasyon engeli</p>
            <h2>İş kimliği doğrulaması tamamlanmadı</h2>
            <p>
              Supplier şirketi, yalnızca doğrulanmış iş kimliği kanıtına bağlanarak oluşturulabilir.
            </p>
            <Link className="button button--primary" to="/onboarding/business-identity/status">
              İş kimliği durumunu görüntüle
            </Link>
          </div>
        ) : !loaderData.company ? (
          <div className="supplier-state supplier-state--empty">
            <p className="eyebrow">Boş durum</p>
            <h2>Henüz Supplier şirketi oluşturulmadı</h2>
            <p>
              Doğrulanmış <strong>{loaderData.verifiedCompanyName}</strong> kimliğiyle minimum
              şirket profilini oluşturarak başlayın.
            </p>
            <Link className="button button--primary" to="/supplier/company">
              Şirket profilini oluştur
            </Link>
          </div>
        ) : null}

        <section className="supplier-activation-banner" aria-label="Aktivasyon durumu">
          <div>
            <p className="eyebrow">Activation banner</p>
            <h2>
              {loaderData.company?.company.status === "active_supplier"
                ? "Tedarikçi aktif"
                : "Ticari etkileşim henüz kapalı"}
            </h2>
            <p>
              {loaderData.company?.company.status === "active_supplier"
                ? "Aktif Supplier yetkileri bu hesaba ve şirkete göre uygulanır."
                : "Ürün taslakları hazırlanabilir; yayınlama, RFQ yanıtlama ve doğrudan talep alma belge onayından sonra açılır."}
            </p>
          </div>
          <span className="supplier-status-pill">
            {loaderData.company?.company.status ?? "supplier_not_created"}
          </span>
        </section>

        <section className="supplier-progress-panel">
          <div className="supplier-progress-panel__header">
            <div>
              <p className="eyebrow">Onboarding progress</p>
              <h2>
                {progress.complete} / {progress.total} adım tamamlandı
              </h2>
            </div>
            <strong>%{progress.percent}</strong>
          </div>
          <div
            className="supplier-progress-track"
            aria-label={`Onboarding ilerlemesi yüzde ${progress.percent}`}
          >
            <i style={{ width: `${progress.percent}%` }} />
          </div>
          <ol className="supplier-progress-list">
            {checklist.map((item) => (
              <li key={item.id} className={item.complete ? "is-complete" : undefined}>
                <span aria-hidden="true">{item.complete ? "✓" : "•"}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="supplier-dashboard-grid">
          <section className="supplier-dashboard-card">
            <p className="eyebrow">Product summary</p>
            <h2>0 ürün taslağı</h2>
            <p>Ürün oluşturma issue #6 kapsamı dışında ayrı bir ürün sihirbazı dilimidir.</p>
            <button className="button button--secondary" type="button" disabled>
              Ürün oluşturma kilitli
            </button>
          </section>
          <section className="supplier-dashboard-card">
            <p className="eyebrow">Matched RFQ feed</p>
            <h2>Eşleşen RFQ yok</h2>
            <p>RFQ eşleştirme ve yanıtlama yalnızca aktif Supplier şirketlerine açılır.</p>
          </section>
          <section className="supplier-dashboard-card">
            <p className="eyebrow">Enquiry feed</p>
            <h2>Doğrudan talep kapalı</h2>
            <p>İletişim bilgileri ve ticari talepler aktivasyon tamamlanmadan görünmez.</p>
          </section>
          <section className="supplier-dashboard-card">
            <p className="eyebrow">Document expiry panel</p>
            <h2>Belge takibi henüz başlamadı</h2>
            <p>
              Şirket belgesi yükleme, inceleme ve son-kullanma tarihi takibi issue #7’de açılacak.
            </p>
          </section>
        </div>
      </section>
    </SupplierShell>
  );
}

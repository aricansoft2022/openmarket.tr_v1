import type { ReactNode } from "react";
import { Link, isRouteErrorResponse } from "react-router";

import type { SupplierMembershipRole, SupplierWorkspaceStatus } from "~/lib/db/schema";

const navigation = [
  { id: "S01", label: "Genel bakış", href: "/supplier" },
  { id: "S02", label: "Onboarding", href: "/supplier/onboarding" },
  { id: "S03", label: "Şirket profili", href: "/supplier/company" },
  { id: "S04", label: "Türler ve kabiliyetler", href: "/supplier/capabilities" },
] as const;

const statusLabels: Record<SupplierWorkspaceStatus, string> = {
  supplier_draft: "Tedarikçi taslağı",
  company_documents_required: "Şirket belgeleri gerekli",
  company_documents_pending: "Şirket belgeleri inceleniyor",
  company_documents_rejected: "Şirket belgeleri reddedildi",
  active_supplier: "Aktif tedarikçi",
  reactivation_required: "Yeniden aktivasyon gerekli",
  suspended_supplier: "Tedarikçi askıya alındı",
};

const roleLabels: Record<SupplierMembershipRole, string> = {
  owner: "Sahip",
  admin: "Yönetici",
  editor: "Editör",
  viewer: "Görüntüleyici",
};

export function SupplierShell({
  current,
  companyName,
  status,
  membershipRole,
  children,
}: {
  current: "S01" | "S02" | "S03" | "S04";
  companyName?: string | null;
  status?: SupplierWorkspaceStatus | null;
  membershipRole?: SupplierMembershipRole | null;
  children: ReactNode;
}) {
  return (
    <main className="supplier-layout">
      <header className="supplier-header">
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
        <div className="supplier-header__identity">
          <span>{companyName || "Tedarikçi çalışma alanı"}</span>
          {membershipRole ? <small>{roleLabels[membershipRole]}</small> : null}
        </div>
      </header>

      <div className="supplier-workspace">
        <aside className="supplier-sidebar">
          <div className="supplier-sidebar__title">
            <p className="eyebrow">Supplier workspace</p>
            <strong>{status ? statusLabels[status] : "Kurulum bekleniyor"}</strong>
          </div>
          <nav aria-label="Tedarikçi çalışma alanı">
            <ul>
              {navigation.map((item) => (
                <li key={item.id}>
                  <Link
                    className={item.id === current ? "is-active" : undefined}
                    aria-current={item.id === current ? "page" : undefined}
                    to={item.href}
                  >
                    <span>{item.id}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="supplier-sidebar__notice">
            <strong>Aktivasyon sınırı</strong>
            <p>
              Profil hazırlığı ticari yetki vermez. Belge onayı tamamlanmadan ürün yayınlama ve RFQ
              yanıtlama kapalıdır.
            </p>
          </div>
        </aside>
        <section className="supplier-main">{children}</section>
      </div>
    </main>
  );
}

export function SupplierRouteFallback({ current }: { current: "S01" | "S02" | "S03" | "S04" }) {
  return (
    <SupplierShell current={current}>
      <section className="supplier-page" aria-busy="true">
        <div className="supplier-page__heading">
          <p className="eyebrow">Yükleniyor</p>
          <h1>Tedarikçi çalışma alanı hazırlanıyor</h1>
          <p>Şirket, üyelik ve katalog bilgileri güvenli biçimde yükleniyor.</p>
        </div>
        <div className="supplier-skeleton" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </section>
    </SupplierShell>
  );
}

export function SupplierRouteError({
  current,
  error,
}: {
  current: "S01" | "S02" | "S03" | "S04";
  error: unknown;
}) {
  const message = isRouteErrorResponse(error)
    ? error.statusText || "İstek tamamlanamadı."
    : "Tedarikçi çalışma alanı yüklenemedi. Lütfen yeniden deneyin.";

  return (
    <SupplierShell current={current}>
      <section className="supplier-page">
        <div className="supplier-state supplier-state--error" role="alert">
          <p className="eyebrow">Hata durumu</p>
          <h1>Bu ekran şu anda açılamıyor</h1>
          <p>{message}</p>
          <div className="supplier-actions">
            <Link className="button button--primary" to="/supplier">
              Genel bakışa dön
            </Link>
            <Link className="button button--secondary" to="/account/security">
              Hesap güvenliği
            </Link>
          </div>
        </div>
      </section>
    </SupplierShell>
  );
}

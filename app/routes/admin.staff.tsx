import { env } from "cloudflare:workers";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import {
  grantStaffAssignment,
  loadStaffAssignments,
  revokeStaffAssignment,
  StaffManagementError,
} from "~/lib/authorization/staff-management.server";
import { StaffAuthorizationError } from "~/lib/authorization/platform-staff.server";
import { managerMayChangeRole } from "~/lib/authorization/platform-staff";
import { platformStaffRoles, type PlatformStaffRole } from "~/lib/db/schema";

import type { Route } from "./+types/admin.staff";

type ActionData = { error?: string };

const roleLabels: Record<PlatformStaffRole, string> = {
  super_admin: "Super Admin",
  platform_admin: "Platform Admin",
  catalogue_content_editor: "Catalogue & Content Editor",
  compliance_reviewer: "Compliance Reviewer",
  product_rfq_moderator: "Product & RFQ Moderator",
  privacy_support_manager: "Privacy & Support Manager",
};

export function meta({}: Route.MetaArgs) {
  return [{ title: "Platform personel yetkileri — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const context = await loadStaffAssignments(env, request);
    const url = new URL(request.url);
    return {
      access: "granted" as const,
      ...context,
      changed: url.searchParams.get("changed"),
    };
  } catch (error) {
    if (error instanceof StaffAuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        throw redirect(`/auth/login?returnTo=${encodeURIComponent("/admin/staff")}`);
      }
      return data({ access: "denied" as const }, { status: 403 });
    }
    throw error;
  }
}

function publicError(error: unknown): { message: string; status: number } {
  if (error instanceof StaffAuthorizationError) {
    if (error.code === "UNAUTHENTICATED") {
      return { message: "Oturumunuz sona erdi. Yeniden giriş yapın.", status: 401 };
    }
    if (error.code === "SELF_MANAGEMENT") {
      return { message: "Kendi platform rolünüzü ekleyemez veya kaldıramazsınız.", status: 403 };
    }
    return { message: "Bu personel yetkisi işlemi için yönetici izniniz yok.", status: 403 };
  }
  if (error instanceof StaffManagementError) {
    const status =
      error.code === "USER_NOT_FOUND" || error.code === "ASSIGNMENT_NOT_FOUND"
        ? 404
        : error.code === "ROLE_NOT_MANAGEABLE"
          ? 403
          : 409;
    const messages: Record<StaffManagementError["code"], string> = {
      USER_NOT_FOUND: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.",
      ROLE_NOT_MANAGEABLE: "Platform Admin, yönetici rollerini değiştiremez; Super Admin gerekir.",
      ASSIGNMENT_ALREADY_ACTIVE: "Bu hesapta seçilen rol zaten aktif.",
      ASSIGNMENT_NOT_FOUND: "Personel rol kaydı bulunamadı.",
      ASSIGNMENT_NOT_ACTIVE: "Yalnız aktif bir rol kaldırılabilir.",
      INVALID_REASON: "İşlem gerekçesi en az 3 karakter olmalıdır.",
    };
    return { message: messages[error.code], status };
  }
  return { message: "Personel yetkisi işlemi tamamlanamadı.", status: 503 };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "grant") {
      const targetEmail = formData.get("targetEmail");
      const role = formData.get("role");
      const reason = formData.get("reason");
      if (
        typeof targetEmail !== "string" ||
        typeof role !== "string" ||
        !platformStaffRoles.includes(role as PlatformStaffRole) ||
        typeof reason !== "string"
      ) {
        return data<ActionData>(
          { error: "Hesap, rol ve gerekçe alanlarını tamamlayın." },
          { status: 400 },
        );
      }
      await grantStaffAssignment(env, request, {
        targetEmail,
        role: role as PlatformStaffRole,
        reason,
      });
      return redirect("/admin/staff?changed=granted");
    }

    if (intent === "revoke") {
      const assignmentId = formData.get("assignmentId");
      const reason = formData.get("reason");
      if (typeof assignmentId !== "string" || typeof reason !== "string") {
        return data<ActionData>(
          { error: "Rol kaydı ve kaldırma gerekçesi zorunludur." },
          { status: 400 },
        );
      }
      await revokeStaffAssignment(env, request, { assignmentId, reason });
      return redirect("/admin/staff?changed=revoked");
    }

    return data<ActionData>({ error: "Geçersiz personel işlemi." }, { status: 400 });
  } catch (error) {
    const result = publicError(error);
    if (result.status === 401) throw redirect("/auth/login?returnTo=%2Fadmin%2Fstaff");
    return data<ActionData>({ error: result.message }, { status: result.status });
  }
}

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default function AdminStaff({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  if (loaderData.access === "denied") {
    return (
      <main className="staff-review staff-review--centered">
        <p className="eyebrow">X04 · Admin yetkisi gerekli</p>
        <h1>Personel rollerini yönetemezsiniz.</h1>
        <p>
          Reviewer, Moderator, Buyer veya Supplier durumu bu alana erişim vermez. Aktif Platform
          Admin ya da Super Admin ataması gerekir.
        </p>
        <Link className="button" to="/">
          Ana sayfaya dön
        </Link>
      </main>
    );
  }

  return (
    <main className="staff-review">
      <header className="staff-review__header">
        <div>
          <p className="eyebrow">Platform operasyonları · Yetki yönetimi</p>
          <h1>Personel rolleri</h1>
          <p>
            Etkin rol: <strong>{loaderData.effectiveRole}</strong>. Kendi rolünüzü
            değiştiremezsiniz; tüm değişiklikler gerekçe ve audit kaydı gerektirir.
          </p>
        </div>
        <Link className="button" to="/admin/business-identity/reviews">
          İnceleme kuyruğu
        </Link>
      </header>

      {loaderData.changed ? (
        <div className="form-alert" role="status">
          Personel rolü başarıyla{" "}
          {loaderData.changed === "granted" ? "etkinleştirildi" : "kaldırıldı"}.
        </div>
      ) : null}
      {actionData?.error ? (
        <div className="form-alert" role="alert">
          {actionData.error}
        </div>
      ) : null}

      <section className="staff-review__panel">
        <p className="eyebrow">Gerekçeli rol ataması</p>
        <h2>Hesaba sabit rol verin</h2>
        <p>
          Yalnız mevcut bir hesap seçilebilir. Platform Admin operasyon rollerini; Super Admin
          ayrıca yönetici rollerini yönetebilir.
        </p>
        <Form method="post" className="auth-form staff-review__grant-form">
          <input type="hidden" name="intent" value="grant" />
          <div className="field-group">
            <label htmlFor="targetEmail">Hesap e-postası</label>
            <input id="targetEmail" name="targetEmail" type="email" autoComplete="off" required />
          </div>
          <div className="field-group">
            <label htmlFor="role">Sabit rol</label>
            <select id="role" name="role" required defaultValue="compliance_reviewer">
              {platformStaffRoles.map((role) => (
                <option
                  key={role}
                  value={role}
                  disabled={!managerMayChangeRole(loaderData.effectiveRole, role)}
                >
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="grantReason">Atama gerekçesi</label>
            <textarea id="grantReason" name="reason" rows={3} minLength={3} required />
          </div>
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? "Kaydediliyor…" : "Rolü etkinleştir"}
          </button>
        </Form>
      </section>

      <div className="staff-review__table-wrap">
        <table className="staff-review__table">
          <thead>
            <tr>
              <th>Hesap</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Atama</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loaderData.value.map((assignment) => {
              const canChange =
                assignment.userId !== loaderData.actor.id &&
                managerMayChangeRole(loaderData.effectiveRole, assignment.role);
              return (
                <tr key={assignment.id}>
                  <td>
                    <strong>{assignment.userName}</strong>
                    <span>{assignment.userEmail}</span>
                  </td>
                  <td>{roleLabels[assignment.role]}</td>
                  <td>
                    {assignment.status}
                    {assignment.revokedAt ? <span>{formatDate(assignment.revokedAt)}</span> : null}
                  </td>
                  <td>
                    {formatDate(assignment.assignedAt)}
                    <span>{assignment.assignmentReason}</span>
                  </td>
                  <td>
                    {assignment.status === "active" ? (
                      <Form method="post" className="staff-review__revoke-form">
                        <input type="hidden" name="intent" value="revoke" />
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <label className="sr-only" htmlFor={`reason-${assignment.id}`}>
                          Kaldırma gerekçesi
                        </label>
                        <input
                          id={`reason-${assignment.id}`}
                          name="reason"
                          placeholder="Kaldırma gerekçesi"
                          minLength={3}
                          required
                          disabled={!canChange || submitting}
                        />
                        <button
                          className="button"
                          type="submit"
                          disabled={!canChange || submitting}
                        >
                          Rolü kaldır
                        </button>
                      </Form>
                    ) : (
                      <span>{assignment.revocationReason ?? "Kaldırıldı"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

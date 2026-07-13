import { index, route, type RouteConfig } from "@react-router/dev/routes";

const routes = [
  index("routes/home.tsx"),
  route("health", "routes/health.ts"),
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/register", "routes/auth.register.tsx"),
  route("auth/google", "routes/auth.google.ts"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("auth/verify-email", "routes/auth.verify-email.tsx"),
  route("auth/verify-email/result", "routes/auth.verify-email-result.tsx"),
  route("auth/forgot-password", "routes/auth.forgot-password.tsx"),
  route("auth/reset-password", "routes/auth.reset-password.tsx"),
  route("account/security", "routes/account.security.tsx"),
  route("onboarding/workspaces", "routes/onboarding.workspaces.tsx"),
  route("onboarding/business-identity", "routes/onboarding.business-identity.tsx"),
  route("onboarding/business-identity/status", "routes/onboarding.business-identity-status.tsx"),
  route(
    "onboarding/business-identity/evidence",
    "routes/onboarding.business-identity-evidence.tsx",
  ),
  route(
    "onboarding/business-identity/evidence/:evidenceId/download",
    "routes/onboarding.business-identity-evidence-download.ts",
  ),
  route("supplier", "routes/supplier.tsx"),
  route("supplier/onboarding", "routes/supplier.onboarding.tsx"),
  route("supplier/company", "routes/supplier.company.tsx"),
  route("supplier/capabilities", "routes/supplier.capabilities.tsx"),
  route("supplier/documents", "routes/supplier.documents.tsx"),
  route("supplier/documents/upload", "routes/supplier.documents.upload.tsx"),
  route("supplier/documents/:documentId", "routes/supplier.documents.$documentId.tsx"),
  route("supplier/document-access/:token", "routes/supplier.document-access.$token.ts"),
  route("admin/supplier-documents", "routes/admin.supplier-documents.tsx"),
  route("admin/supplier-documents/:documentId", "routes/admin.supplier-documents.$documentId.tsx"),
  route("admin/business-identity/reviews", "routes/admin.business-identity-reviews.tsx"),
  route(
    "admin/business-identity/reviews/:reviewId",
    "routes/admin.business-identity-review-detail.tsx",
  ),
  route(
    "admin/business-identity/reviews/:reviewId/evidence/:evidenceId/download",
    "routes/admin.business-identity-review-evidence-download.ts",
  ),
  route("admin/staff", "routes/admin.staff.tsx"),
  route("giris", "routes/auth.login-alias.ts"),
  route("kayit", "routes/auth.register-alias.ts"),
  route("kayit/basarili", "routes/auth.registration-success-alias.ts"),
  route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;

export default routes;

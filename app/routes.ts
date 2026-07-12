import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
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
  route("giris", "routes/auth.login-alias.ts"),
  route("kayit", "routes/auth.register-alias.ts"),
  route("kayit/basarili", "routes/auth.registration-success-alias.ts"),
  route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;

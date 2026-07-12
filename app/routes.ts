import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("health", "routes/health.ts"),
  route("giris", "routes/auth.login.tsx"),
  route("kayit", "routes/auth.register.tsx"),
  route("kayit/basarili", "routes/auth.registration-success.tsx"),
  route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;

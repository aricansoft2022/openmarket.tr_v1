import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import type { PreferredLanguage } from "../db/schema";
import { createAuth, type Auth, type AuthEnvironment } from "./create-auth.server";
import { authRequest } from "./registration.server";

function withTransactionalAuth<T>(
  env: AuthEnvironment,
  operation: (auth: Auth) => Promise<T>,
): Promise<T> {
  return withDatabase(env, (database) =>
    database.transaction((transaction) =>
      operation(createAuth(transaction as unknown as Database, env)),
    ),
  );
}

export function requestVerificationEmail(
  env: AuthEnvironment,
  request: Request,
  input: { email: string; preferredLanguage: PreferredLanguage },
): Promise<Response> {
  return withTransactionalAuth(env, (auth) =>
    auth.handler(
      authRequest(
        request,
        "/api/auth/send-verification-email",
        {
          email: input.email,
          callbackURL: new URL("/auth/verify-email/result", request.url).toString(),
        },
        { locale: input.preferredLanguage },
      ),
    ),
  );
}

export function requestPasswordReset(
  env: AuthEnvironment,
  request: Request,
  input: { email: string; preferredLanguage: PreferredLanguage },
): Promise<Response> {
  return withTransactionalAuth(env, (auth) =>
    auth.handler(
      authRequest(
        request,
        "/api/auth/request-password-reset",
        {
          email: input.email,
          redirectTo: new URL("/auth/reset-password", request.url).toString(),
        },
        { locale: input.preferredLanguage },
      ),
    ),
  );
}

export function resetPassword(
  env: AuthEnvironment,
  request: Request,
  input: { token: string; newPassword: string },
): Promise<Response> {
  return withTransactionalAuth(env, (auth) =>
    auth.handler(
      authRequest(request, "/api/auth/reset-password", {
        token: input.token,
        newPassword: input.newPassword,
      }),
    ),
  );
}

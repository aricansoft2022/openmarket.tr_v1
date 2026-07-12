import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import * as authSchema from "../db/schema/auth";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
  enqueueAuthEmail,
  PASSWORD_RESET_TOKEN_TTL_SECONDS,
} from "./auth-email-outbox.server";
import {
  googleAccountLinkingPolicy,
  googleOAuthProvider,
  type GoogleOAuthEnvironment,
} from "./google-oauth";

export type AuthEnvironment = Pick<
  Env,
  "HYPERDRIVE" | "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL"
> &
  GoogleOAuthEnvironment;

export function createAuth(database: Database, env: AuthEnvironment) {
  const google = googleOAuthProvider(env);

  return betterAuth({
    appName: "OpenMarket.tr",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(database, {
      provider: "pg",
      schema: authSchema,
    }),
    socialProviders: google ? { google } : {},
    account: {
      accountLinking: googleAccountLinkingPolicy,
    },
    emailVerification: {
      expiresIn: EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }, request) => {
        await enqueueAuthEmail(database, {
          userId: user.id,
          email: user.email,
          actionUrl: url,
          template: "auth.verify-email",
          baseUrl: env.BETTER_AUTH_URL,
          request,
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: PASSWORD_RESET_TOKEN_TTL_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        await enqueueAuthEmail(database, {
          userId: user.id,
          email: user.email,
          actionUrl: url,
          template: "auth.reset-password",
          baseUrl: env.BETTER_AUTH_URL,
          request,
        });
      },
    },
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

export function withAuth<T>(
  env: AuthEnvironment,
  operation: (auth: Auth) => Promise<T>,
): Promise<T> {
  return withDatabase(env, (database) => operation(createAuth(database, env)));
}

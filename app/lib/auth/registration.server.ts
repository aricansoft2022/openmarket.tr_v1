import { eq } from "drizzle-orm";

import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import { user, userPreferences, type IntendedUse, type PreferredLanguage } from "../db/schema";
import { createAuth, type AuthEnvironment, withAuth } from "./create-auth.server";

export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
  country: string;
  preferredLanguage: PreferredLanguage;
  intendedUse: IntendedUse;
};

export type LoginInput = {
  email: string;
  password: string;
};

type SignUpPayload = {
  user?: { id?: string };
};

export function authRequest(
  request: Request,
  path: string,
  body: unknown,
  options: { locale?: PreferredLanguage } = {},
): Request {
  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/json",
    origin: new URL(request.url).origin,
  });

  for (const name of ["user-agent", "cf-connecting-ip", "x-forwarded-for"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  if (options.locale) headers.set("x-openmarket-locale", options.locale);

  return new Request(new URL(path, request.url), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export function responseSessionHeaders(response: Response): Headers {
  const headers = new Headers();
  const cookie = response.headers.get("set-cookie");
  if (cookie) headers.append("set-cookie", cookie);
  return headers;
}

export async function readAuthError(response: Response): Promise<string> {
  let code: string | undefined;

  try {
    const payload = (await response.clone().json()) as { code?: string };
    code = payload.code;
  } catch {
    // Use the stable public messages below.
  }

  if (response.status === 403 || code === "EMAIL_NOT_VERIFIED") {
    return "Devam etmek için e-posta adresinizi doğrulayın.";
  }
  if (response.status === 429) {
    return "Çok fazla deneme yapıldı. Lütfen daha sonra yeniden deneyin.";
  }
  if (response.status === 400 || response.status === 401) {
    return "E-posta veya şifre doğrulanamadı.";
  }

  return "İşlem tamamlanamadı. Bilgileri kontrol edip yeniden deneyin.";
}

export function registerWithPreferences(
  env: AuthEnvironment,
  request: Request,
  input: RegistrationInput,
): Promise<Response> {
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const existingBefore = await transaction
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, input.email))
        .limit(1);
      const auth = createAuth(transaction as unknown as Database, env);
      const response = await auth.handler(
        authRequest(
          request,
          "/api/auth/sign-up/email",
          {
            name: input.name,
            email: input.email,
            password: input.password,
            callbackURL: new URL("/auth/verify-email/result?verified=1", request.url).toString(),
          },
          { locale: input.preferredLanguage },
        ),
      );

      if (!response.ok || existingBefore.length > 0) return response;

      const payload = (await response.clone().json()) as SignUpPayload;
      const userId = payload.user?.id;
      if (!userId) throw new Error("Better Auth signup response did not include a user ID.");

      const persistedUser = await transaction
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      if (persistedUser.length === 0) return response;

      await transaction.insert(userPreferences).values({
        userId,
        country: input.country,
        preferredLanguage: input.preferredLanguage,
        intendedUse: input.intendedUse,
      });

      return response;
    }),
  );
}

export function signInWithEmail(
  env: AuthEnvironment,
  request: Request,
  input: LoginInput,
): Promise<Response> {
  return withAuth(env, (auth) =>
    auth.handler(
      authRequest(request, "/api/auth/sign-in/email", {
        email: input.email,
        password: input.password,
      }),
    ),
  );
}

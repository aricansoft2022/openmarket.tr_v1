import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import { userPreferences, type IntendedUse, type PreferredLanguage } from "../db/schema";
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

function authRequest(request: Request, path: string, body: unknown): Request {
  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/json",
    origin: new URL(request.url).origin,
  });

  for (const name of ["user-agent", "cf-connecting-ip", "x-forwarded-for"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

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
  try {
    const payload = (await response.clone().json()) as { message?: string; code?: string };
    if (payload.message) return payload.message;
  } catch {
    // Fall through to the stable public message below.
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
      const auth = createAuth(transaction as unknown as Database, env);
      const response = await auth.handler(
        authRequest(request, "/api/auth/sign-up/email", {
          name: input.name,
          email: input.email,
          password: input.password,
        }),
      );

      if (!response.ok) return response;

      const payload = (await response.clone().json()) as SignUpPayload;
      const userId = payload.user?.id;
      if (!userId) throw new Error("Better Auth signup response did not include a user ID.");

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

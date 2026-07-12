import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { withAuth } from "~/lib/auth/create-auth.server";
import { inspectGoogleOAuthReadiness } from "~/lib/auth/google-oauth";
import { responseSessionHeaders } from "~/lib/auth/registration.server";

import type { Route } from "./+types/auth.google";

function oauthRequest(request: Request): Request {
  const origin = new URL(request.url).origin;

  return new Request(new URL("/api/auth/sign-in/social", origin), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL: new URL("/auth/callback?status=success", origin).toString(),
      errorCallbackURL: new URL("/auth/callback?status=error", origin).toString(),
    }),
  });
}

function safeGoogleAuthorizationUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "accounts.google.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function action({ request }: Route.ActionArgs) {
  if (!inspectGoogleOAuthReadiness(env).configured) {
    return redirect("/auth/callback?error=google_unavailable");
  }

  try {
    const response = await withAuth(env, (auth) => auth.handler(oauthRequest(request)));

    if (response.status >= 300 && response.status < 400) {
      const location = safeGoogleAuthorizationUrl(response.headers.get("location"));
      return location
        ? redirect(location, { headers: responseSessionHeaders(response) })
        : redirect("/auth/callback?error=provider_response");
    }

    const payload = (await response.clone().json()) as { url?: unknown };
    const location = safeGoogleAuthorizationUrl(payload.url);

    return location
      ? redirect(location, { headers: responseSessionHeaders(response) })
      : redirect("/auth/callback?error=provider_response");
  } catch {
    return redirect("/auth/callback?error=provider_unavailable");
  }
}

export function loader() {
  return redirect("/auth/login");
}

import { and, eq } from "drizzle-orm";

import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import { account, auditLogs } from "../db/schema";
import { createAuth, type AuthEnvironment } from "./create-auth.server";
import { inspectGoogleOAuthReadiness } from "./google-oauth";
import { authRequest, responseSessionHeaders } from "./registration.server";

export type AccountMethod = {
  id: string;
  providerId: string;
  accountId: string;
};

export type AccountSecuritySnapshot = {
  user: { id: string; name: string; email: string };
  methods: AccountMethod[];
  googleConfigured: boolean;
  googleLinked: boolean;
  canUnlinkGoogle: boolean;
};

function requestMetadata(request: Request) {
  const ipAddress = request.headers.get("cf-connecting-ip")?.trim();
  return {
    requestId: request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined,
    ipAddress: ipAddress && ipAddress !== "unknown" ? ipAddress : undefined,
  };
}

async function auditProviderChange(
  database: Database,
  input: {
    request: Request;
    actorId: string;
    sessionId?: string;
    accountId: string;
    action: "auth.account.linked" | "auth.account.unlinked";
  },
) {
  const existing = await database
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.actorId, input.actorId),
        eq(auditLogs.resourceType, "auth_account"),
        eq(auditLogs.resourceId, input.accountId),
        eq(auditLogs.action, input.action),
      ),
    )
    .limit(1);

  if (existing.length > 0) return;

  const metadata = requestMetadata(input.request);
  await database.insert(auditLogs).values({
    actorId: input.actorId,
    effectiveRole: "authenticated",
    resourceType: "auth_account",
    resourceId: input.accountId,
    action: input.action,
    oldValue: input.action === "auth.account.unlinked" ? { providerId: "google" } : null,
    newValue: input.action === "auth.account.linked" ? { providerId: "google" } : null,
    reason: "Explicit account-security action",
    requestId: metadata.requestId,
    sessionId: input.sessionId,
    ipAddress: metadata.ipAddress,
  });
}

function asAccountMethod(value: unknown): AccountMethod | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { id?: unknown; providerId?: unknown; accountId?: unknown };
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.providerId !== "string" ||
    typeof candidate.accountId !== "string"
  ) {
    return null;
  }
  return {
    id: candidate.id,
    providerId: candidate.providerId,
    accountId: candidate.accountId,
  };
}

export async function loadAccountSecurity(
  env: AuthEnvironment,
  request: Request,
): Promise<AccountSecuritySnapshot | null> {
  return withDatabase(env, async (database) => {
    const auth = createAuth(database, env);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return null;

    const methods = (await auth.api.listUserAccounts({ headers: request.headers }))
      .map(asAccountMethod)
      .filter((method): method is AccountMethod => Boolean(method));
    const google = methods.find((method) => method.providerId === "google");

    if (google && new URL(request.url).searchParams.get("linked") === "success") {
      await auditProviderChange(database, {
        request,
        actorId: session.user.id,
        sessionId: session.session.id,
        accountId: google.id,
        action: "auth.account.linked",
      });
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      methods,
      googleConfigured: inspectGoogleOAuthReadiness(env).configured,
      googleLinked: Boolean(google),
      canUnlinkGoogle: Boolean(google && methods.length > 1),
    };
  });
}

async function verifyCurrentPassword(
  auth: ReturnType<typeof createAuth>,
  request: Request,
  password: string,
) {
  const response = await auth.handler(
    authRequest(request, "/api/auth/verify-password", { password }),
  );
  return response.ok;
}

function safeGoogleAuthorizationUrl(response: Response): Promise<URL | null> {
  return (async () => {
    let value: unknown;
    if (response.status >= 300 && response.status < 400) {
      value = response.headers.get("location");
    } else {
      try {
        value = ((await response.clone().json()) as { url?: unknown }).url;
      } catch {
        value = null;
      }
    }

    if (typeof value !== "string") return null;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "accounts.google.com" ? url : null;
    } catch {
      return null;
    }
  })();
}

export async function beginGoogleAccountLink(
  env: AuthEnvironment,
  request: Request,
  password: string,
): Promise<Response> {
  if (!inspectGoogleOAuthReadiness(env).configured) {
    return Response.json({ code: "GOOGLE_UNAVAILABLE" }, { status: 503 });
  }

  return withDatabase(env, async (database) => {
    const auth = createAuth(database, env);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
    if (!(await verifyCurrentPassword(auth, request, password))) {
      return Response.json({ code: "INVALID_PASSWORD" }, { status: 403 });
    }

    const methods = await auth.api.listUserAccounts({ headers: request.headers });
    if (methods.some((method) => method.providerId === "google")) {
      return Response.json({ code: "ALREADY_LINKED" }, { status: 409 });
    }

    const callbackURL = new URL("/account/security?linked=success", request.url).toString();
    const response = await auth.handler(
      authRequest(request, "/api/auth/link-social", {
        provider: "google",
        callbackURL,
      }),
    );
    const location = await safeGoogleAuthorizationUrl(response);
    if (!location) return Response.json({ code: "PROVIDER_RESPONSE_INVALID" }, { status: 502 });

    const headers = responseSessionHeaders(response);
    headers.set("location", location.toString());
    return new Response(null, { status: 302, headers });
  });
}

export async function unlinkGoogleAccount(
  env: AuthEnvironment,
  request: Request,
  password: string,
): Promise<Response> {
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scopedDatabase = transaction as unknown as Database;
      const auth = createAuth(scopedDatabase, env);
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
      if (!(await verifyCurrentPassword(auth, request, password))) {
        return Response.json({ code: "INVALID_PASSWORD" }, { status: 403 });
      }

      const methods = (await auth.api.listUserAccounts({ headers: request.headers }))
        .map(asAccountMethod)
        .filter((method): method is AccountMethod => Boolean(method));
      const google = methods.find((method) => method.providerId === "google");
      if (!google) return Response.json({ code: "NOT_LINKED" }, { status: 404 });
      if (methods.length <= 1) {
        return Response.json({ code: "LAST_LOGIN_METHOD" }, { status: 409 });
      }

      const response = await auth.handler(
        authRequest(request, "/api/auth/unlink-account", {
          providerId: "google",
          accountId: google.accountId,
        }),
      );
      if (!response.ok) return response;

      const persisted = await scopedDatabase
        .select({ id: account.id })
        .from(account)
        .where(and(eq(account.userId, session.user.id), eq(account.providerId, "google")))
        .limit(1);
      if (persisted.length > 0) {
        return Response.json({ code: "UNLINK_NOT_PERSISTED" }, { status: 500 });
      }

      await auditProviderChange(scopedDatabase, {
        request,
        actorId: session.user.id,
        sessionId: session.session.id,
        accountId: google.id,
        action: "auth.account.unlinked",
      });

      return Response.json({ ok: true });
    }),
  );
}

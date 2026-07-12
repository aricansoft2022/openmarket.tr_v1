import type { Database } from "../db/client.server";
import { outboxEvents, type AuthEmailTemplate, type PreferredLanguage } from "../db/schema";

export const EMAIL_VERIFICATION_TOKEN_TTL_SECONDS = 60 * 60;
export const PASSWORD_RESET_TOKEN_TTL_SECONDS = 60 * 60;

const eventTypes: Record<AuthEmailTemplate, string> = {
  "auth.verify-email": "auth.email-verification.requested",
  "auth.reset-password": "auth.password-reset.requested",
};

function localeFromRequest(request?: Request): PreferredLanguage {
  const locale = request?.headers.get("x-openmarket-locale")?.toLowerCase();
  return locale === "en" ? "en" : "tr";
}

function safeActionUrl(value: string, baseUrl: string): string {
  const actionUrl = new URL(value);
  const expectedOrigin = new URL(baseUrl).origin;

  if (actionUrl.origin !== expectedOrigin) {
    throw new Error("Auth email action URL must use the configured Better Auth origin.");
  }

  return actionUrl.toString();
}

export async function enqueueAuthEmail(
  database: Database,
  input: {
    userId: string;
    email: string;
    actionUrl: string;
    template: AuthEmailTemplate;
    baseUrl: string;
    request?: Request;
  },
): Promise<void> {
  const ttlSeconds =
    input.template === "auth.verify-email"
      ? EMAIL_VERIFICATION_TOKEN_TTL_SECONDS
      : PASSWORD_RESET_TOKEN_TTL_SECONDS;

  await database.insert(outboxEvents).values({
    aggregateType: "auth-user",
    aggregateId: input.userId,
    eventType: eventTypes[input.template],
    payload: {
      recipient: input.email.trim().toLowerCase(),
      locale: localeFromRequest(input.request),
      template: input.template,
      actionUrl: safeActionUrl(input.actionUrl, input.baseUrl),
    },
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
  });
}

export type GoogleOAuthEnvironment = Partial<
  Pick<Env, "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET">
>;

export type GoogleOAuthReadiness = {
  configured: boolean;
  missing: Array<"GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET">;
};

export type GoogleCallbackState =
  | "success"
  | "account-not-linked"
  | "unavailable"
  | "rate-limited"
  | "security-unavailable"
  | "provider-error"
  | "processing";

const placeholderPattern = /^(?:replace-|example|placeholder|changeme|todo)/i;

function usable(value: string | undefined): value is string {
  return Boolean(value?.trim()) && !placeholderPattern.test(value!.trim());
}

export function inspectGoogleOAuthReadiness(env: GoogleOAuthEnvironment): GoogleOAuthReadiness {
  const missing: GoogleOAuthReadiness["missing"] = [];

  if (!usable(env.GOOGLE_CLIENT_ID)) missing.push("GOOGLE_CLIENT_ID");
  if (!usable(env.GOOGLE_CLIENT_SECRET)) missing.push("GOOGLE_CLIENT_SECRET");

  return { configured: missing.length === 0, missing };
}

export function googleOAuthProvider(env: GoogleOAuthEnvironment) {
  const readiness = inspectGoogleOAuthReadiness(env);
  if (!readiness.configured) return null;

  return {
    clientId: env.GOOGLE_CLIENT_ID!.trim(),
    clientSecret: env.GOOGLE_CLIENT_SECRET!.trim(),
    scope: ["openid", "email", "profile"],
    prompt: "select_account" as const,
    disableSignUp: true,
  };
}

export const googleAccountLinkingPolicy = {
  enabled: true,
  disableImplicitLinking: true,
  allowDifferentEmails: false,
  updateUserInfoOnLink: false,
} as const;

export function resolveGoogleCallbackState(url: URL): GoogleCallbackState {
  const status = url.searchParams.get("status");
  const error = url.searchParams.get("error")?.toLowerCase();

  if (status === "success" && !error) return "success";
  if (error === "account_not_linked") return "account-not-linked";
  if (error === "google_unavailable") return "unavailable";
  if (error === "rate_limited") return "rate-limited";
  if (error === "security_unavailable") return "security-unavailable";
  if (error || status === "error") return "provider-error";
  return "processing";
}

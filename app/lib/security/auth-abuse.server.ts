export const authAbuseActions = [
  "register",
  "login",
  "forgot-password",
  "resend-verification",
  "reset-password",
  "google-start",
] as const;

export type AuthAbuseAction = (typeof authAbuseActions)[number];

export type AuthRateLimitPolicy = {
  limit: number;
  periodSeconds: number;
  requiresTurnstile: boolean;
};

export const authRateLimitPolicies: Record<AuthAbuseAction, AuthRateLimitPolicy> = {
  register: { limit: 5, periodSeconds: 3600, requiresTurnstile: true },
  login: { limit: 10, periodSeconds: 900, requiresTurnstile: false },
  "forgot-password": { limit: 5, periodSeconds: 3600, requiresTurnstile: true },
  "resend-verification": { limit: 5, periodSeconds: 3600, requiresTurnstile: true },
  "reset-password": { limit: 10, periodSeconds: 3600, requiresTurnstile: true },
  "google-start": { limit: 20, periodSeconds: 900, requiresTurnstile: false },
};

export type RateLimitBinding = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

export type AbuseControlResult =
  | { ok: true }
  | {
      ok: false;
      reason: "rate-limited" | "turnstile-missing" | "turnstile-invalid" | "turnstile-unavailable";
      retryAfterSeconds?: number;
    };

export type TurnstileVerification = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

function isConfiguredSecret(value: string | undefined): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length >= 16 && !normalized.includes("replace") && !normalized.includes("example");
}

export function clientAddress(request: Request): string {
  const cloudflareAddress = request.headers.get("CF-Connecting-IP")?.trim();
  if (cloudflareAddress) return cloudflareAddress;

  const forwarded = request.headers.get("X-Forwarded-For")
    ?.split(",")[0]
    ?.trim();
  return forwarded || "unknown";
}

export function authRateLimitKey(request: Request, action: AuthAbuseAction): string {
  return `auth:${action}:${clientAddress(request)}`;
}

export async function verifyTurnstile(input: {
  secret: string | undefined;
  token: string | null | undefined;
  remoteIp?: string;
  expectedAction?: string;
  fetcher?: typeof fetch;
}): Promise<AbuseControlResult> {
  if (!isConfiguredSecret(input.secret)) {
    return { ok: false, reason: "turnstile-unavailable" };
  }

  const token = input.token?.trim();
  if (!token) return { ok: false, reason: "turnstile-missing" };

  const body = new URLSearchParams({
    secret: input.secret,
    response: token,
  });
  if (input.remoteIp) body.set("remoteip", input.remoteIp);

  let response: Response;
  try {
    response = await (input.fetcher ?? fetch)(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
  } catch {
    return { ok: false, reason: "turnstile-unavailable" };
  }

  if (!response.ok) return { ok: false, reason: "turnstile-unavailable" };

  const result = (await response.json()) as TurnstileVerification;
  if (!result.success) return { ok: false, reason: "turnstile-invalid" };
  if (input.expectedAction && result.action !== input.expectedAction) {
    return { ok: false, reason: "turnstile-invalid" };
  }

  return { ok: true };
}

export async function enforceAuthAbuseControls(input: {
  request: Request;
  action: AuthAbuseAction;
  rateLimiter?: RateLimitBinding;
  turnstileSecret?: string;
  turnstileToken?: string | null;
  fetcher?: typeof fetch;
}): Promise<AbuseControlResult> {
  const policy = authRateLimitPolicies[input.action];

  if (!input.rateLimiter) {
    return { ok: false, reason: "turnstile-unavailable" };
  }

  const limited = await input.rateLimiter.limit({
    key: authRateLimitKey(input.request, input.action),
  });
  if (!limited.success) {
    return {
      ok: false,
      reason: "rate-limited",
      retryAfterSeconds: policy.periodSeconds,
    };
  }

  if (!policy.requiresTurnstile) return { ok: true };

  return verifyTurnstile({
    secret: input.turnstileSecret,
    token: input.turnstileToken,
    remoteIp: clientAddress(input.request),
    expectedAction: input.action,
    fetcher: input.fetcher,
  });
}

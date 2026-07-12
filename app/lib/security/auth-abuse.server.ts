export const authAbuseActions = [
  "register",
  "login",
  "forgot-password",
  "resend-verification",
  "reset-password",
  "google-start",
  "account-link",
  "account-unlink",
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
  "account-link": { limit: 5, periodSeconds: 3600, requiresTurnstile: false },
  "account-unlink": { limit: 5, periodSeconds: 3600, requiresTurnstile: false },
};

export type RateLimitBinding = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

export type AuthAbuseEnvironment = {
  APP_ENV?: string;
  AUTH_RATE_LIMITER?: RateLimitBinding;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
};

export type AbuseControlReason =
  | "rate-limited"
  | "abuse-control-unavailable"
  | "turnstile-missing"
  | "turnstile-invalid"
  | "turnstile-unavailable";

export type AbuseControlResult =
  | { ok: true }
  | {
      ok: false;
      reason: AbuseControlReason;
      retryAfterSeconds?: number;
    };

export type TurnstileVerification = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export type PublicAbuseControlError = {
  message: string;
  status: 400 | 429 | 503;
  headers?: Record<string, string>;
};

const placeholderPattern = /^(?:replace-|example|placeholder|changeme|todo)/i;

function isConfiguredValue(value: string | undefined, minimumLength: number): value is string {
  const normalized = value?.trim();
  return Boolean(
    normalized && normalized.length >= minimumLength && !placeholderPattern.test(normalized),
  );
}

export function isLocalAbuseBypass(env: AuthAbuseEnvironment): boolean {
  return env.APP_ENV?.trim().toLowerCase() === "local";
}

export function turnstileClientConfiguration(env: AuthAbuseEnvironment): {
  bypass: boolean;
  siteKey: string | null;
} {
  if (isLocalAbuseBypass(env)) return { bypass: true, siteKey: null };

  return {
    bypass: false,
    siteKey: isConfiguredValue(env.TURNSTILE_SITE_KEY, 8) ? env.TURNSTILE_SITE_KEY.trim() : null,
  };
}

export function clientAddress(request: Request): string {
  const cloudflareAddress = request.headers.get("CF-Connecting-IP")?.trim();
  if (cloudflareAddress) return cloudflareAddress;

  const forwarded = request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim();
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
  if (!isConfiguredValue(input.secret, 16)) {
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
    return { ok: false, reason: "abuse-control-unavailable" };
  }

  let limited: { success: boolean };
  try {
    limited = await input.rateLimiter.limit({
      key: authRateLimitKey(input.request, input.action),
    });
  } catch {
    return { ok: false, reason: "abuse-control-unavailable" };
  }

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

export async function enforceAuthRequest(input: {
  env: AuthAbuseEnvironment;
  request: Request;
  formData: FormData;
  action: AuthAbuseAction;
  fetcher?: typeof fetch;
}): Promise<AbuseControlResult> {
  if (isLocalAbuseBypass(input.env)) return { ok: true };

  const tokenValue = input.formData.get("cf-turnstile-response");

  return enforceAuthAbuseControls({
    request: input.request,
    action: input.action,
    rateLimiter: input.env.AUTH_RATE_LIMITER,
    turnstileSecret: input.env.TURNSTILE_SECRET_KEY,
    turnstileToken: typeof tokenValue === "string" ? tokenValue : null,
    fetcher: input.fetcher,
  });
}

export function publicAbuseControlError(
  result: Exclude<AbuseControlResult, { ok: true }>,
): PublicAbuseControlError {
  if (result.reason === "rate-limited") {
    return {
      message: "Çok fazla istek yapıldı. Lütfen daha sonra yeniden deneyin.",
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds ?? 60),
      },
    };
  }

  if (result.reason === "turnstile-missing" || result.reason === "turnstile-invalid") {
    return {
      message: "Güvenlik doğrulamasını tamamlayıp yeniden deneyin.",
      status: 400,
    };
  }

  return {
    message: "Güvenlik doğrulaması şu anda kullanılamıyor. Lütfen daha sonra yeniden deneyin.",
    status: 503,
  };
}

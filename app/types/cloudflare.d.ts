import type { BackgroundJob } from "~/lib/jobs/types";
import type { RateLimitBinding } from "~/lib/security/auth-abuse.server";

declare global {
  namespace Cloudflare {
    interface Env {
      APP_ENV: string;
      COMMIT_SHA: string;
      HYPERDRIVE: Hyperdrive;
      PRIVATE_DOCUMENTS: R2Bucket;
      BACKGROUND_JOBS: Queue<BackgroundJob>;
      AUTH_RATE_LIMITER: RateLimitBinding;
      TURNSTILE_SITE_KEY: string;
      TURNSTILE_SECRET_KEY: string;
      BETTER_AUTH_SECRET: string;
      BETTER_AUTH_URL: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      CLOUDFLARE_ACCOUNT_ID: string;
      CLOUDFLARE_IMAGES_TOKEN: string;
    }
  }

  interface Env {
    APP_ENV: string;
    COMMIT_SHA: string;
    HYPERDRIVE: Hyperdrive;
    PRIVATE_DOCUMENTS: R2Bucket;
    BACKGROUND_JOBS: Queue<BackgroundJob>;
    AUTH_RATE_LIMITER: RateLimitBinding;
    TURNSTILE_SITE_KEY: string;
    TURNSTILE_SECRET_KEY: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_IMAGES_TOKEN: string;
  }
}

export {};

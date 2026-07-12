import type { BackgroundJob } from "~/lib/jobs/types";

declare global {
  namespace Cloudflare {
    interface Env {
      HYPERDRIVE: Hyperdrive;
      PRIVATE_DOCUMENTS: R2Bucket;
      BACKGROUND_JOBS: Queue<BackgroundJob>;
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
    HYPERDRIVE: Hyperdrive;
    PRIVATE_DOCUMENTS: R2Bucket;
    BACKGROUND_JOBS: Queue<BackgroundJob>;
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

import { env } from "cloudflare:workers";

import { createHealthPayload } from "~/lib/health/create-health-payload";

export function loader() {
  return Response.json(createHealthPayload(env.APP_ENV, env.COMMIT_SHA), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

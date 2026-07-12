import { env } from "cloudflare:workers";

import { assertCoreRuntimeConfig } from "~/lib/config/runtime-contract";
import { createHealthPayload } from "~/lib/health/create-health-payload";

export function loader() {
  const config = assertCoreRuntimeConfig(env);

  return Response.json(createHealthPayload(config.environment, config.commitSha), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

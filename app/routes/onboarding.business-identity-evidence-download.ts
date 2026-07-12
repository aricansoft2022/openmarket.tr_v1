import { env } from "cloudflare:workers";

import { downloadBusinessIdentityEvidence } from "~/lib/business-identity/evidence.server";

import type { Route } from "./+types/onboarding.business-identity-evidence-download";

export async function loader({ request, params }: Route.LoaderArgs) {
  const evidenceId = params.evidenceId;
  if (!evidenceId) return new Response("Not found", { status: 404 });
  return downloadBusinessIdentityEvidence(env, request, evidenceId);
}

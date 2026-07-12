import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { StaffAuthorizationError } from "~/lib/authorization/platform-staff.server";
import { downloadStaffBusinessIdentityEvidence } from "~/lib/business-identity/review.server";

import type { Route } from "./+types/admin.business-identity-review-evidence-download";

export async function loader({ request, params }: Route.LoaderArgs) {
  const reviewId = params.reviewId;
  const evidenceId = params.evidenceId;
  if (!reviewId || !evidenceId) return new Response("Not found", { status: 404 });

  try {
    return await downloadStaffBusinessIdentityEvidence(env, request, reviewId, evidenceId);
  } catch (error) {
    if (error instanceof StaffAuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        throw redirect(
          `/auth/login?returnTo=${encodeURIComponent(`/admin/business-identity/reviews/${reviewId}`)}`,
        );
      }
      return new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
}

import { env } from "cloudflare:workers";

import { withAuth } from "~/lib/auth/create-auth.server";

import type { Route } from "./+types/api.auth.$";

function handleAuthRequest(request: Request): Promise<Response> {
  return withAuth(env, (auth) => auth.handler(request));
}

export function loader({ request }: Route.LoaderArgs) {
  return handleAuthRequest(request);
}

export function action({ request }: Route.ActionArgs) {
  return handleAuthRequest(request);
}

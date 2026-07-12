import { redirect } from "react-router";

import type { Route } from "./+types/auth.registration-success-alias";

export function loader({}: Route.LoaderArgs) {
  return redirect("/auth/verify-email");
}

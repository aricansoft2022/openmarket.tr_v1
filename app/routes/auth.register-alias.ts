import { redirect } from "react-router";

import type { Route } from "./+types/auth.register-alias";

export function loader({}: Route.LoaderArgs) {
  return redirect("/auth/register");
}

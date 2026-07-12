import { redirect } from "react-router";

import type { Route } from "./+types/auth.login-alias";

export function loader({}: Route.LoaderArgs) {
  return redirect("/auth/login");
}

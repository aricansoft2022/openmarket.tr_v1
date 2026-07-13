import { env } from "cloudflare:workers";

import { downloadSupplierDocumentWithGrant } from "~/lib/supplier/documents/service.server";

import type { Route } from "./+types/supplier.document-access.$token";

export async function loader({ request, params }: Route.LoaderArgs) {
  return downloadSupplierDocumentWithGrant(env, request, params.token);
}

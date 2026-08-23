import { assertSameOrigin, json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { dispenserToAdminApi } from "@/lib/api/mappers";
import { store } from "@/lib/server/store";

export const POST = apiRoute(async (request: Request, context: { params: { code: string } }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  return json(dispenserToAdminApi(await store.archiveDispenser(context.params.code, admin.actor)), { headers: { "Cache-Control": "no-store" } });
});

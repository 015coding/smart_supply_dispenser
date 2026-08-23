import { assertSameOrigin, json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { alertToApi } from "@/lib/api/mappers";
import { store } from "@/lib/server/store";

export const POST = apiRoute(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const { id } = await context.params;
  return json(alertToApi(await store.acknowledgeAlert(id, admin.actor)), { headers: { "Cache-Control": "no-store" } });
});

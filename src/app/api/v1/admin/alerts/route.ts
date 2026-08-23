import { json } from "@/lib/api/response";
import { apiRoute, queryParams } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { alertToApi } from "@/lib/api/mappers";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request) => {
  await requireAdmin(request);
  const includeResolved = new URL(request.url).searchParams.get("include_resolved") === "true";
  void queryParams;
  return json({ items: (await store.listAlerts(includeResolved)).map(alertToApi) }, { headers: { "Cache-Control": "no-store" } });
});

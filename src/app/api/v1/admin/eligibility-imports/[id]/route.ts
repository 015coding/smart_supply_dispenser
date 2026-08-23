import { json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request, context: { params: { id: string } }) => {
  await requireAdmin(request);
  return json(await store.getEligibilityImport(context.params.id), { headers: { "Cache-Control": "no-store" } });
});

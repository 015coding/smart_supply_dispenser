import { assertSameOrigin, json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { store } from "@/lib/server/store";

export const POST = apiRoute(async (request: Request, context: { params: { id: string } }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  return json(await store.commitEligibilityImport(context.params.id, admin.actor), { headers: { "Cache-Control": "no-store" } });
});

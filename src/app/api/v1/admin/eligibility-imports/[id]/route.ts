import { json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  await requireAdmin(request);
  const { id } = await context.params;
  return json(await store.getEligibilityImport(id), { headers: { "Cache-Control": "no-store" } });
});

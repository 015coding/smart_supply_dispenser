import { assertSameOrigin, json, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { planToApi } from "@/lib/api/mappers";
import { toPlanInput } from "@/lib/api/admin-input";
import { store } from "@/lib/server/store";
import { planSchema } from "@/lib/validation/schemas";

export const GET = apiRoute(async (request: Request, context: { params: { code: string } }) => {
  await requireAdmin(request);
  return json({ items: (await store.listPlans(context.params.code)).map(planToApi) }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = apiRoute(async (request: Request, context: { params: { code: string } }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const body = parseSchema(planSchema, await readJson(request));
  return json(planToApi(await store.createPlan(context.params.code, toPlanInput(body), admin.actor)), { status: 201, headers: { "Cache-Control": "no-store" } });
});

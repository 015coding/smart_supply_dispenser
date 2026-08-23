import { assertSameOrigin, json, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { movementToApi } from "@/lib/api/mappers";
import { toStockMovementInput } from "@/lib/api/admin-input";
import { store } from "@/lib/server/store";
import { stockMovementSchema } from "@/lib/validation/schemas";

export const POST = apiRoute(async (request: Request, context: { params: Promise<{ code: string }> }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const { code } = await context.params;
  const body = parseSchema(stockMovementSchema, await readJson(request));
  return json(movementToApi(await store.createStockMovement(code, toStockMovementInput(body), admin.actor)), { status: 201, headers: { "Cache-Control": "no-store" } });
});

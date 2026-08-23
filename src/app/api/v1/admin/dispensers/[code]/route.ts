import { assertSameOrigin, json, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { dispenserToAdminApi } from "@/lib/api/mappers";
import { toPatchDispenserInput } from "@/lib/api/admin-input";
import { store } from "@/lib/server/store";
import { notFound } from "@/lib/server/errors";
import { patchDispenserSchema } from "@/lib/validation/schemas";

export const GET = apiRoute(async (request: Request, context: { params: { code: string } }) => {
  await requireAdmin(request);
  return json(dispenserToAdminApi(await store.getAdminDispenser(context.params.code)), { headers: { "Cache-Control": "no-store" } });
});

export const PATCH = apiRoute(async (request: Request, context: { params: { code: string } }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const body = parseSchema(patchDispenserSchema, await readJson(request));
  return json(dispenserToAdminApi(await store.updateDispenser(context.params.code, toPatchDispenserInput(body), admin.actor)), { headers: { "Cache-Control": "no-store" } });
});

export const DELETE = apiRoute(async () => {
  throw notFound("เครื่องแจกสิ่งของไม่สามารถลบถาวรได้ ใช้การเก็บถาวรแทน");
});

import { assertSameOrigin, json, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { recipientToApi } from "@/lib/api/mappers";
import { notFound } from "@/lib/server/errors";
import { recipientDeleteSchema, recipientPatchSchema } from "@/lib/validation/schemas";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  await requireAdmin(request);
  const { id } = await context.params;
  const recipient = await store.getRecipient(id);
  if (!recipient) throw notFound("ไม่พบผู้มีสิทธิ์รับของ");
  return json(recipientToApi(recipient), { headers: { "Cache-Control": "no-store" } });
});

export const PATCH = apiRoute(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const { id } = await context.params;
  const body = parseSchema(recipientPatchSchema, await readJson(request));
  return json(recipientToApi(await store.updateRecipient(id, { citizenId: body.citizen_id, name: body.name, active: body.active }, admin.actor)), { headers: { "Cache-Control": "no-store" } });
});

export const DELETE = apiRoute(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const { id } = await context.params;
  const body = parseSchema(recipientDeleteSchema, await readJson(request));
  await store.deleteRecipient(id, body.confirmation_token, admin.actor);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
});

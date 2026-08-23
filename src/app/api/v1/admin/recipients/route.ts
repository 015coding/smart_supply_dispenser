import { assertSameOrigin, json, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema, queryParams } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { recipientToApi } from "@/lib/api/mappers";
import { recipientCreateSchema, paginationQuerySchema } from "@/lib/validation/schemas";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request) => {
  await requireAdmin(request);
  const query = parseSchema(paginationQuerySchema, queryParams(request));
  const result = await store.listRecipients({ q: query.q, active: query.active === undefined ? undefined : query.active === "true", page: query.page, pageSize: query.page_size });
  return json({ items: result.items.map(recipientToApi), pagination: { page: result.pagination.page, page_size: result.pagination.pageSize, total: result.pagination.total, total_pages: result.pagination.totalPages } }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = apiRoute(async (request: Request) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const body = parseSchema(recipientCreateSchema, await readJson(request));
  const recipient = await store.createRecipient({ citizenId: body.citizen_id, name: body.name, active: body.active }, admin.actor);
  return json(recipientToApi(recipient), { status: 201, headers: { "Cache-Control": "no-store" } });
});

import { assertSameOrigin, json, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema, queryParams } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { dispenserToAdminApi } from "@/lib/api/mappers";
import { toCreateDispenserInput } from "@/lib/api/admin-input";
import { store } from "@/lib/server/store";
import { createDispenserSchema, paginationQuerySchema } from "@/lib/validation/schemas";

export const GET = apiRoute(async (request: Request) => {
  await requireAdmin(request);
  const query = parseSchema(paginationQuerySchema, queryParams(request));
  const result = await store.listAdminDispensers({ q: query.q, lifecycle: query.lifecycle, page: query.page, pageSize: query.page_size });
  return json({ items: result.items.map(dispenserToAdminApi), pagination: { page: result.pagination.page, page_size: result.pagination.pageSize, total: result.pagination.total, total_pages: result.pagination.totalPages } }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = apiRoute(async (request: Request) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const body = parseSchema(createDispenserSchema, await readJson(request));
  const dispenser = await store.createDispenser(toCreateDispenserInput(body), admin.actor);
  return json(dispenserToAdminApi(dispenser), { status: 201, headers: { "Cache-Control": "no-store" } });
});

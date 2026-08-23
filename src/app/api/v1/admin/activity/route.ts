import { json } from "@/lib/api/response";
import { apiRoute, parseSchema, queryParams } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { activityToApi } from "@/lib/api/mappers";
import { paginationQuerySchema } from "@/lib/validation/schemas";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request) => {
  await requireAdmin(request);
  const query = parseSchema(paginationQuerySchema, queryParams(request));
  const result = await store.listActivity(query.page, query.page_size);
  return json({ items: result.items.map(activityToApi), pagination: { page: result.pagination.page, page_size: result.pagination.pageSize, total: result.pagination.total, total_pages: result.pagination.totalPages } }, { headers: { "Cache-Control": "no-store" } });
});

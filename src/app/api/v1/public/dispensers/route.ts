import { json } from "@/lib/api/response";
import { apiRoute, parseSchema, queryParams } from "@/lib/api/route";
import { publicListQuerySchema } from "@/lib/validation/schemas";
import { store } from "@/lib/server/store";
import { publicDispenserToApi } from "@/lib/api/mappers";

export const GET = apiRoute(async (request: Request) => {
  const query = parseSchema(publicListQuerySchema, queryParams(request));
  const result = await store.listPublic({ q: query.q, province: query.province, district: query.district, status: query.status, page: query.page, pageSize: query.page_size });
  return json({
    items: result.items.map(publicDispenserToApi),
    pagination: { page: result.pagination.page, page_size: result.pagination.pageSize, total: result.pagination.total, total_pages: result.pagination.totalPages },
    facets: result.facets
  }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
});

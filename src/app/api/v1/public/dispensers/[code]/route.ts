import { json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { notFound } from "@/lib/server/errors";
import { publicDispenserToApi } from "@/lib/api/mappers";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (_request: Request, context: { params: Promise<{ code: string }> }) => {
  const { code } = await context.params;
  const item = await store.getPublic(code);
  if (!item) throw notFound("ไม่พบเครื่องแจกสิ่งของที่เผยแพร่");
  return json(publicDispenserToApi(item), { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
});

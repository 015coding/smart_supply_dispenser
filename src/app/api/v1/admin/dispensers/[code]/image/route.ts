import { assertSameOrigin, json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { uploadDispenserImage, deleteDispenserImage } from "@/lib/server/images";
import { dispenserToAdminApi } from "@/lib/api/mappers";
import { store } from "@/lib/server/store";

export const PUT = apiRoute(async (request: Request, context: { params: { code: string } }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) throw new Error("กรุณาแนบไฟล์รูปภาพในช่อง image");
  const url = await uploadDispenserImage(context.params.code.toUpperCase(), file);
  const previous = (await store.getAdminDispenser(context.params.code)).imageUrl;
  if (previous) await deleteDispenserImage(previous);
  return json(dispenserToAdminApi(await store.setDispenserImage(context.params.code, url, admin.actor)), { headers: { "Cache-Control": "no-store" } });
});

export const DELETE = apiRoute(async (request: Request, context: { params: { code: string } }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const previous = (await store.getAdminDispenser(context.params.code)).imageUrl;
  await deleteDispenserImage(previous);
  return json(dispenserToAdminApi(await store.setDispenserImage(context.params.code, null, admin.actor)), { headers: { "Cache-Control": "no-store" } });
});

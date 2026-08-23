import { assertSameOrigin, json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { uploadDispenserImage, deleteDispenserImage } from "@/lib/server/images";
import { dispenserToAdminApi } from "@/lib/api/mappers";
import { store } from "@/lib/server/store";

export const PUT = apiRoute(async (request: Request, context: { params: Promise<{ code: string }> }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const { code } = await context.params;
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) throw new Error("กรุณาแนบไฟล์รูปภาพในช่อง image");
  const url = await uploadDispenserImage(code.toUpperCase(), file);
  const previous = (await store.getAdminDispenser(code)).imageUrl;
  if (previous) await deleteDispenserImage(previous);
  return json(dispenserToAdminApi(await store.setDispenserImage(code, url, admin.actor)), { headers: { "Cache-Control": "no-store" } });
});

export const DELETE = apiRoute(async (request: Request, context: { params: Promise<{ code: string }> }) => {
  const admin = await requireAdmin(request);
  assertSameOrigin(request);
  const { code } = await context.params;
  const previous = (await store.getAdminDispenser(code)).imageUrl;
  await deleteDispenserImage(previous);
  return json(dispenserToAdminApi(await store.setDispenserImage(code, null, admin.actor)), { headers: { "Cache-Control": "no-store" } });
});

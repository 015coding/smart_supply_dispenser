import { assertSameOrigin, json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { store } from "@/lib/server/store";

export const POST = apiRoute(async (request: Request) => {
  await requireAdmin(request);
  assertSameOrigin(request);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("กรุณาแนบไฟล์ CSV ในช่อง file");
  if (file.type && !["text/csv", "text/plain", "application/vnd.ms-excel"].includes(file.type)) throw new Error("รองรับเฉพาะไฟล์ CSV");
  return json(await store.previewEligibilityImport(await file.text()), { status: 201, headers: { "Cache-Control": "no-store" } });
});

import { noStore } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireDevice } from "@/lib/api/device-auth";
import { AppError } from "@/lib/server/errors";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request) => {
  const code = await requireDevice(request);
  const rawVersion = new URL(request.url).searchParams.get("version");
  const version = rawVersion ? Number(rawVersion) : Number.NaN;
  if (!Number.isInteger(version) || version < 0) throw new AppError(400, "invalid_snapshot_version", "version ไม่ถูกต้อง");
  const snapshot = await store.eligibilitySnapshot(code, version);
  const body = Buffer.from(snapshot.body, "utf8");
  return new Response(body, {
    status: 200,
    headers: noStore({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Length": String(body.byteLength),
      "X-Snapshot-Version": String(snapshot.version),
      "X-Record-Count": String(snapshot.recordCount),
      "X-Content-SHA256": snapshot.sha256
    })
  });
});

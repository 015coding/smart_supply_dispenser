import { json, noStore, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema } from "@/lib/api/route";
import { requireDevice } from "@/lib/api/device-auth";
import { deviceSyncSchema } from "@/lib/validation/schemas";
import { store } from "@/lib/server/store";

export const POST = apiRoute(async (request: Request) => {
  const code = await requireDevice(request);
  const body = parseSchema(deviceSyncSchema, await readJson(request));
  const result = await store.deviceSync(code, {
    firmwareVersion: body.firmware_version,
    clientVersion: body.client_version,
    clockReady: body.clock_ready,
    appliedPlanVersion: body.applied_plan_version,
    appliedEligibilityVersion: body.applied_eligibility_version,
    appliedStockRevision: body.applied_stock_revision,
    localStock: body.local_stock
  });
  return json({
    server_time: result.serverTime,
    service_day: result.serviceDay,
    desired_plan: result.desiredPlan,
    stock_revision: result.stockRevision,
    eligibility: {
      version: (result.eligibility as { version: number }).version,
      changed: (result.eligibility as { changed: boolean }).changed,
      snapshot_path: (result.eligibility as { snapshotPath: string | null }).snapshotPath
    }
  }, { headers: noStore() });
});

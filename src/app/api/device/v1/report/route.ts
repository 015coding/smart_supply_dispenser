import { json, noStore, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema } from "@/lib/api/route";
import { requireDevice } from "@/lib/api/device-auth";
import { deviceReportSchema } from "@/lib/validation/schemas";
import { store } from "@/lib/server/store";

export const POST = apiRoute(async (request: Request) => {
  const code = await requireDevice(request);
  const body = parseSchema(deviceReportSchema, await readJson(request));
  const result = await store.recordDeviceReport(code, {
    reportId: body.report_id,
    serviceDay: body.service_day,
    localTime: body.local_time,
    citizenId: body.citizen_id,
    outcome: body.outcome,
    channels: body.channels.map((channel) => ({ number: channel.number, result: channel.result, countAfter: channel.count_after })),
    errors: body.errors ?? []
  });
  return json({ accepted: result.accepted, duplicate: result.duplicate, stock_revision: result.stockRevision, reconciled_stock: result.reconciledStock }, { headers: noStore() });
});

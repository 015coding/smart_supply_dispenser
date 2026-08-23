import { json, noStore, readJson } from "@/lib/api/response";
import { apiRoute, parseSchema } from "@/lib/api/route";
import { requireDevice } from "@/lib/api/device-auth";
import { deviceAuthorizeSchema } from "@/lib/validation/schemas";
import { store } from "@/lib/server/store";

export const POST = apiRoute(async (request: Request) => {
  const code = await requireDevice(request);
  const body = parseSchema(deviceAuthorizeSchema, await readJson(request));
  const result = await store.authorizeDevice(code, { citizenId: body.citizen_id, serviceDay: body.service_day, localTime: body.local_time });
  return json({ allowed: result.allowed, reason: result.reason, service_day: result.serviceDay }, { headers: noStore() });
});

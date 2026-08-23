import { json } from "@/lib/api/response";
import { apiRoute, parseSchema, queryParams } from "@/lib/api/route";
import { dashboardQuerySchema } from "@/lib/validation/schemas";
import { requireAdmin } from "@/lib/server/auth-guard";
import { alertToApi, activityToApi, dispenserToAdminApi } from "@/lib/api/mappers";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request) => {
  await requireAdmin(request);
  const query = parseSchema(dashboardQuerySchema, queryParams(request));
  const dashboard = await store.dashboard(query);
  return json({
    range: dashboard.range,
    summary: dashboard.summary,
    alerts: (dashboard.alerts as Awaited<ReturnType<typeof store.listAlerts>>).map(alertToApi),
    recent_dispensers: (dashboard.recentDispensers as Awaited<ReturnType<typeof store.listAdminDispensers>>["items"]).map(dispenserToAdminApi),
    recent_activity: (dashboard.recentActivity as Awaited<ReturnType<typeof store.listActivity>>["items"]).map(activityToApi),
    completed_recipient_chart: dashboard.completedRecipientChart
  }, { headers: { "Cache-Control": "no-store" } });
});

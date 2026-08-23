import { json } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request, context: { params: { code: string } }) => {
  await requireAdmin(request);
  const state = await store.getDeviceState(context.params.code);
  return json({
    ...state,
    last_seen_at: state.lastSeenAt,
    firmware_version: state.firmwareVersion,
    client_version: state.clientVersion,
    applied_plan_version: state.appliedPlanVersion,
    desired_plan_version: state.desiredPlanVersion,
    plan_pending_sync: state.planPendingSync,
    applied_eligibility_version: state.appliedEligibilityVersion,
    desired_eligibility_version: state.desiredEligibilityVersion,
    applied_stock_revision: state.appliedStockRevision,
    desired_stock_revision: state.desiredStockRevision,
    stock_pending_sync: state.stockPendingSync
  }, { headers: { "Cache-Control": "no-store" } });
});

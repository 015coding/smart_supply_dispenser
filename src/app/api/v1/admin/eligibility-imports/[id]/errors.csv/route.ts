import { csvResponse } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request, context: { params: { id: string } }) => {
  await requireAdmin(request);
  return csvResponse(await store.eligibilityImportErrorsCsv(context.params.id), `eligibility-import-${context.params.id}-errors.csv`);
});

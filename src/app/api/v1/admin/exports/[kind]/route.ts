import { csvResponse } from "@/lib/api/response";
import { apiRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/server/auth-guard";
import { AppError } from "@/lib/server/errors";
import { store } from "@/lib/server/store";

export const GET = apiRoute(async (request: Request, context: { params: Promise<{ kind: string }> }) => {
  await requireAdmin(request);
  const { kind } = await context.params;
  const exportsByKind: Record<string, () => Promise<string>> = {
    "dispensers.csv": () => store.exportDispensersCsv(),
    "stock.csv": () => store.exportStockCsv(),
    "recipients.csv": () => store.exportRecipientsCsv(),
    "activity.csv": () => store.exportActivityCsv()
  };
  const exporter = exportsByKind[kind];
  if (!exporter) throw new AppError(404, "export_not_found", "ไม่พบชนิดไฟล์ export");
  return csvResponse(await exporter(), kind);
});

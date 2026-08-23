import { z } from "zod";
import { SERVICE_OVERRIDES, SERVICE_STATUSES } from "@/lib/domain/types";

const nullableNumber = z.number().finite().nullable().optional();

export const channelInputSchema = z.object({
  number: z.coerce.number().int().min(1).max(3),
  supply_name: z.string().max(200).optional(),
  unit: z.string().max(80).optional(),
  capacity: z.coerce.number().int().min(0).max(1_000_000).optional(),
  balance: z.coerce.number().int().min(0).max(1_000_000).optional(),
  low_stock_threshold: z.coerce.number().int().min(0).max(1_000_000).optional(),
  enabled: z.boolean().optional()
});

export const createDispenserSchema = z.object({
  name: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  province: z.string().max(120).optional(),
  district: z.string().max(120).optional(),
  latitude: nullableNumber,
  longitude: nullableNumber,
  contact: z.string().max(120).nullable().optional(),
  notice: z.string().max(500).nullable().optional(),
  service_override: z.enum(SERVICE_OVERRIDES).optional(),
  device_api_enabled_for_testing: z.boolean().optional(),
  channels: z.array(channelInputSchema).max(3).optional()
});

export const patchDispenserSchema = createDispenserSchema.partial();

export const planSchema = z.object({
  effective_service_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  items: z.array(z.object({
    number: z.coerce.number().int().min(1).max(3),
    enabled: z.boolean(),
    quantity_per_bundle: z.coerce.number().int().min(1).max(100).optional()
  })).min(1).max(3)
});

export const stockMovementSchema = z.object({
  channel_number: z.coerce.number().int().min(1).max(3),
  type: z.enum(["refill", "adjustment"]),
  amount: z.coerce.number().int().positive().optional(),
  target_balance: z.coerce.number().int().min(0).optional(),
  reason: z.string().max(500).optional(),
  source_reference: z.string().max(180).optional()
}).superRefine((value, context) => {
  if (value.type === "refill" && value.amount === undefined) context.addIssue({ code: "custom", path: ["amount"], message: "กรุณาระบุจำนวนเติม" });
  if (value.type === "adjustment" && value.target_balance === undefined) context.addIssue({ code: "custom", path: ["target_balance"], message: "กรุณาระบุยอดใหม่" });
  if (value.type === "adjustment" && !value.reason?.trim()) context.addIssue({ code: "custom", path: ["reason"], message: "การปรับยอดต้องมีเหตุผล" });
});

export const recipientCreateSchema = z.object({
  citizen_id: z.string().min(13).max(20),
  name: z.string().min(1).max(200),
  active: z.boolean().optional()
});

export const recipientPatchSchema = recipientCreateSchema.partial();
export const recipientDeleteSchema = z.object({ confirmation_token: z.string().min(1) });

export const deviceSyncSchema = z.object({
  firmware_version: z.string().max(80),
  client_version: z.string().max(80),
  clock_ready: z.boolean(),
  applied_plan_version: z.number().int().nullable(),
  applied_eligibility_version: z.number().int().nonnegative(),
  applied_stock_revision: z.number().int().nonnegative(),
  local_stock: z.record(z.string(), z.number().int().nonnegative())
});

export const deviceAuthorizeSchema = z.object({
  citizen_id: z.string().min(13).max(20),
  service_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  local_time: z.string().max(80)
});

export const deviceReportSchema = z.object({
  report_id: z.number().int().nonnegative(),
  service_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  local_time: z.string().max(80),
  citizen_id: z.string().min(13).max(20),
  outcome: z.enum(["complete", "partial", "failed"]),
  channels: z.array(z.object({ number: z.number().int().min(1).max(3), result: z.enum(["success", "failed"]), count_after: z.number().int().nonnegative() })).max(3),
  errors: z.array(z.string().max(500)).max(20).default([])
});

export const publicListQuerySchema = z.object({
  q: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  status: z.enum(SERVICE_STATUSES).or(z.literal("all")).optional(),
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional()
});

export const dashboardQuerySchema = z.object({
  range: z.enum(["7d", "30d"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dispenser_code: z.string().optional()
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().optional(),
  lifecycle: z.string().optional(),
  active: z.enum(["true", "false"]).optional()
});

export type CreateDispenserRequest = z.infer<typeof createDispenserSchema>;

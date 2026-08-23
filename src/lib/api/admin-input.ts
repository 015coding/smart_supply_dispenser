import type { CreateDispenserRequest } from "@/lib/validation/schemas";
import type { ChannelInput, CreateDispenserInput, PatchDispenserInput, PlanInput, StockMovementInput } from "@/lib/server/store";

export function toChannelInput(channel: NonNullable<CreateDispenserRequest["channels"]>[number]): ChannelInput {
  return {
    number: channel.number,
    supplyName: channel.supply_name,
    unit: channel.unit,
    capacity: channel.capacity,
    balance: channel.balance,
    lowStockThreshold: channel.low_stock_threshold,
    enabled: channel.enabled
  };
}

export function toCreateDispenserInput(input: CreateDispenserRequest): CreateDispenserInput {
  return {
    name: input.name,
    address: input.address,
    province: input.province,
    district: input.district,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    contact: input.contact,
    notice: input.notice,
    serviceOverride: input.service_override,
    deviceApiEnabledForTesting: input.device_api_enabled_for_testing,
    channels: input.channels?.map(toChannelInput)
  };
}

export function toPatchDispenserInput(input: CreateDispenserRequest): PatchDispenserInput {
  return toCreateDispenserInput(input);
}

export function toPlanInput(input: { effective_service_day?: string; items: Array<{ number: number; enabled: boolean; quantity_per_bundle?: number }> }): PlanInput {
  return {
    effectiveServiceDay: input.effective_service_day,
    items: input.items.map((item) => ({ number: item.number, enabled: item.enabled, quantityPerBundle: item.quantity_per_bundle }))
  };
}

export function toStockMovementInput(input: { channel_number: number; type: "refill" | "adjustment"; amount?: number; target_balance?: number; reason?: string; source_reference?: string }): StockMovementInput {
  return {
    channelNumber: input.channel_number,
    type: input.type,
    amount: input.amount,
    targetBalance: input.target_balance,
    reason: input.reason,
    sourceReference: input.source_reference
  };
}

import { formatThaiDateTime } from "@/lib/domain/date";
import { availableBundleCount, deriveServiceStatus } from "@/lib/domain/rules";
import { maskCitizenId, revealCitizenId, encryptionSecret } from "@/lib/domain/privacy";
import type { Dispenser, DistributionPlan, OperationalAlert, RecipientRecord, StockMovement } from "@/lib/domain/types";

export function channelToApi(channel: Dispenser["channels"][number]) {
  return {
    number: channel.number,
    supply_name: channel.supplyName,
    unit: channel.unit,
    capacity: channel.capacity,
    balance: channel.balance,
    low_stock_threshold: channel.lowStockThreshold,
    enabled: channel.enabled
  };
}

export function planToApi(plan: DistributionPlan) {
  return {
    version: plan.version,
    effective_service_day: plan.effectiveServiceDay,
    created_at: plan.createdAt,
    items: plan.items.map((item) => ({
      number: item.number,
      supply_name: item.supplyName,
      unit: item.unit,
      quantity_per_bundle: item.quantityPerBundle,
      enabled: item.enabled
    }))
  };
}

export function dispenserToAdminApi(dispenser: Dispenser) {
  const activeChannels = dispenser.channels.filter((channel) => channel.enabled);
  return {
    code: dispenser.code,
    name: dispenser.name,
    address: dispenser.address,
    province: dispenser.province,
    district: dispenser.district,
    latitude: dispenser.latitude,
    longitude: dispenser.longitude,
    contact: dispenser.contact,
    notice: dispenser.notice,
    image_url: dispenser.imageUrl,
    lifecycle: dispenser.lifecycle,
    service_override: dispenser.serviceOverride,
    service_status: deriveServiceStatus(dispenser.lifecycle, dispenser.serviceOverride, dispenser.channels),
    available_bundle_count: availableBundleCount(dispenser.channels),
    channels: dispenser.channels.map(channelToApi),
    plans: dispenser.plans.sort((a, b) => b.version - a.version).map(planToApi),
    stock_revision: dispenser.stockRevision,
    last_reported_at: dispenser.lastReportedAt,
    created_at: dispenser.createdAt,
    updated_at: dispenser.updatedAt,
    device_api_enabled_for_testing: dispenser.deviceApiEnabledForTesting,
    active_channel_count: activeChannels.length
  };
}

export function publicDispenserToApi(item: Awaited<ReturnType<import("@/lib/server/store").MemoryStore["getPublic"]>>) {
  if (!item) return null;
  return {
    code: item.code,
    name: item.name,
    address: item.address,
    province: item.province,
    district: item.district,
    latitude: item.latitude,
    longitude: item.longitude,
    contact: item.contact,
    notice: item.notice,
    image_url: item.imageUrl,
    status: item.status,
    available_bundle_count: item.availableBundleCount,
    last_reported_at: item.lastReportedAt,
    channels: item.channels.map((channel) => ({
      number: channel.number,
      supply_name: channel.supplyName,
      unit: channel.unit,
      balance: channel.balance,
      enabled: channel.enabled
    }))
  };
}

export function recipientToApi(recipient: RecipientRecord & { maskedCitizenId?: string }) {
  return {
    id: recipient.id,
    citizen_id: recipient.maskedCitizenId ?? maskCitizenId(revealCitizenId(recipient.citizenIdCiphertext, encryptionSecret())),
    name: recipient.name,
    active: recipient.active,
    created_at: recipient.createdAt,
    updated_at: recipient.updatedAt
  };
}

export function movementToApi(movement: StockMovement) {
  return {
    id: movement.id,
    dispenser_code: movement.dispenserCode,
    channel_number: movement.channelNumber,
    type: movement.type,
    delta: movement.delta,
    balance_before: movement.balanceBefore,
    balance_after: movement.balanceAfter,
    stock_revision: movement.stockRevision,
    source_reference: movement.sourceReference,
    reason: movement.reason,
    created_at: movement.createdAt,
    actor: movement.actor
  };
}

export function alertToApi(alert: OperationalAlert) {
  return {
    id: alert.id,
    type: alert.type,
    dispenser_code: alert.dispenserCode,
    channel_number: alert.channelNumber,
    title: alert.title,
    detail: alert.detail,
    acknowledged_at: alert.acknowledgedAt,
    resolved_at: alert.resolvedAt,
    created_at: alert.createdAt,
    updated_at: alert.updatedAt
  };
}

export function activityToApi(activity: { id: string; actor: string; action: string; entityType: string; entityId: string; fieldDiff: Record<string, unknown>; createdAt: string }) {
  return {
    id: activity.id,
    actor: activity.actor,
    action: activity.action,
    entity_type: activity.entityType,
    entity_id: activity.entityId,
    field_diff: activity.fieldDiff,
    created_at: activity.createdAt,
    created_at_thai: formatThaiDateTime(activity.createdAt)
  };
}

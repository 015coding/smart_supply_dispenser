import type { DispenserChannel, Lifecycle, ServiceOverride, ServiceStatus, SupportedUnit } from "@/lib/domain/types";
import { SUPPORTED_UNITS } from "@/lib/domain/types";

export interface PublishInput {
  name: string;
  address: string;
  province: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  channels: DispenserChannel[];
}

export interface ValidationResult {
  valid: boolean;
  fieldErrors: Record<string, string>;
}

export function availableBundleCount(channels: DispenserChannel[]): number {
  const enabledChannels = channels.filter((channel) => channel.enabled);
  if (enabledChannels.length === 0) return 0;
  return Math.min(...enabledChannels.map((channel) => Math.max(0, Math.floor(channel.balance))));
}

export function deriveServiceStatus(
  lifecycle: Lifecycle,
  override: ServiceOverride,
  channels: DispenserChannel[]
): ServiceStatus {
  if (override === "temporarily_closed") return "temporarily_closed";
  if (override === "maintenance") return "maintenance";
  if (lifecycle !== "published") return "out_of_stock";
  return availableBundleCount(channels) > 0 ? "available" : "out_of_stock";
}

function requiredText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function isValidCoordinate(value: number | null | undefined, min: number, max: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function channelIsPublishable(channel: DispenserChannel): boolean {
  const validUnit = SUPPORTED_UNITS.includes(channel.unit as SupportedUnit) || requiredText(channel.unit);
  return (
    channel.number >= 1 &&
    channel.number <= 3 &&
    requiredText(channel.supplyName) &&
    validUnit &&
    Number.isInteger(channel.capacity) &&
    channel.capacity > 0 &&
    Number.isInteger(channel.balance) &&
    channel.balance >= 0 &&
    channel.balance <= channel.capacity &&
    Number.isInteger(channel.lowStockThreshold) &&
    channel.lowStockThreshold >= 0 &&
    channel.lowStockThreshold <= channel.capacity
  );
}

export function validatePublishInput(input: PublishInput): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  if (!requiredText(input.name)) fieldErrors.name = "กรุณาระบุชื่อเครื่อง";
  if (!requiredText(input.address)) fieldErrors.address = "กรุณาระบุที่อยู่หรือจุดสังเกต";
  if (!requiredText(input.province)) fieldErrors.province = "กรุณาระบุจังหวัด";
  if (!requiredText(input.district)) fieldErrors.district = "กรุณาระบุอำเภอ";
  if (!isValidCoordinate(input.latitude, -90, 90)) fieldErrors.latitude = "ละติจูดต้องเป็นตัวเลขระหว่าง -90 ถึง 90";
  if (!isValidCoordinate(input.longitude, -180, 180)) fieldErrors.longitude = "ลองจิจูดต้องเป็นตัวเลขระหว่าง -180 ถึง 180";

  const enabledChannels = input.channels.filter((channel) => channel.enabled);
  if (enabledChannels.length === 0 || enabledChannels.some((channel) => !channelIsPublishable(channel))) {
    fieldErrors.channels = "ต้องมีช่องที่ใช้งานอย่างน้อยหนึ่งช่อง พร้อมชื่อ หน่วย ความจุ และจุดแจ้งเตือนที่ถูกต้อง";
  }

  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export interface StockChange {
  type: "refill" | "adjustment";
  amount?: number;
  targetBalance?: number;
  reason?: string;
}

export interface StockChangeResult {
  balanceBefore: number;
  balanceAfter: number;
  delta: number;
}

export function applyStockChange(channel: DispenserChannel, change: StockChange): StockChangeResult {
  const before = channel.balance;
  let after: number;

  if (change.type === "refill") {
    const amount = change.amount;
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) throw new Error("จำนวนเติมต้องเป็นจำนวนเต็มมากกว่าศูนย์");
    after = before + amount;
  } else {
    const targetBalance = change.targetBalance;
    if (typeof targetBalance !== "number" || !Number.isInteger(targetBalance) || targetBalance < 0) throw new Error("ยอดปรับต้องเป็นจำนวนเต็มไม่ติดลบ");
    if (!change.reason?.trim()) throw new Error("การปรับยอดต้องระบุเหตุผล");
    after = targetBalance;
  }

  if (after > channel.capacity) throw new Error("ยอดคงเหลือเกินความจุช่องจ่าย");
  return { balanceBefore: before, balanceAfter: after, delta: after - before };
}

export function isLowStock(channel: DispenserChannel): boolean {
  return channel.enabled && channel.balance > 0 && channel.balance <= channel.lowStockThreshold;
}

export function isOutOfStock(channel: DispenserChannel): boolean {
  return channel.enabled && channel.balance <= 0;
}

export function hasCompletePlan(channels: DispenserChannel[]): boolean {
  return channels.some((channel) => channel.enabled && channelIsPublishable(channel));
}

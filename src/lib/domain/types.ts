export const LIFECYCLES = ["draft", "published", "archived"] as const;
export type Lifecycle = (typeof LIFECYCLES)[number];

export const SERVICE_OVERRIDES = ["normal", "temporarily_closed", "maintenance"] as const;
export type ServiceOverride = (typeof SERVICE_OVERRIDES)[number];

export const SERVICE_STATUSES = ["available", "out_of_stock", "temporarily_closed", "maintenance"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const CONNECTIVITY_STATUSES = ["online", "offline"] as const;
export type ConnectivityStatus = (typeof CONNECTIVITY_STATUSES)[number];

export const SUPPORTED_UNITS = ["ชิ้น", "ชุด", "ขวด", "กระป๋อง", "ถุง", "กล่อง", "แพ็ก", "อื่น ๆ"] as const;
export type SupportedUnit = (typeof SUPPORTED_UNITS)[number];

export const STOCK_MOVEMENT_TYPES = ["refill", "adjustment", "distribution"] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export type IsoTimestamp = string;

export interface DispenserChannel {
  number: number;
  supplyName: string;
  unit: string;
  capacity: number;
  balance: number;
  lowStockThreshold: number;
  enabled: boolean;
}

export interface DistributionPlanItem {
  number: number;
  supplyName: string;
  unit: string;
  quantityPerBundle: number;
  enabled: boolean;
}

export interface DistributionPlan {
  version: number;
  effectiveServiceDay: string;
  createdAt: IsoTimestamp;
  items: DistributionPlanItem[];
}

export interface DeviceState {
  lastSeenAt: IsoTimestamp | null;
  firmwareVersion: string | null;
  clientVersion: string | null;
  appliedPlanVersion: number | null;
  appliedEligibilityVersion: number;
  appliedStockRevision: number;
}

export interface Dispenser {
  id: string;
  code: string;
  name: string;
  address: string;
  province: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  contact: string | null;
  notice: string | null;
  imageUrl: string | null;
  lifecycle: Lifecycle;
  serviceOverride: ServiceOverride;
  deviceApiEnabledForTesting: boolean;
  channels: DispenserChannel[];
  plans: DistributionPlan[];
  stockRevision: number;
  lastReportedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  deviceState: DeviceState;
}

export interface RecipientRecord {
  id: string;
  citizenIdCiphertext: string;
  citizenIdLookupHash: string;
  name: string;
  active: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface ActivityRecord {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  fieldDiff: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export type AlertType = "low_stock" | "out_of_stock" | "maintenance" | "discrepancy";

export interface OperationalAlert {
  id: string;
  type: AlertType;
  dispenserCode: string;
  channelNumber: number | null;
  title: string;
  detail: string;
  acknowledgedAt: IsoTimestamp | null;
  resolvedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface StockMovement {
  id: string;
  dispenserCode: string;
  channelNumber: number;
  type: StockMovementType;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  stockRevision: number;
  sourceReference: string | null;
  reason: string | null;
  createdAt: IsoTimestamp;
  actor: string;
}

export type DistributionOutcome = "complete" | "partial" | "failed";
export type ChannelReportResult = "success" | "failed";

export interface DeviceReportChannel {
  number: number;
  result: ChannelReportResult;
  countAfter: number;
}

export interface DeviceReport {
  reportId: number;
  dispenserCode: string;
  serviceDay: string;
  localTime: string;
  citizenIdLookupHash: string;
  outcome: DistributionOutcome;
  channels: DeviceReportChannel[];
  errors: string[];
  accepted: boolean;
  duplicate: boolean;
  stockRevision: number;
  reconciledStock: Record<string, number>;
  createdAt: IsoTimestamp;
}

export interface CompletedDistribution {
  id: string;
  dispenserCode: string;
  recipientLookupHash: string;
  serviceDay: string;
  reportId: number;
  createdAt: IsoTimestamp;
}

export interface DailyDistributionSummary {
  serviceDay: string;
  dispenserCode: string | null;
  recipientCount: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PublicDispenser {
  code: string;
  name: string;
  address: string;
  province: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  contact: string | null;
  notice: string | null;
  imageUrl: string | null;
  status: ServiceStatus;
  availableBundleCount: number;
  lastReportedAt: IsoTimestamp | null;
  channels: Array<Pick<DispenserChannel, "number" | "supplyName" | "unit" | "balance" | "enabled">>;
}

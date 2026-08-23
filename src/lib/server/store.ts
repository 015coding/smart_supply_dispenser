import { createHash, randomUUID } from "node:crypto";
import {
  addServiceDays,
  formatServiceDay,
  isServiceDay,
  serviceDayFor
} from "@/lib/domain/date";
import {
  encryptionSecret,
  hashCitizenId,
  isValidThaiCitizenId,
  normalizeCitizenId,
  protectCitizenId,
  revealCitizenId,
  lookupSecret,
  maskCitizenId
} from "@/lib/domain/privacy";
import {
  applyStockChange,
  availableBundleCount,
  deriveServiceStatus,
  isLowStock,
  isOutOfStock,
  validatePublishInput
} from "@/lib/domain/rules";
import type {
  ActivityRecord,
  CompletedDistribution,
  DeviceReport,
  DeviceReportChannel,
  DeviceState,
  Dispenser,
  DispenserChannel,
  DistributionOutcome,
  DistributionPlan,
  DistributionPlanItem,
  IsoTimestamp,
  OperationalAlert,
  Pagination,
  PublicDispenser,
  RecipientRecord,
  ServiceOverride,
  StockMovement,
  StockMovementType
} from "@/lib/domain/types";
import { AppError, conflict, notFound, validationError } from "@/lib/server/errors";

const MAX_CHANNELS = 3;
const DEVICE_OFFLINE_AFTER_MS = 20 * 60 * 1000;
const IMPORT_TTL_MS = 24 * 60 * 60 * 1000;
const RETENTION_DISTRIBUTION_MS = 180 * 24 * 60 * 60 * 1000;
const RETENTION_ACTIVITY_MS = 365 * 24 * 60 * 60 * 1000;

export interface ChannelInput {
  number: number;
  supplyName?: string;
  unit?: string;
  capacity?: number;
  balance?: number;
  lowStockThreshold?: number;
  enabled?: boolean;
}

export interface CreateDispenserInput {
  name?: string;
  address?: string;
  province?: string;
  district?: string;
  latitude?: number | null;
  longitude?: number | null;
  contact?: string | null;
  notice?: string | null;
  serviceOverride?: ServiceOverride;
  deviceApiEnabledForTesting?: boolean;
  channels?: ChannelInput[];
}

export interface PatchDispenserInput {
  name?: string;
  address?: string;
  province?: string;
  district?: string;
  latitude?: number | null;
  longitude?: number | null;
  contact?: string | null;
  notice?: string | null;
  serviceOverride?: ServiceOverride;
  deviceApiEnabledForTesting?: boolean;
  channels?: ChannelInput[];
}

export interface StockMovementInput {
  channelNumber: number;
  type: "refill" | "adjustment";
  amount?: number;
  targetBalance?: number;
  reason?: string;
  sourceReference?: string;
}

export interface PlanInput {
  effectiveServiceDay?: string;
  items: Array<{
    number: number;
    enabled: boolean;
    quantityPerBundle?: number;
  }>;
}

export interface DeviceSyncInput {
  firmwareVersion: string;
  clientVersion: string;
  clockReady: boolean;
  appliedPlanVersion: number | null;
  appliedEligibilityVersion: number;
  appliedStockRevision: number;
  localStock: Record<string, number>;
}

export interface DeviceAuthorizeInput {
  citizenId: string;
  serviceDay: string;
  localTime: string;
}

export interface DeviceReportInput {
  reportId: number;
  serviceDay: string;
  localTime: string;
  citizenId: string;
  outcome: DistributionOutcome;
  channels: DeviceReportChannel[];
  errors: string[];
}

interface EligibilityImportRow {
  rowNumber: number;
  citizenId: string;
  name: string;
  valid: boolean;
  error: string | null;
}

interface EligibilityImport {
  id: string;
  checksum: string;
  createdAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
  status: "preview" | "committed" | "expired";
  rows: EligibilityImportRow[];
  validCount: number;
  invalidCount: number;
  committedCount: number;
}

interface SnapshotResult {
  body: string;
  version: number;
  recordCount: number;
  sha256: string;
}

interface DashboardRange {
  from: string;
  to: string;
}

function now(): IsoTimestamp {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nextPage(page: number | undefined, pageSize: number | undefined): { page: number; pageSize: number } {
  return {
    page: Math.max(1, Math.floor(page ?? 1)),
    pageSize: Math.min(100, Math.max(1, Math.floor(pageSize ?? 20)))
  };
}

function paginate<T>(items: T[], page: number | undefined, pageSize: number | undefined): { items: T[]; pagination: Pagination } {
  const selected = nextPage(page, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / selected.pageSize));
  const offset = (selected.page - 1) * selected.pageSize;
  return {
    items: items.slice(offset, offset + selected.pageSize),
    pagination: { page: selected.page, pageSize: selected.pageSize, total: items.length, totalPages }
  };
}

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function nullableText(value: string | null | undefined): string | null {
  const normalized = text(value);
  return normalized || null;
}

function normalizeChannels(input: ChannelInput[] | undefined, existing?: DispenserChannel[]): DispenserChannel[] {
  const source = new Map((input ?? []).map((channel) => [channel.number, channel]));
  const old = new Map((existing ?? []).map((channel) => [channel.number, channel]));
  return Array.from({ length: MAX_CHANNELS }, (_, index) => {
    const number = index + 1;
    const requested = source.get(number);
    const previous = old.get(number);
    const capacity = requested?.capacity ?? previous?.capacity ?? 0;
    const balance = requested?.balance ?? previous?.balance ?? 0;
    return {
      number,
      supplyName: text(requested?.supplyName ?? previous?.supplyName),
      unit: text(requested?.unit ?? previous?.unit) || "ชิ้น",
      capacity: Number.isFinite(capacity) ? Math.max(0, Math.floor(capacity)) : 0,
      balance: Number.isFinite(balance) ? Math.max(0, Math.floor(balance)) : 0,
      lowStockThreshold: Number.isFinite(requested?.lowStockThreshold ?? previous?.lowStockThreshold)
        ? Math.max(0, Math.floor(requested?.lowStockThreshold ?? previous?.lowStockThreshold ?? 0))
        : 0,
      enabled: requested?.enabled ?? previous?.enabled ?? Boolean(requested || previous)
    };
  });
}

function planItemsFromChannels(channels: DispenserChannel[]): DistributionPlanItem[] {
  return channels.map((channel) => ({
    number: channel.number,
    supplyName: channel.supplyName,
    unit: channel.unit,
    quantityPerBundle: 1,
    enabled: channel.enabled
  }));
}

function planChannels(dispenser: Dispenser, serviceDay = serviceDayFor()): DispenserChannel[] {
  const plan = dispenser.plans
    .filter((candidate) => candidate.effectiveServiceDay <= serviceDay)
    .sort((a, b) => b.version - a.version)[0];
  if (!plan) return dispenser.channels;
  const enabledNumbers = new Set(plan.items.filter((item) => item.enabled).map((item) => item.number));
  return dispenser.channels.map((channel) => ({ ...channel, enabled: enabledNumbers.has(channel.number) }));
}

function latestPlan(dispenser: Dispenser): DistributionPlan | null {
  return [...dispenser.plans].sort((a, b) => b.version - a.version)[0] ?? null;
}

function createDefaultDeviceState(): DeviceState {
  return {
    lastSeenAt: null,
    firmwareVersion: null,
    clientVersion: null,
    appliedPlanVersion: null,
    appliedEligibilityVersion: 0,
    appliedStockRevision: 0
  };
}

function parseCsv(textValue: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < textValue.length; index += 1) {
    const character = textValue[index];
    const next = textValue[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

function escapeCsv(value: string | number | boolean | null): string {
  const normalized = value == null ? "" : String(value);
  return /[",\n\r]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized;
}

function csvRow(values: Array<string | number | boolean | null>): string {
  return values.map(escapeCsv).join(",");
}

function rangeFromInput(input: { range?: "7d" | "30d"; from?: string; to?: string }): DashboardRange {
  const today = serviceDayFor();
  if (input.from && input.to && isServiceDay(input.from) && isServiceDay(input.to)) return { from: input.from, to: input.to };
  const days = input.range === "30d" ? 30 : 7;
  return { from: addServiceDays(today, -(days - 1)), to: today };
}

function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  let current = from;
  for (let index = 0; current <= to && index < 366; index += 1) {
    dates.push(current);
    current = addServiceDays(current, 1);
  }
  return dates;
}

export class MemoryStore {
  private dispensers = new Map<string, Dispenser>();
  private recipients = new Map<string, RecipientRecord>();
  private activities: ActivityRecord[] = [];
  private movements: StockMovement[] = [];
  private alerts = new Map<string, OperationalAlert>();
  private reports = new Map<string, DeviceReport>();
  private completed: CompletedDistribution[] = [];
  private summaries = new Map<string, number>();
  private imports = new Map<string, EligibilityImport>();
  private eligibilityVersion = 0;
  private codeSequence = 1;
  private lock: Promise<unknown> = Promise.resolve();

  private withLock<T>(operation: () => T | Promise<T>): Promise<T> {
    const result = this.lock.then(operation, operation);
    this.lock = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  reset(): void {
    this.dispensers.clear();
    this.recipients.clear();
    this.activities = [];
    this.movements = [];
    this.alerts.clear();
    this.reports.clear();
    this.completed = [];
    this.summaries.clear();
    this.imports.clear();
    this.eligibilityVersion = 0;
    this.codeSequence = 1;
  }

  private recordActivity(actor: string, action: string, entityType: string, entityId: string, fieldDiff: Record<string, unknown>): void {
    this.activities.unshift({
      id: randomUUID(),
      actor,
      action,
      entityType,
      entityId,
      fieldDiff: clone(fieldDiff),
      createdAt: now()
    });
  }

  private findDispenser(code: string): Dispenser {
    const dispenser = this.dispensers.get(code.toUpperCase());
    if (!dispenser) throw notFound("ไม่พบเครื่องแจกสิ่งของ");
    return dispenser;
  }

  private refreshAlerts(dispenser: Dispenser): void {
    const currentTime = now();
    const desired = new Map<string, { type: OperationalAlert["type"]; channelNumber: number | null; title: string; detail: string }>();
    const channels = planChannels(dispenser);
    for (const channel of channels) {
      if (isOutOfStock(channel)) {
        desired.set(`${dispenser.code}:${channel.number}:out_of_stock`, {
          type: "out_of_stock",
          channelNumber: channel.number,
          title: `${dispenser.name} · ${channel.supplyName || `ช่อง ${channel.number}`}`,
          detail: "สิ่งของในช่องนี้หมดแล้ว"
        });
      } else if (isLowStock(channel)) {
        desired.set(`${dispenser.code}:${channel.number}:low_stock`, {
          type: "low_stock",
          channelNumber: channel.number,
          title: `${dispenser.name} · ${channel.supplyName || `ช่อง ${channel.number}`}`,
          detail: `เหลือ ${channel.balance} ${channel.unit} ต่ำกว่าหรือเท่ากับจุดแจ้งเตือน`
        });
      }
    }
    if (dispenser.serviceOverride === "maintenance") {
      desired.set(`${dispenser.code}:maintenance`, {
        type: "maintenance",
        channelNumber: null,
        title: dispenser.name,
        detail: "เครื่องอยู่ในสถานะปิดซ่อมบำรุง"
      });
    }

    for (const [key, existing] of this.alerts.entries()) {
      if (!key.startsWith(`${dispenser.code}:`)) continue;
      if (!desired.has(key) && !existing.resolvedAt) {
        existing.resolvedAt = currentTime;
        existing.updatedAt = currentTime;
      }
    }

    for (const [key, wanted] of desired.entries()) {
      const existing = this.alerts.get(key);
      if (existing) {
        existing.resolvedAt = null;
        existing.updatedAt = currentTime;
        existing.title = wanted.title;
        existing.detail = wanted.detail;
      } else {
        this.alerts.set(key, {
          id: randomUUID(),
          type: wanted.type,
          dispenserCode: dispenser.code,
          channelNumber: wanted.channelNumber,
          title: wanted.title,
          detail: wanted.detail,
          acknowledgedAt: null,
          resolvedAt: null,
          createdAt: currentTime,
          updatedAt: currentTime
        });
      }
    }
  }

  private publicView(dispenser: Dispenser): PublicDispenser {
    const channels = planChannels(dispenser);
    const status = deriveServiceStatus(dispenser.lifecycle, dispenser.serviceOverride, channels);
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
      imageUrl: dispenser.imageUrl,
      status,
      availableBundleCount: availableBundleCount(channels),
      lastReportedAt: dispenser.lastReportedAt,
      channels: channels.map((channel) => ({
        number: channel.number,
        supplyName: channel.supplyName,
        unit: channel.unit,
        balance: channel.balance,
        enabled: channel.enabled
      }))
    };
  }

  async createDispenser(input: CreateDispenserInput, actor = "admin"): Promise<Dispenser> {
    return this.withLock(async () => {
      let code = `DSP-${String(this.codeSequence).padStart(4, "0")}`;
      while (this.dispensers.has(code)) {
        this.codeSequence += 1;
        code = `DSP-${String(this.codeSequence).padStart(4, "0")}`;
      }
      this.codeSequence += 1;
      const timestamp = now();
      const dispenser: Dispenser = {
        id: randomUUID(),
        code,
        name: text(input.name),
        address: text(input.address),
        province: text(input.province),
        district: text(input.district),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        contact: nullableText(input.contact),
        notice: nullableText(input.notice),
        imageUrl: null,
        lifecycle: "draft",
        serviceOverride: input.serviceOverride ?? "normal",
        deviceApiEnabledForTesting: input.deviceApiEnabledForTesting ?? false,
        channels: normalizeChannels(input.channels),
        plans: [],
        stockRevision: 0,
        lastReportedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        deviceState: createDefaultDeviceState()
      };
      this.dispensers.set(code, dispenser);
      this.recordActivity(actor, "create", "dispenser", code, { name: dispenser.name });
      return clone(dispenser);
    });
  }

  async updateDispenser(code: string, input: PatchDispenserInput, actor = "admin"): Promise<Dispenser> {
    return this.withLock(async () => {
      const dispenser = this.findDispenser(code);
      if (dispenser.lifecycle === "archived") throw conflict("เครื่องที่เก็บถาวรแล้วแก้ไขไม่ได้", "archived_dispenser");
      const diff: Record<string, unknown> = {};
      const fields = ["name", "address", "province", "district", "latitude", "longitude", "contact", "notice", "serviceOverride", "deviceApiEnabledForTesting"] as const;
      for (const field of fields) {
        if (input[field] !== undefined && dispenser[field] !== input[field]) {
          diff[field] = { from: dispenser[field], to: input[field] };
          if (field === "contact" || field === "notice") dispenser[field] = nullableText(input[field] as string | null | undefined);
          else dispenser[field] = input[field] as never;
        }
      }

      if (input.channels) {
        const nextChannels = normalizeChannels(input.channels, dispenser.channels);
        const planChanged = nextChannels.some((channel, index) => {
          const previous = dispenser.channels[index];
          return channel.supplyName !== previous.supplyName || channel.unit !== previous.unit || channel.enabled !== previous.enabled;
        });
        if (planChanged && dispenser.lifecycle === "published") {
          this.createPlanLocked(dispenser, { items: nextChannels.map((channel) => ({ number: channel.number, enabled: channel.enabled, quantityPerBundle: 1 })) }, actor);
          diff.plan = "สร้าง revision ใหม่ มีผลวันให้บริการถัดไป";
        }
        dispenser.channels = nextChannels;
        diff.channels = "updated";
      }

      dispenser.updatedAt = now();
      if (Object.keys(diff).length > 0) this.recordActivity(actor, "update", "dispenser", dispenser.code, diff);
      this.refreshAlerts(dispenser);
      return clone(dispenser);
    });
  }

  private createPlanLocked(dispenser: Dispenser, input: PlanInput, actor: string, firstPublish = false): DistributionPlan {
    const timestamp = now();
    const version = (latestPlan(dispenser)?.version ?? 0) + 1;
    const currentServiceDay = serviceDayFor();
    const effectiveServiceDay = input.effectiveServiceDay ?? (firstPublish ? currentServiceDay : addServiceDays(currentServiceDay, 1));
    if (!isServiceDay(effectiveServiceDay)) throw validationError("วันที่มีผลของแผนไม่ถูกต้อง");
    if (!firstPublish && effectiveServiceDay <= currentServiceDay) throw validationError("แผนใหม่ต้องมีผลตั้งแต่วันให้บริการถัดไป");

    const channelByNumber = new Map(dispenser.channels.map((channel) => [channel.number, channel]));
    const items = input.items
      .filter((item) => item.number >= 1 && item.number <= MAX_CHANNELS)
      .sort((a, b) => a.number - b.number)
      .map((item) => {
        const channel = channelByNumber.get(item.number);
        if (!channel) throw validationError("ไม่พบช่องจ่ายในแผน");
        const quantity = item.quantityPerBundle ?? 1;
        if (!Number.isInteger(quantity) || quantity <= 0) throw validationError("จำนวนต่อชุดต้องเป็นจำนวนเต็มมากกว่าศูนย์");
        return { number: item.number, supplyName: channel.supplyName, unit: channel.unit, quantityPerBundle: quantity, enabled: item.enabled };
      });
    if (!items.some((item) => item.enabled)) throw validationError("แผนต้องมีช่องที่ใช้งานอย่างน้อยหนึ่งช่อง");

    const plan: DistributionPlan = { version, effectiveServiceDay, createdAt: timestamp, items };
    dispenser.plans.push(plan);
    dispenser.updatedAt = timestamp;
    this.recordActivity(actor, "create_plan", "distribution_plan", `${dispenser.code}:v${version}`, {
      version,
      effectiveServiceDay,
      channels: items.filter((item) => item.enabled).map((item) => item.number)
    });
    this.refreshAlerts(dispenser);
    return plan;
  }

  async publishDispenser(code: string, actor = "admin"): Promise<Dispenser> {
    return this.withLock(async () => {
      const dispenser = this.findDispenser(code);
      if (dispenser.lifecycle === "archived") throw conflict("เครื่องที่เก็บถาวรแล้วเผยแพร่ไม่ได้", "archived_dispenser");
      if (dispenser.lifecycle === "published") throw conflict("เครื่องนี้เผยแพร่อยู่แล้ว", "already_published");
      const validation = validatePublishInput({
        name: dispenser.name,
        address: dispenser.address,
        province: dispenser.province,
        district: dispenser.district,
        latitude: dispenser.latitude,
        longitude: dispenser.longitude,
        channels: dispenser.channels
      });
      if (!validation.valid) throw validationError("ข้อมูลเครื่องยังไม่ครบสำหรับเผยแพร่", validation.fieldErrors);
      dispenser.lifecycle = "published";
      if (dispenser.plans.length === 0) this.createPlanLocked(dispenser, { items: planItemsFromChannels(dispenser.channels).map((item) => ({ number: item.number, enabled: item.enabled, quantityPerBundle: 1 })) }, actor, true);
      dispenser.updatedAt = now();
      this.recordActivity(actor, "publish", "dispenser", dispenser.code, { lifecycle: "published" });
      this.refreshAlerts(dispenser);
      return clone(dispenser);
    });
  }

  async archiveDispenser(code: string, actor = "admin"): Promise<Dispenser> {
    return this.withLock(async () => {
      const dispenser = this.findDispenser(code);
      if (dispenser.lifecycle === "archived") return clone(dispenser);
      dispenser.lifecycle = "archived";
      dispenser.deviceApiEnabledForTesting = false;
      dispenser.updatedAt = now();
      this.recordActivity(actor, "archive", "dispenser", dispenser.code, { lifecycle: "archived" });
      this.refreshAlerts(dispenser);
      return clone(dispenser);
    });
  }

  async listPublic(input: { q?: string; province?: string; district?: string; status?: string; page?: number; pageSize?: number }): Promise<{ items: PublicDispenser[]; pagination: Pagination; facets: { provinces: string[]; districts: string[] } }> {
    const query = text(input.q).toLocaleLowerCase("th");
    const publicViews = Array.from(this.dispensers.values())
      .filter((dispenser) => dispenser.lifecycle === "published")
      .map((dispenser) => this.publicView(dispenser));
    const provinces = [...new Set(publicViews.map((item) => item.province))].filter(Boolean).sort();
    const districts = [...new Set(publicViews.map((item) => item.district))].filter(Boolean).sort();
    const filtered = publicViews
      .filter((item) => {
        const searchText = [item.name, item.code, item.address, item.province, item.district].join(" ").toLocaleLowerCase("th");
        return (!query || searchText.includes(query)) && (!input.province || input.province === "all" || item.province === input.province) && (!input.district || input.district === "all" || item.district === input.district) && (!input.status || input.status === "all" || item.status === input.status);
      })
      .sort((a, b) => Number(b.status === "available") - Number(a.status === "available") || a.name.localeCompare(b.name, "th"));
    const result = paginate(filtered, input.page, input.pageSize);
    return { ...result, facets: { provinces, districts } };
  }

  async getPublic(code: string): Promise<PublicDispenser | null> {
    const dispenser = this.dispensers.get(code.toUpperCase());
    if (!dispenser || dispenser.lifecycle !== "published") return null;
    return clone(this.publicView(dispenser));
  }

  async getAdminDispenser(code: string): Promise<Dispenser> {
    return clone(this.findDispenser(code));
  }

  async listAdminDispensers(input: { q?: string; lifecycle?: string; page?: number; pageSize?: number }): Promise<{ items: Dispenser[]; pagination: Pagination }> {
    const query = text(input.q).toLocaleLowerCase("th");
    const items = Array.from(this.dispensers.values())
      .filter((dispenser) => (!input.lifecycle || input.lifecycle === "all" || dispenser.lifecycle === input.lifecycle))
      .filter((dispenser) => !query || [dispenser.code, dispenser.name, dispenser.address, dispenser.province, dispenser.district].join(" ").toLocaleLowerCase("th").includes(query))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const result = paginate(items, input.page, input.pageSize);
    return { items: clone(result.items), pagination: result.pagination };
  }

  async createPlan(code: string, input: PlanInput, actor = "admin"): Promise<DistributionPlan> {
    return this.withLock(async () => {
      const dispenser = this.findDispenser(code);
      if (dispenser.lifecycle === "archived") throw conflict("เครื่องที่เก็บถาวรแล้วสร้างแผนไม่ได้", "archived_dispenser");
      return clone(this.createPlanLocked(dispenser, input, actor));
    });
  }

  async listPlans(code: string): Promise<DistributionPlan[]> {
    const dispenser = this.findDispenser(code);
    return clone([...dispenser.plans].sort((a, b) => b.version - a.version));
  }

  async createStockMovement(code: string, input: StockMovementInput, actor = "admin"): Promise<StockMovement> {
    return this.withLock(async () => {
      const dispenser = this.findDispenser(code);
      if (dispenser.lifecycle === "archived") throw conflict("เครื่องที่เก็บถาวรแล้วแก้สต็อกไม่ได้", "archived_dispenser");
      const channel = dispenser.channels.find((candidate) => candidate.number === input.channelNumber);
      if (!channel) throw notFound("ไม่พบช่องจ่าย");
      const change = applyStockChange(channel, {
        type: input.type,
        amount: input.amount,
        targetBalance: input.targetBalance,
        reason: input.reason
      });
      const timestamp = now();
      channel.balance = change.balanceAfter;
      dispenser.stockRevision += 1;
      dispenser.updatedAt = timestamp;
      const movement: StockMovement = {
        id: randomUUID(),
        dispenserCode: dispenser.code,
        channelNumber: channel.number,
        type: input.type,
        delta: change.delta,
        balanceBefore: change.balanceBefore,
        balanceAfter: change.balanceAfter,
        stockRevision: dispenser.stockRevision,
        sourceReference: nullableText(input.sourceReference),
        reason: nullableText(input.reason),
        createdAt: timestamp,
        actor
      };
      this.movements.unshift(movement);
      this.recordActivity(actor, input.type === "refill" ? "refill_stock" : "adjust_stock", "stock_channel", `${dispenser.code}:${channel.number}`, {
        channelNumber: channel.number,
        delta: movement.delta,
        balanceAfter: movement.balanceAfter,
        reason: movement.reason
      });
      this.refreshAlerts(dispenser);
      return clone(movement);
    });
  }

  async getDeviceState(code: string): Promise<Record<string, unknown>> {
    const dispenser = this.findDispenser(code);
    const latest = latestPlan(dispenser);
    const lastSeenMs = dispenser.deviceState.lastSeenAt ? Date.parse(dispenser.deviceState.lastSeenAt) : 0;
    const connectivity = lastSeenMs > 0 && Date.now() - lastSeenMs <= DEVICE_OFFLINE_AFTER_MS ? "online" : "offline";
    return {
      code: dispenser.code,
      connectivity,
      lastSeenAt: dispenser.deviceState.lastSeenAt,
      firmwareVersion: dispenser.deviceState.firmwareVersion,
      clientVersion: dispenser.deviceState.clientVersion,
      appliedPlanVersion: dispenser.deviceState.appliedPlanVersion,
      desiredPlanVersion: latest?.version ?? null,
      planPendingSync: Boolean(latest && latest.version !== dispenser.deviceState.appliedPlanVersion),
      appliedEligibilityVersion: dispenser.deviceState.appliedEligibilityVersion,
      desiredEligibilityVersion: this.eligibilityVersion,
      appliedStockRevision: dispenser.deviceState.appliedStockRevision,
      desiredStockRevision: dispenser.stockRevision,
      stockPendingSync: dispenser.deviceState.appliedStockRevision !== dispenser.stockRevision
    };
  }

  private touchDeviceLocked(dispenser: Dispenser, input: DeviceSyncInput): void {
    dispenser.deviceState.lastSeenAt = now();
    dispenser.deviceState.firmwareVersion = text(input.firmwareVersion) || null;
    dispenser.deviceState.clientVersion = text(input.clientVersion) || null;
    dispenser.deviceState.appliedPlanVersion = input.appliedPlanVersion;
    dispenser.deviceState.appliedEligibilityVersion = input.appliedEligibilityVersion;
    dispenser.deviceState.appliedStockRevision = input.appliedStockRevision;
    dispenser.updatedAt = dispenser.updatedAt;
  }

  async deviceSync(code: string, input: DeviceSyncInput): Promise<Record<string, unknown>> {
    return this.withLock(async () => {
      const dispenser = this.findDispenser(code);
      this.touchDeviceLocked(dispenser, input);
      const desired = latestPlan(dispenser);
      const channels = desired?.items ?? [];
      return {
        serverTime: now(),
        serviceDay: serviceDayFor(),
        desiredPlan: desired
          ? { version: desired.version, effectiveServiceDay: desired.effectiveServiceDay, channels: channels.map((item) => ({ number: item.number, enabled: item.enabled, count: dispenser.channels.find((channel) => channel.number === item.number)?.balance ?? 0 })) }
          : null,
        stockRevision: dispenser.stockRevision,
        eligibility: {
          version: this.eligibilityVersion,
          changed: input.appliedEligibilityVersion !== this.eligibilityVersion,
          snapshotPath: input.appliedEligibilityVersion === this.eligibilityVersion ? null : `/api/device/v1/eligibility-snapshot?version=${this.eligibilityVersion}`
        }
      };
    });
  }

  async eligibilitySnapshot(code: string, version: number): Promise<SnapshotResult> {
    const dispenser = this.findDispenser(code);
    if (dispenser.lifecycle === "archived") throw notFound("ไม่พบเครื่องแจกสิ่งของ");
    if (version !== this.eligibilityVersion) throw notFound("ไม่พบ snapshot version นี้");
    const rows = Array.from(this.recipients.values())
      .filter((recipient) => recipient.active)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((recipient) => `${revealCitizenId(recipient.citizenIdCiphertext, encryptionSecret())},`);
    const body = `citizen_id,name\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
    return { body, version, recordCount: rows.length, sha256: createHash("sha256").update(body, "utf8").digest("hex") };
  }

  async authorizeDevice(code: string, input: DeviceAuthorizeInput): Promise<{ allowed: boolean; reason: string; serviceDay: string }> {
    return this.withLock(async () => {
      const dispenser = this.findDispenser(code);
      const normalized = normalizeCitizenId(input.citizenId);
      const lookup = hashCitizenId(normalized, lookupSecret());
      const recipient = Array.from(this.recipients.values()).find((candidate) => candidate.citizenIdLookupHash === lookup);
      const serviceDay = isServiceDay(input.serviceDay) ? input.serviceDay : serviceDayFor();
      if (!recipient) return { allowed: false, reason: "not_found", serviceDay };
      if (!recipient.active) return { allowed: false, reason: "deactivated", serviceDay };
      const channels = planChannels(dispenser, serviceDay);
      if (dispenser.lifecycle !== "published" || deriveServiceStatus(dispenser.lifecycle, dispenser.serviceOverride, channels) !== "available") {
        return { allowed: false, reason: "dispenser_unavailable", serviceDay };
      }
      if (!dispenser.plans.some((plan) => plan.effectiveServiceDay <= serviceDay)) return { allowed: false, reason: "plan_not_ready", serviceDay };
      if (this.completed.some((record) => record.recipientLookupHash === lookup && record.serviceDay === serviceDay)) return { allowed: false, reason: "already_received", serviceDay };
      dispenser.deviceState.lastSeenAt = now();
      return { allowed: true, reason: "eligible", serviceDay };
    });
  }

  async recordDeviceReport(code: string, input: DeviceReportInput): Promise<DeviceReport> {
    return this.withLock(async () => {
      const dispenser = this.findDispenser(code);
      const key = `${dispenser.code}:${input.reportId}`;
      const existing = this.reports.get(key);
      if (existing) return clone({ ...existing, duplicate: true });

      const timestamp = now();
      const lookup = hashCitizenId(normalizeCitizenId(input.citizenId), lookupSecret());
      const channelByNumber = new Map(dispenser.channels.map((channel) => [channel.number, channel]));
      const reconciledStock: Record<string, number> = {};
      let successfulChannels = 0;
      for (const result of input.channels) {
        const channel = channelByNumber.get(result.number);
        if (!channel) continue;
        const before = channel.balance;
        const centralAfter = Math.max(0, before - (result.result === "success" ? 1 : 0));
        if (result.result === "success") {
          successfulChannels += 1;
          channel.balance = centralAfter;
          dispenser.stockRevision += 1;
          this.movements.unshift({
            id: randomUUID(),
            dispenserCode: dispenser.code,
            channelNumber: channel.number,
            type: "distribution",
            delta: -1,
            balanceBefore: before,
            balanceAfter: centralAfter,
            stockRevision: dispenser.stockRevision,
            sourceReference: key,
            reason: null,
            createdAt: timestamp,
            actor: "device"
          });
          if (before <= 0 || result.countAfter !== centralAfter) {
            const alertKey = `${dispenser.code}:${channel.number}:discrepancy`;
            this.alerts.set(alertKey, {
              id: this.alerts.get(alertKey)?.id ?? randomUUID(),
              type: "discrepancy",
              dispenserCode: dispenser.code,
              channelNumber: channel.number,
              title: `${dispenser.name} · ยอดจากอุปกรณ์ไม่ตรงกัน`,
              detail: `ระบบคำนวณ ${centralAfter} ${channel.unit} แต่อุปกรณ์รายงาน ${result.countAfter}`,
              acknowledgedAt: null,
              resolvedAt: null,
              createdAt: this.alerts.get(alertKey)?.createdAt ?? timestamp,
              updatedAt: timestamp
            });
          }
        }
        reconciledStock[String(channel.number)] = centralAfter;
      }

      if (input.outcome === "complete") {
        this.completed.push({
          id: randomUUID(),
          dispenserCode: dispenser.code,
          recipientLookupHash: lookup,
          serviceDay: input.serviceDay,
          reportId: input.reportId,
          createdAt: timestamp
        });
      }
      dispenser.lastReportedAt = timestamp;
      dispenser.deviceState.lastSeenAt = timestamp;
      dispenser.updatedAt = timestamp;
      this.refreshAlerts(dispenser);
      this.recordActivity("device", "device_report", "distribution_report", key, {
        outcome: input.outcome,
        successfulChannels,
        serviceDay: input.serviceDay
      });
      const report: DeviceReport = {
        reportId: input.reportId,
        dispenserCode: dispenser.code,
        serviceDay: input.serviceDay,
        localTime: input.localTime,
        citizenIdLookupHash: lookup,
        outcome: input.outcome,
        channels: clone(input.channels),
        errors: clone(input.errors),
        accepted: true,
        duplicate: false,
        stockRevision: dispenser.stockRevision,
        reconciledStock,
        createdAt: timestamp
      };
      this.reports.set(key, report);
      return clone(report);
    });
  }

  async listAlerts(includeResolved = false): Promise<OperationalAlert[]> {
    return clone(Array.from(this.alerts.values()).filter((alert) => includeResolved || !alert.resolvedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }

  async acknowledgeAlert(id: string, actor = "admin"): Promise<OperationalAlert> {
    return this.withLock(async () => {
      const alert = Array.from(this.alerts.values()).find((candidate) => candidate.id === id);
      if (!alert) throw notFound("ไม่พบการแจ้งเตือน");
      alert.acknowledgedAt = alert.acknowledgedAt ?? now();
      alert.updatedAt = now();
      this.recordActivity(actor, "acknowledge_alert", "operational_alert", alert.id, { acknowledged: true });
      return clone(alert);
    });
  }

  async dashboard(input: { range?: "7d" | "30d"; from?: string; to?: string; dispenserCode?: string }): Promise<Record<string, unknown>> {
    const range = rangeFromInput(input);
    const published = Array.from(this.dispensers.values()).filter((dispenser) => dispenser.lifecycle === "published");
    const views = published.map((dispenser) => this.publicView(dispenser));
    const chartDays = datesBetween(range.from, range.to);
    const chart = chartDays.map((serviceDay) => {
      const recipients = new Set(
        this.completed
          .filter((record) => record.serviceDay === serviceDay && (!input.dispenserCode || record.dispenserCode === input.dispenserCode))
          .map((record) => record.recipientLookupHash)
      );
      return { serviceDay, recipientCount: recipients.size };
    });
    return {
      range,
      summary: {
        totalDispensers: this.dispensers.size,
        availableDispensers: views.filter((view) => view.status === "available").length,
        unavailableDispensers: views.filter((view) => view.status !== "available").length,
        availableBundleCount: views.reduce((total, view) => total + view.availableBundleCount, 0),
        unresolvedAlertCount: (await this.listAlerts()).length
      },
      alerts: await this.listAlerts(),
      recentDispensers: clone(Array.from(this.dispensers.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)),
      recentActivity: clone(this.activities.slice(0, 10)),
      completedRecipientChart: chart
    };
  }

  async listActivity(page?: number, pageSize?: number): Promise<{ items: ActivityRecord[]; pagination: Pagination }> {
    const result = paginate(this.activities, page, pageSize);
    return { items: clone(result.items), pagination: result.pagination };
  }

  async listRecipients(input: { q?: string; active?: boolean; page?: number; pageSize?: number }): Promise<{ items: Array<RecipientRecord & { maskedCitizenId: string }>; pagination: Pagination }> {
    const query = text(input.q).toLocaleLowerCase("th");
    const items = Array.from(this.recipients.values())
      .filter((recipient) => input.active === undefined || recipient.active === input.active)
      .map((recipient) => ({ ...recipient, maskedCitizenId: maskCitizenId(revealCitizenId(recipient.citizenIdCiphertext, encryptionSecret())) }))
      .filter((recipient) => !query || recipient.name.toLocaleLowerCase("th").includes(query) || recipient.maskedCitizenId.includes(query))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const result = paginate(items, input.page, input.pageSize);
    return { items: clone(result.items), pagination: result.pagination };
  }

  async getRecipient(id: string): Promise<(RecipientRecord & { maskedCitizenId: string }) | null> {
    const recipient = this.recipients.get(id);
    if (!recipient) return null;
    return clone({ ...recipient, maskedCitizenId: maskCitizenId(revealCitizenId(recipient.citizenIdCiphertext, encryptionSecret())) });
  }

  async createRecipient(input: { citizenId: string; name: string; active?: boolean }, actor = "admin"): Promise<RecipientRecord> {
    return this.withLock(async () => {
      const citizenId = normalizeCitizenId(input.citizenId);
      if (!isValidThaiCitizenId(citizenId)) throw validationError("เลขประจำตัวประชาชนไม่ถูกต้อง", { citizenId: "กรุณาตรวจสอบเลข 13 หลักและ checksum" });
      if (!text(input.name)) throw validationError("กรุณาระบุชื่อ", { name: "ชื่อจำเป็นต้องไม่ว่าง" });
      const lookup = hashCitizenId(citizenId, lookupSecret());
      if (Array.from(this.recipients.values()).some((recipient) => recipient.citizenIdLookupHash === lookup)) throw conflict("เลขประจำตัวประชาชนนี้มีอยู่แล้ว", "duplicate_recipient");
      const timestamp = now();
      const recipient: RecipientRecord = {
        id: randomUUID(),
        citizenIdCiphertext: protectCitizenId(citizenId, encryptionSecret()),
        citizenIdLookupHash: lookup,
        name: text(input.name),
        active: input.active ?? true,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      this.recipients.set(recipient.id, recipient);
      this.eligibilityVersion += 1;
      this.recordActivity(actor, "create", "recipient", recipient.id, { name: recipient.name, active: recipient.active });
      return clone(recipient);
    });
  }

  async updateRecipient(id: string, input: { citizenId?: string; name?: string; active?: boolean }, actor = "admin"): Promise<RecipientRecord> {
    return this.withLock(async () => {
      const recipient = this.recipients.get(id);
      if (!recipient) throw notFound("ไม่พบผู้มีสิทธิ์รับของ");
      const diff: Record<string, unknown> = {};
      if (input.citizenId !== undefined) {
        const citizenId = normalizeCitizenId(input.citizenId);
        if (!isValidThaiCitizenId(citizenId)) throw validationError("เลขประจำตัวประชาชนไม่ถูกต้อง");
        const lookup = hashCitizenId(citizenId, lookupSecret());
        if (lookup !== recipient.citizenIdLookupHash && Array.from(this.recipients.values()).some((candidate) => candidate.id !== id && candidate.citizenIdLookupHash === lookup)) throw conflict("เลขประจำตัวประชาชนนี้มีอยู่แล้ว", "duplicate_recipient");
        recipient.citizenIdCiphertext = protectCitizenId(citizenId, encryptionSecret());
        recipient.citizenIdLookupHash = lookup;
        diff.citizenId = "changed";
      }
      if (input.name !== undefined && text(input.name) && input.name !== recipient.name) {
        diff.name = { from: recipient.name, to: text(input.name) };
        recipient.name = text(input.name);
      }
      if (input.active !== undefined && input.active !== recipient.active) {
        diff.active = { from: recipient.active, to: input.active };
        recipient.active = input.active;
      }
      if (Object.keys(diff).length > 0) {
        recipient.updatedAt = now();
        this.eligibilityVersion += 1;
        this.recordActivity(actor, "update", "recipient", id, diff);
      }
      return clone(recipient);
    });
  }

  async deleteRecipient(id: string, confirmationToken: string, actor = "admin"): Promise<void> {
    return this.withLock(async () => {
      const recipient = this.recipients.get(id);
      if (!recipient) throw notFound("ไม่พบผู้มีสิทธิ์รับของ");
      if (confirmationToken !== `DELETE-${id}`) throw validationError("ต้องยืนยันการลบอย่างชัดเจน", { confirmationToken: `กรอก DELETE-${id}` });
      this.recipients.delete(id);
      this.eligibilityVersion += 1;
      this.recordActivity(actor, "delete", "recipient", id, { deleted: true });
    });
  }

  async previewEligibilityImport(csv: string): Promise<Record<string, unknown>> {
    return this.withLock(async () => {
      if (Buffer.byteLength(csv, "utf8") > 5 * 1024 * 1024) throw new AppError(413, "payload_too_large", "ไฟล์ CSV ใหญ่เกิน 5 MB");
      const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
      const header = rows.shift()?.map((value) => value.trim().toLowerCase());
      if (!header || header.length !== 2 || header[0] !== "citizen_id" || header[1] !== "name") throw validationError("CSV ต้องมี header citizen_id,name");
      const seen = new Set<string>();
      const previewRows: EligibilityImportRow[] = rows.map((row, index) => {
        const citizenId = normalizeCitizenId(row[0] ?? "");
        const name = text(row[1]);
        const lookup = hashCitizenId(citizenId, lookupSecret());
        let error: string | null = null;
        if (!isValidThaiCitizenId(citizenId)) error = "เลขประจำตัวประชาชนไม่ถูกต้อง";
        else if (!name) error = "ไม่มีชื่อ";
        else if (seen.has(lookup)) error = "รายการซ้ำในไฟล์";
        else if (Array.from(this.recipients.values()).some((recipient) => recipient.citizenIdLookupHash === lookup)) error = "มีอยู่ในระบบแล้ว";
        seen.add(lookup);
        return { rowNumber: index + 2, citizenId, name, valid: !error, error };
      });
      const timestamp = now();
      const id = randomUUID();
      const importSession: EligibilityImport = {
        id,
        checksum: createHash("sha256").update(csv, "utf8").digest("hex"),
        createdAt: timestamp,
        expiresAt: new Date(Date.now() + IMPORT_TTL_MS).toISOString(),
        status: "preview",
        rows: previewRows,
        validCount: previewRows.filter((row) => row.valid).length,
        invalidCount: previewRows.filter((row) => !row.valid).length,
        committedCount: 0
      };
      this.imports.set(id, importSession);
      return this.importView(importSession);
    });
  }

  private importView(importSession: EligibilityImport): Record<string, unknown> {
    return {
      id: importSession.id,
      checksum: importSession.checksum,
      createdAt: importSession.createdAt,
      expiresAt: importSession.expiresAt,
      status: importSession.status,
      validCount: importSession.validCount,
      invalidCount: importSession.invalidCount,
      committedCount: importSession.committedCount,
      rows: importSession.rows.map((row) => ({ rowNumber: row.rowNumber, citizenId: maskCitizenId(row.citizenId), name: row.name, valid: row.valid, error: row.error }))
    };
  }

  async getEligibilityImport(id: string): Promise<Record<string, unknown>> {
    const importSession = this.imports.get(id);
    if (!importSession) throw notFound("ไม่พบชุดนำเข้ารายชื่อ");
    if (Date.parse(importSession.expiresAt) < Date.now() && importSession.status === "preview") importSession.status = "expired";
    return clone(this.importView(importSession));
  }

  async commitEligibilityImport(id: string, actor = "admin"): Promise<Record<string, unknown>> {
    return this.withLock(async () => {
      const importSession = this.imports.get(id);
      if (!importSession) throw notFound("ไม่พบชุดนำเข้ารายชื่อ");
      if (importSession.status === "committed") return this.importView(importSession);
      if (importSession.status === "expired" || Date.parse(importSession.expiresAt) < Date.now()) {
        importSession.status = "expired";
        throw conflict("ชุดนำเข้าหมดอายุแล้ว", "import_expired");
      }
      const validRows = importSession.rows.filter((row) => row.valid);
      let committedCount = 0;
      for (const row of validRows) {
        const lookup = hashCitizenId(row.citizenId, lookupSecret());
        if (Array.from(this.recipients.values()).some((recipient) => recipient.citizenIdLookupHash === lookup)) {
          row.valid = false;
          row.error = "มีอยู่ในระบบแล้วระหว่างยืนยัน";
          continue;
        }
        const timestamp = now();
        this.recipients.set(randomUUID(), {
          id: randomUUID(),
          citizenIdCiphertext: protectCitizenId(row.citizenId, encryptionSecret()),
          citizenIdLookupHash: lookup,
          name: row.name,
          active: true,
          createdAt: timestamp,
          updatedAt: timestamp
        });
        committedCount += 1;
      }
      if (committedCount > 0) this.eligibilityVersion += 1;
      importSession.status = "committed";
      importSession.committedCount = committedCount;
      importSession.validCount = importSession.rows.filter((row) => row.valid).length;
      importSession.invalidCount = importSession.rows.filter((row) => !row.valid).length;
      this.recordActivity(actor, "import", "eligibility_import", id, { committedCount, invalidCount: importSession.invalidCount });
      return this.importView(importSession);
    });
  }

  async eligibilityImportErrorsCsv(id: string): Promise<string> {
    const importSession = this.imports.get(id);
    if (!importSession) throw notFound("ไม่พบชุดนำเข้ารายชื่อ");
    const rows = importSession.rows.filter((row) => !row.valid).map((row) => csvRow([row.rowNumber, row.citizenId, row.name, row.error]));
    return `${csvRow(["row", "citizen_id", "name", "error"])}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
  }

  async exportRecipientsCsv(): Promise<string> {
    const rows = Array.from(this.recipients.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((recipient) => csvRow([
      revealCitizenId(recipient.citizenIdCiphertext, encryptionSecret()),
      recipient.name,
      recipient.active,
      recipient.createdAt
    ]));
    return `${csvRow(["citizen_id", "name", "active", "created_at"])}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
  }

  async exportDispensersCsv(): Promise<string> {
    const rows = Array.from(this.dispensers.values()).sort((a, b) => a.code.localeCompare(b.code)).map((dispenser) => {
      const view = this.publicView(dispenser);
      return csvRow([view.code, view.name, dispenser.lifecycle, view.status, view.availableBundleCount, view.province, view.district, view.address]);
    });
    return `${csvRow(["code", "name", "lifecycle", "service_status", "available_bundle_count", "province", "district", "address"])}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
  }

  async exportStockCsv(): Promise<string> {
    const rows = Array.from(this.dispensers.values()).flatMap((dispenser) => dispenser.channels.map((channel) => csvRow([
      dispenser.code,
      channel.number,
      channel.supplyName,
      channel.unit,
      channel.balance,
      channel.capacity,
      channel.lowStockThreshold,
      dispenser.stockRevision
    ])));
    return `${csvRow(["dispenser_code", "channel_number", "supply_name", "unit", "balance", "capacity", "low_stock_threshold", "stock_revision"])}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
  }

  async exportActivityCsv(): Promise<string> {
    const rows = this.activities.map((activity) => csvRow([activity.createdAt, activity.actor, activity.action, activity.entityType, activity.entityId, JSON.stringify(activity.fieldDiff)]));
    return `${csvRow(["created_at", "actor", "action", "entity_type", "entity_id", "field_diff"])}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
  }

  async runRetention(referenceDate = new Date()): Promise<{ aggregated: number; deletedDistributions: number; deletedActivities: number; deletedImports: number }> {
    return this.withLock(async () => {
      const distributionCutoff = referenceDate.getTime() - RETENTION_DISTRIBUTION_MS;
      const activityCutoff = referenceDate.getTime() - RETENTION_ACTIVITY_MS;
      const old = this.completed.filter((record) => Date.parse(record.createdAt) < distributionCutoff);
      const aggregates = new Map<string, Set<string>>();
      for (const record of old) {
        const key = `${record.serviceDay}:${record.dispenserCode}`;
        const set = aggregates.get(key) ?? new Set<string>();
        set.add(record.recipientLookupHash);
        aggregates.set(key, set);
      }
      for (const [key, recipients] of aggregates.entries()) this.summaries.set(key, (this.summaries.get(key) ?? 0) + recipients.size);
      const oldKeys = new Set(old.map((record) => `${record.dispenserCode}:${record.reportId}`));
      this.completed = this.completed.filter((record) => !oldKeys.has(`${record.dispenserCode}:${record.reportId}`));
      const beforeActivities = this.activities.length;
      this.activities = this.activities.filter((activity) => Date.parse(activity.createdAt) >= activityCutoff);
      let deletedImports = 0;
      for (const [id, importSession] of this.imports.entries()) {
        if (Date.parse(importSession.expiresAt) < referenceDate.getTime()) {
          this.imports.delete(id);
          deletedImports += 1;
        }
      }
      return { aggregated: aggregates.size, deletedDistributions: old.length, deletedActivities: beforeActivities - this.activities.length, deletedImports };
    });
  }
}

export const store = new MemoryStore();

import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const lifecycleEnum = pgEnum("lifecycle", ["draft", "published", "archived"]);
export const serviceOverrideEnum = pgEnum("service_override", ["normal", "temporarily_closed", "maintenance"]);
export const stockMovementTypeEnum = pgEnum("stock_movement_type", ["refill", "adjustment", "distribution"]);
export const alertTypeEnum = pgEnum("alert_type", ["low_stock", "out_of_stock", "maintenance", "discrepancy"]);
export const importStatusEnum = pgEnum("eligibility_import_status", ["preview", "committed", "expired"]);
export const distributionOutcomeEnum = pgEnum("distribution_outcome", ["complete", "partial", "failed"]);
export const channelResultEnum = pgEnum("channel_result", ["success", "failed"]);

const auditTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
};

export const dispensers = pgTable("dispensers", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  name: text("name").notNull().default(""),
  address: text("address").notNull().default(""),
  province: varchar("province", { length: 120 }).notNull().default(""),
  district: varchar("district", { length: 120 }).notNull().default(""),
  latitude: text("latitude"),
  longitude: text("longitude"),
  contact: text("contact"),
  notice: text("notice"),
  imageUrl: text("image_url"),
  lifecycle: lifecycleEnum("lifecycle").notNull().default("draft"),
  serviceOverride: serviceOverrideEnum("service_override").notNull().default("normal"),
  deviceApiEnabledForTesting: boolean("device_api_enabled_for_testing").notNull().default(false),
  ...auditTimestamps
}, (table) => ({ codeUnique: uniqueIndex("dispensers_code_unique").on(table.code), lifecycleIndex: index("dispensers_lifecycle_idx").on(table.lifecycle) }));

export const dispensingChannels = pgTable("dispensing_channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  dispenserId: uuid("dispenser_id").notNull().references(() => dispensers.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  supplyName: text("supply_name").notNull().default(""),
  unit: varchar("unit", { length: 80 }).notNull().default("ชิ้น"),
  capacity: integer("capacity").notNull().default(0),
  balance: integer("balance").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(0),
  enabled: boolean("enabled").notNull().default(false),
  ...auditTimestamps
}, (table) => ({ dispenserNumberUnique: uniqueIndex("channels_dispenser_number_unique").on(table.dispenserId, table.number), dispenserIndex: index("channels_dispenser_idx").on(table.dispenserId) }));

export const distributionPlans = pgTable("distribution_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  dispenserId: uuid("dispenser_id").notNull().references(() => dispensers.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  effectiveServiceDay: date("effective_service_day").notNull(),
  ...auditTimestamps
}, (table) => ({ versionUnique: uniqueIndex("plans_dispenser_version_unique").on(table.dispenserId, table.version), effectiveIndex: index("plans_effective_day_idx").on(table.dispenserId, table.effectiveServiceDay) }));

export const distributionPlanItems = pgTable("distribution_plan_items", {
  planId: uuid("plan_id").notNull().references(() => distributionPlans.id, { onDelete: "cascade" }),
  channelNumber: integer("channel_number").notNull(),
  supplyName: text("supply_name").notNull(),
  unit: varchar("unit", { length: 80 }).notNull(),
  quantityPerBundle: integer("quantity_per_bundle").notNull().default(1),
  enabled: boolean("enabled").notNull().default(true)
}, (table) => ({ primary: primaryKey({ columns: [table.planId, table.channelNumber] }) }));

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  dispenserId: uuid("dispenser_id").notNull().references(() => dispensers.id),
  channelId: uuid("channel_id").notNull().references(() => dispensingChannels.id),
  type: stockMovementTypeEnum("type").notNull(),
  delta: integer("delta").notNull(),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  stockRevision: integer("stock_revision").notNull(),
  sourceReference: text("source_reference"),
  reason: text("reason"),
  actor: varchar("actor", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({ dispenserIndex: index("stock_movements_dispenser_idx").on(table.dispenserId, table.createdAt) }));

export const operationalAlerts = pgTable("operational_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: alertTypeEnum("type").notNull(),
  dispenserId: uuid("dispenser_id").notNull().references(() => dispensers.id, { onDelete: "cascade" }),
  channelNumber: integer("channel_number"),
  alertKey: varchar("alert_key", { length: 180 }).notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...auditTimestamps
}, (table) => ({ keyUnique: uniqueIndex("operational_alert_key_unique").on(table.alertKey), activeIndex: index("operational_alerts_active_idx").on(table.resolvedAt, table.updatedAt) }));

export const recipients = pgTable("recipients", {
  id: uuid("id").defaultRandom().primaryKey(),
  citizenIdCiphertext: text("citizen_id_ciphertext").notNull(),
  citizenIdLookupHash: varchar("citizen_id_lookup_hash", { length: 64 }).notNull(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  ...auditTimestamps
}, (table) => ({ lookupUnique: uniqueIndex("recipients_lookup_hash_unique").on(table.citizenIdLookupHash), activeIndex: index("recipients_active_idx").on(table.active) }));

export const eligibilityVersions = pgTable("eligibility_versions", {
  version: integer("version").primaryKey(),
  recordCount: integer("record_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const eligibilityImports = pgTable("eligibility_imports", {
  id: uuid("id").defaultRandom().primaryKey(),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  status: importStatusEnum("status").notNull().default("preview"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  validCount: integer("valid_count").notNull().default(0),
  invalidCount: integer("invalid_count").notNull().default(0),
  committedCount: integer("committed_count").notNull().default(0),
  ...auditTimestamps
}, (table) => ({ expiryIndex: index("eligibility_imports_expiry_idx").on(table.expiresAt) }));

export const eligibilityImportRows = pgTable("eligibility_import_rows", {
  id: uuid("id").defaultRandom().primaryKey(),
  importId: uuid("import_id").notNull().references(() => eligibilityImports.id, { onDelete: "cascade" }),
  rowNumber: integer("row_number").notNull(),
  citizenIdCiphertext: text("citizen_id_ciphertext").notNull(),
  citizenIdLookupHash: varchar("citizen_id_lookup_hash", { length: 64 }).notNull(),
  name: text("name").notNull(),
  valid: boolean("valid").notNull().default(false),
  error: text("error")
}, (table) => ({ importRowUnique: uniqueIndex("eligibility_import_rows_number_unique").on(table.importId, table.rowNumber) }));

export const deviceStates = pgTable("device_states", {
  dispenserId: uuid("dispenser_id").primaryKey().references(() => dispensers.id, { onDelete: "cascade" }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  firmwareVersion: varchar("firmware_version", { length: 80 }),
  clientVersion: varchar("client_version", { length: 80 }),
  appliedPlanVersion: integer("applied_plan_version"),
  appliedEligibilityVersion: integer("applied_eligibility_version").notNull().default(0),
  appliedStockRevision: integer("applied_stock_revision").notNull().default(0),
  ...auditTimestamps
});

export const deviceReports = pgTable("device_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  dispenserId: uuid("dispenser_id").notNull().references(() => dispensers.id),
  reportId: integer("report_id").notNull(),
  serviceDay: date("service_day").notNull(),
  localTime: text("local_time").notNull(),
  citizenIdLookupHash: varchar("citizen_id_lookup_hash", { length: 64 }).notNull(),
  outcome: distributionOutcomeEnum("outcome").notNull(),
  errors: jsonb("errors").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({ idempotencyUnique: uniqueIndex("device_reports_idempotency_unique").on(table.dispenserId, table.reportId), serviceDayIndex: index("device_reports_service_day_idx").on(table.serviceDay) }));

export const deviceReportChannels = pgTable("device_report_channels", {
  reportId: uuid("report_id").notNull().references(() => deviceReports.id, { onDelete: "cascade" }),
  channelNumber: integer("channel_number").notNull(),
  result: channelResultEnum("result").notNull(),
  countAfter: integer("count_after").notNull()
}, (table) => ({ primary: primaryKey({ columns: [table.reportId, table.channelNumber] }) }));

export const completedDistributions = pgTable("completed_distributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  dispenserId: uuid("dispenser_id").notNull().references(() => dispensers.id),
  recipientLookupHash: varchar("recipient_lookup_hash", { length: 64 }).notNull(),
  serviceDay: date("service_day").notNull(),
  reportId: uuid("report_id").notNull().references(() => deviceReports.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({ serviceRecipientIndex: index("completed_distributions_service_recipient_idx").on(table.serviceDay, table.recipientLookupHash), retentionIndex: index("completed_distributions_retention_idx").on(table.createdAt) }));

export const dailyDistributionSummaries = pgTable("daily_distribution_summaries", {
  serviceDay: date("service_day").notNull(),
  dispenserId: uuid("dispenser_id").references(() => dispensers.id),
  recipientCount: integer("recipient_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({ primary: primaryKey({ columns: [table.serviceDay, table.dispenserId] }) }));

export const administrativeActivities = pgTable("administrative_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor: varchar("actor", { length: 120 }).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 120 }).notNull(),
  entityId: varchar("entity_id", { length: 180 }).notNull(),
  fieldDiff: jsonb("field_diff").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({ createdIndex: index("administrative_activities_created_idx").on(table.createdAt) }));

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  subjectHash: varchar("subject_hash", { length: 64 }).notNull(),
  route: varchar("route", { length: 160 }).notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  counter: integer("counter").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({ primary: primaryKey({ columns: [table.subjectHash, table.route, table.windowStart] }) }));

export const dispenserRelations = relations(dispensers, ({ many, one }) => ({
  channels: many(dispensingChannels),
  plans: many(distributionPlans),
  deviceState: one(deviceStates),
  alerts: many(operationalAlerts),
  completedDistributions: many(completedDistributions)
}));

export const planRelations = relations(distributionPlans, ({ many }) => ({ items: many(distributionPlanItems) }));

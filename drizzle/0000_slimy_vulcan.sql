CREATE TYPE "public"."alert_type" AS ENUM('low_stock', 'out_of_stock', 'maintenance', 'discrepancy');--> statement-breakpoint
CREATE TYPE "public"."channel_result" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."distribution_outcome" AS ENUM('complete', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."eligibility_import_status" AS ENUM('preview', 'committed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."lifecycle" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."service_override" AS ENUM('normal', 'temporarily_closed', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('refill', 'adjustment', 'distribution');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "administrative_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" varchar(120) NOT NULL,
	"action" varchar(120) NOT NULL,
	"entity_type" varchar(120) NOT NULL,
	"entity_id" varchar(180) NOT NULL,
	"field_diff" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "completed_distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispenser_id" uuid NOT NULL,
	"recipient_lookup_hash" varchar(64) NOT NULL,
	"service_day" date NOT NULL,
	"report_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_distribution_summaries" (
	"service_day" date NOT NULL,
	"dispenser_id" uuid,
	"recipient_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_distribution_summaries_service_day_dispenser_id_pk" PRIMARY KEY("service_day","dispenser_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_report_channels" (
	"report_id" uuid NOT NULL,
	"channel_number" integer NOT NULL,
	"result" "channel_result" NOT NULL,
	"count_after" integer NOT NULL,
	CONSTRAINT "device_report_channels_report_id_channel_number_pk" PRIMARY KEY("report_id","channel_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispenser_id" uuid NOT NULL,
	"report_id" integer NOT NULL,
	"service_day" date NOT NULL,
	"local_time" text NOT NULL,
	"citizen_id_lookup_hash" varchar(64) NOT NULL,
	"outcome" "distribution_outcome" NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_states" (
	"dispenser_id" uuid PRIMARY KEY NOT NULL,
	"last_seen_at" timestamp with time zone,
	"firmware_version" varchar(80),
	"client_version" varchar(80),
	"applied_plan_version" integer,
	"applied_eligibility_version" integer DEFAULT 0 NOT NULL,
	"applied_stock_revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dispensers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"province" varchar(120) DEFAULT '' NOT NULL,
	"district" varchar(120) DEFAULT '' NOT NULL,
	"latitude" text,
	"longitude" text,
	"contact" text,
	"notice" text,
	"image_url" text,
	"lifecycle" "lifecycle" DEFAULT 'draft' NOT NULL,
	"service_override" "service_override" DEFAULT 'normal' NOT NULL,
	"device_api_enabled_for_testing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dispensing_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispenser_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"supply_name" text DEFAULT '' NOT NULL,
	"unit" varchar(80) DEFAULT 'ชิ้น' NOT NULL,
	"capacity" integer DEFAULT 0 NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "distribution_plan_items" (
	"plan_id" uuid NOT NULL,
	"channel_number" integer NOT NULL,
	"supply_name" text NOT NULL,
	"unit" varchar(80) NOT NULL,
	"quantity_per_bundle" integer DEFAULT 1 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "distribution_plan_items_plan_id_channel_number_pk" PRIMARY KEY("plan_id","channel_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "distribution_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispenser_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"effective_service_day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eligibility_import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"citizen_id_ciphertext" text NOT NULL,
	"citizen_id_lookup_hash" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"valid" boolean DEFAULT false NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eligibility_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"status" "eligibility_import_status" DEFAULT 'preview' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"valid_count" integer DEFAULT 0 NOT NULL,
	"invalid_count" integer DEFAULT 0 NOT NULL,
	"committed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eligibility_versions" (
	"version" integer PRIMARY KEY NOT NULL,
	"record_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "operational_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "alert_type" NOT NULL,
	"dispenser_id" uuid NOT NULL,
	"channel_number" integer,
	"alert_key" varchar(180) NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
	"subject_hash" varchar(64) NOT NULL,
	"route" varchar(160) NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_buckets_subject_hash_route_window_start_pk" PRIMARY KEY("subject_hash","route","window_start")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"citizen_id_ciphertext" text NOT NULL,
	"citizen_id_lookup_hash" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispenser_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"delta" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"stock_revision" integer NOT NULL,
	"source_reference" text,
	"reason" text,
	"actor" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "completed_distributions" ADD CONSTRAINT "completed_distributions_dispenser_id_dispensers_id_fk" FOREIGN KEY ("dispenser_id") REFERENCES "public"."dispensers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "completed_distributions" ADD CONSTRAINT "completed_distributions_report_id_device_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."device_reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_distribution_summaries" ADD CONSTRAINT "daily_distribution_summaries_dispenser_id_dispensers_id_fk" FOREIGN KEY ("dispenser_id") REFERENCES "public"."dispensers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_report_channels" ADD CONSTRAINT "device_report_channels_report_id_device_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."device_reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_reports" ADD CONSTRAINT "device_reports_dispenser_id_dispensers_id_fk" FOREIGN KEY ("dispenser_id") REFERENCES "public"."dispensers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_states" ADD CONSTRAINT "device_states_dispenser_id_dispensers_id_fk" FOREIGN KEY ("dispenser_id") REFERENCES "public"."dispensers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dispensing_channels" ADD CONSTRAINT "dispensing_channels_dispenser_id_dispensers_id_fk" FOREIGN KEY ("dispenser_id") REFERENCES "public"."dispensers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "distribution_plan_items" ADD CONSTRAINT "distribution_plan_items_plan_id_distribution_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."distribution_plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "distribution_plans" ADD CONSTRAINT "distribution_plans_dispenser_id_dispensers_id_fk" FOREIGN KEY ("dispenser_id") REFERENCES "public"."dispensers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eligibility_import_rows" ADD CONSTRAINT "eligibility_import_rows_import_id_eligibility_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."eligibility_imports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "operational_alerts" ADD CONSTRAINT "operational_alerts_dispenser_id_dispensers_id_fk" FOREIGN KEY ("dispenser_id") REFERENCES "public"."dispensers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_dispenser_id_dispensers_id_fk" FOREIGN KEY ("dispenser_id") REFERENCES "public"."dispensers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_channel_id_dispensing_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."dispensing_channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "administrative_activities_created_idx" ON "administrative_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "completed_distributions_service_recipient_idx" ON "completed_distributions" USING btree ("service_day","recipient_lookup_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "completed_distributions_retention_idx" ON "completed_distributions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_reports_idempotency_unique" ON "device_reports" USING btree ("dispenser_id","report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_reports_service_day_idx" ON "device_reports" USING btree ("service_day");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dispensers_code_unique" ON "dispensers" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dispensers_lifecycle_idx" ON "dispensers" USING btree ("lifecycle");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "channels_dispenser_number_unique" ON "dispensing_channels" USING btree ("dispenser_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channels_dispenser_idx" ON "dispensing_channels" USING btree ("dispenser_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "plans_dispenser_version_unique" ON "distribution_plans" USING btree ("dispenser_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plans_effective_day_idx" ON "distribution_plans" USING btree ("dispenser_id","effective_service_day");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "eligibility_import_rows_number_unique" ON "eligibility_import_rows" USING btree ("import_id","row_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eligibility_imports_expiry_idx" ON "eligibility_imports" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "operational_alert_key_unique" ON "operational_alerts" USING btree ("alert_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "operational_alerts_active_idx" ON "operational_alerts" USING btree ("resolved_at","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "recipients_lookup_hash_unique" ON "recipients" USING btree ("citizen_id_lookup_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipients_active_idx" ON "recipients" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_dispenser_idx" ON "stock_movements" USING btree ("dispenser_id","created_at");
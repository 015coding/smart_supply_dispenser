import type { Lifecycle, ServiceOverride, ServiceStatus } from "@/lib/domain/types";

export interface AdminChannel {
  number: number;
  supply_name: string;
  unit: string;
  capacity: number;
  balance: number;
  low_stock_threshold: number;
  enabled: boolean;
}

export interface AdminPlan {
  version: number;
  effective_service_day: string;
  created_at: string;
  items: Array<{
    number: number;
    supply_name: string;
    unit: string;
    quantity_per_bundle: number;
    enabled: boolean;
  }>;
}

export interface AdminDispenser {
  code: string;
  name: string;
  address: string;
  province: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  contact: string | null;
  notice: string | null;
  image_url: string | null;
  lifecycle: Lifecycle;
  service_override: ServiceOverride;
  service_status: ServiceStatus;
  available_bundle_count: number;
  channels: AdminChannel[];
  plans: AdminPlan[];
  stock_revision: number;
  last_reported_at: string | null;
  created_at: string;
  updated_at: string;
  device_api_enabled_for_testing: boolean;
  active_channel_count: number;
}

export interface AdminAlert {
  id: string;
  type: string;
  dispenser_code: string;
  channel_number: number | null;
  title: string;
  detail: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminActivity {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  field_diff: Record<string, unknown>;
  created_at: string;
  created_at_thai: string;
}

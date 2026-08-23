import { CheckCircle2, CircleAlert, Clock3, Wrench } from "lucide-react";
import type { Lifecycle, ServiceStatus } from "@/lib/domain/types";

const labels: Record<ServiceStatus | Lifecycle, string> = {
  available: "พร้อมแจก",
  out_of_stock: "ของหมด",
  temporarily_closed: "ปิดชั่วคราว",
  maintenance: "ปิดซ่อมบำรุง",
  draft: "ฉบับร่าง",
  published: "เผยแพร่แล้ว",
  archived: "เก็บถาวร"
};

export function StatusBadge({ status }: { status: ServiceStatus | Lifecycle }) {
  const Icon = status === "available" || status === "published" ? CheckCircle2 : status === "maintenance" ? Wrench : status === "temporarily_closed" ? Clock3 : CircleAlert;
  return <span className={`status-badge status-${status}`}><Icon size={13} aria-hidden="true" />{labels[status]}</span>;
}

export function statusLabel(status: ServiceStatus | Lifecycle): string {
  return labels[status];
}

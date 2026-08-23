import { Clock3, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { PublicDispenser } from "@/lib/domain/types";
import { formatThaiDateTime } from "@/lib/domain/date";
import { DispenserPlaceholder } from "./DispenserPlaceholder";
import { StatusBadge } from "./StatusBadge";

export function DispenserCard({ dispenser }: { dispenser: PublicDispenser }) {
  return <Link className="dispenser-card" href={`/machines/${dispenser.code}`} aria-label={`ดูรายละเอียด ${dispenser.name}`}>
    <div className="dispenser-card-media">{dispenser.imageUrl ? <img src={dispenser.imageUrl} alt={`รูป ${dispenser.name}`} /> : <DispenserPlaceholder />}</div>
    <div className="dispenser-card-body">
      <div className="card-code">{dispenser.code}</div>
      <div style={{ marginTop: 7 }}><StatusBadge status={dispenser.status} /></div>
      <h3>{dispenser.name || "ยังไม่ได้ตั้งชื่อเครื่อง"}</h3>
      <p className="address-line"><MapPin size={14} /><span>{dispenser.district} · {dispenser.province}<br />{dispenser.address || "ยังไม่มีรายละเอียดที่อยู่"}</span></p>
    </div>
    <div className="dispenser-card-foot">
      <div><span className="metric-label">ชุดที่แจกได้</span><strong className="metric-number">{dispenser.availableBundleCount.toLocaleString("th-TH")} <small>ชุด</small></strong></div>
      <span className="last-updated" title={formatThaiDateTime(dispenser.lastReportedAt)}><Clock3 size={13} />อัปเดตล่าสุด</span>
      <ArrowRight size={17} color="var(--teal)" aria-hidden="true" />
    </div>
  </Link>;
}

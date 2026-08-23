"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowLeft, Clock3, MapPin, Phone, Megaphone } from "lucide-react";
import Link from "next/link";
import type { PublicDispenser } from "@/lib/domain/types";
import { formatThaiDateTime } from "@/lib/domain/date";
import { DispenserPlaceholder } from "./DispenserPlaceholder";
import { StatusBadge } from "./StatusBadge";

const MapView = dynamic(() => import("./MapView").then((module) => module.MapView), { ssr: false, loading: () => <div className="detail-panel empty-state" style={{ minHeight: 310 }}>กำลังโหลดแผนที่…</div> });

export function DispenserDetail({ dispenser }: { dispenser: PublicDispenser }) {
  return <>
    <section className="detail-hero"><div className="app-container"><Link className="back-link" href="/"><ArrowLeft size={16} /> กลับไปค้นหาเครื่อง</Link><div className="detail-heading"><div><div className="card-code">{dispenser.code}</div><h1>{dispenser.name}</h1></div><StatusBadge status={dispenser.status} /></div></div></section>
    <main className="app-container detail-layout">
      <div style={{ display: "grid", gap: 16 }}>
        <div className="detail-panel"><div className="detail-image">{dispenser.imageUrl ? <Image src={dispenser.imageUrl} alt={`รูป ${dispenser.name}`} fill sizes="(max-width: 720px) 100vw, 60vw" /> : <DispenserPlaceholder />}</div><div className="panel-content"><div className="panel-title"><h2>จำนวนชุดที่แจกได้</h2><span className="last-updated"><Clock3 size={13} /> {formatThaiDateTime(dispenser.lastReportedAt)}</span></div><div className="bundle-number"><strong>{dispenser.availableBundleCount.toLocaleString("th-TH")}</strong><span>ชุดสิ่งของช่วยเหลือ</span></div><div className="channel-list">{dispenser.channels.filter((channel) => channel.enabled).map((channel) => <div className="channel-row" key={channel.number}><div><strong>ช่อง {channel.number} · {channel.supplyName || "สิ่งของ"}</strong><small>หน่วย {channel.unit}</small></div><div className="channel-balance">{channel.balance.toLocaleString("th-TH")}<small>{channel.unit}</small></div></div>)}</div></div></div>
        {dispenser.notice && <div className="notice"><Megaphone size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} />{dispenser.notice}</div>}
      </div>
      <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <div className="detail-panel"><div className="panel-content"><div className="panel-title"><h2>ข้อมูลสถานที่</h2></div><dl className="detail-meta"><div><MapPin size={17} color="var(--teal)" /><span><dt>ที่อยู่และจุดสังเกต</dt><dd>{dispenser.address || "ยังไม่มีข้อมูล"}<br />{dispenser.district} · {dispenser.province}</dd></span></div>{dispenser.contact && <div><Phone size={17} color="var(--teal)" /><span><dt>เบอร์ติดต่อ</dt><dd>{dispenser.contact}</dd></span></div>}<div><Clock3 size={17} color="var(--teal)" /><span><dt>ข้อมูลล่าสุดที่ได้รับ</dt><dd>{formatThaiDateTime(dispenser.lastReportedAt)}</dd></span></div></dl></div></div>
        {typeof dispenser.latitude === "number" && typeof dispenser.longitude === "number" ? <MapView latitude={dispenser.latitude} longitude={dispenser.longitude} name={dispenser.name} address={dispenser.address} /> : <div className="detail-panel empty-state" style={{ minHeight: 200 }}>ยังไม่มีพิกัดสำหรับแสดงแผนที่</div>}
      </div>
    </main>
  </>;
}

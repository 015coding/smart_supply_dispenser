"use client";

import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { AdminActivity, AdminAlert, AdminDispenser } from "@/lib/api/admin-types";
import { formatThaiDateTime } from "@/lib/domain/date";
import { StatusBadge } from "./StatusBadge";

interface DashboardData {
  range: { from: string; to: string };
  summary: { totalDispensers: number; availableDispensers: number; unavailableDispensers: number; availableBundleCount: number; unresolvedAlertCount: number };
  alerts: AdminAlert[];
  recent_dispensers: AdminDispenser[];
  recent_activity: AdminActivity[];
  completed_recipient_chart: Array<{ serviceDay: string; recipientCount: number }>;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "ไม่สามารถโหลดข้อมูล Dashboard ได้";
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await apiFetch<DashboardData>("/api/v1/admin/dashboard?range=7d"));
      setError("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function acknowledge(id: string) {
    try {
      await apiFetch(`/api/v1/admin/alerts/${id}/acknowledge`, { method: "POST" });
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  const maxChart = useMemo(() => Math.max(1, ...(data?.completed_recipient_chart.map((item) => item.recipientCount) ?? [1])), [data]);

  return <>
    <div className="admin-topbar"><div><p className="eyebrow">พื้นที่ผู้ดูแล</p><h1>ภาพรวมระบบ</h1><p>ติดตามความพร้อมของจุดแจกและการให้บริการล่าสุด</p></div><div className="admin-actions"><button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} />รีเฟรช</button><Link className="button button-primary" href="/admin/dispensers/new"><Truck size={15} />สร้างเครื่องใหม่</Link></div></div>
    {error && <div className="form-message" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
    {loading && !data ? <div className="admin-panel empty-state">กำลังโหลดข้อมูล Dashboard…</div> : data && <>
      <section className="admin-grid" aria-label="สรุปสถานะ">
        <div className="admin-stat"><span>เครื่องทั้งหมด</span><strong>{data.summary.totalDispensers.toLocaleString("th-TH")}</strong></div>
        <div className="admin-stat"><span>พร้อมแจก</span><strong style={{ color: "var(--teal)" }}>{data.summary.availableDispensers.toLocaleString("th-TH")}</strong></div>
        <div className="admin-stat"><span>ไม่พร้อมแจก</span><strong style={{ color: "var(--warning)" }}>{data.summary.unavailableDispensers.toLocaleString("th-TH")}</strong></div>
        <div className="admin-stat"><span>ชุดที่แจกได้</span><strong>{data.summary.availableBundleCount.toLocaleString("th-TH")}</strong></div>
        <div className="admin-stat"><span>แจ้งเตือนที่ยังไม่แก้ไข</span><strong style={{ color: data.summary.unresolvedAlertCount ? "var(--danger)" : "var(--teal)" }}>{data.summary.unresolvedAlertCount.toLocaleString("th-TH")}</strong></div>
      </section>
      <div className="admin-columns">
        <section className="admin-panel"><div className="section-heading"><div><h2>แจ้งเตือนที่ต้องตรวจสอบ</h2><p>การรับทราบไม่ถือว่าแก้ไขสาเหตุแล้ว</p></div><Link className="text-link" href="/admin/dispensers">ดูเครื่องทั้งหมด →</Link></div>{data.alerts.length ? <div className="alert-list">{data.alerts.slice(0, 6).map((alert) => <div className={`alert-item${alert.type === "out_of_stock" || alert.type === "discrepancy" ? " alert-danger" : ""}`} key={alert.id}><div><strong><AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />{alert.title}</strong><p>{alert.detail}</p></div><button className="button button-quiet" type="button" onClick={() => void acknowledge(alert.id)} disabled={Boolean(alert.acknowledged_at)}>{alert.acknowledged_at ? "รับทราบแล้ว" : "รับทราบ"}</button></div>)}</div> : <div className="empty-state">ยังไม่มีแจ้งเตือนที่ต้องตรวจสอบ</div>}</section>
        <section className="admin-panel"><div className="section-heading"><div><h2>ผู้รับของสำเร็จ</h2><p>{data.range.from} ถึง {data.range.to}</p></div><CheckCircle2 size={19} color="var(--teal)" /></div><div className="chart-box" style={{ display: "flex", alignItems: "end", gap: 8, padding: "20px 0 8px" }}>{data.completed_recipient_chart.map((item) => <div key={item.serviceDay} title={`${item.serviceDay}: ${item.recipientCount}`} style={{ display: "grid", flex: 1, gap: 6, justifyItems: "center", alignItems: "end", height: "100%" }}><span style={{ width: "100%", maxWidth: 34, minHeight: 4, height: `${Math.max(4, (item.recipientCount / maxChart) * 100)}%`, borderRadius: "7px 7px 2px 2px", background: "var(--teal)" }} /><small style={{ color: "var(--muted)", fontSize: ".66rem" }}>{item.serviceDay.slice(8)}</small></div>)}</div></section>
      </div>
      <div className="admin-columns">
        <section className="admin-panel"><div className="section-heading"><div><h2>เครื่องที่มีการเปลี่ยนแปลงล่าสุด</h2><p>เปิดรายละเอียดเพื่อแก้ไขข้อมูลหรือสต็อก</p></div><Link className="text-link" href="/admin/dispensers">ดูทั้งหมด →</Link></div>{data.recent_dispensers.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>รหัส / ชื่อ</th><th>สถานะ</th><th>ชุดที่แจกได้</th><th>อัปเดต</th></tr></thead><tbody>{data.recent_dispensers.map((item) => <tr key={item.code}><td><Link className="text-link" href={`/admin/dispensers/${item.code}`}><strong>{item.code}</strong><br />{item.name || "ยังไม่ได้ตั้งชื่อ"}</Link></td><td><StatusBadge status={item.lifecycle} /><div style={{ marginTop: 4 }}><StatusBadge status={item.service_status} /></div></td><td>{item.available_bundle_count.toLocaleString("th-TH")} ชุด</td><td><span className="last-updated"><Clock3 size={13} />{formatThaiDateTime(item.updated_at)}</span></td></tr>)}</tbody></table></div> : <div className="empty-state">ยังไม่มีเครื่องในระบบ</div>}</section>
        <section className="admin-panel"><div className="section-heading"><div><h2>ประวัติล่าสุด</h2><p>กิจกรรมจากผู้ดูแลและอุปกรณ์</p></div><Link className="text-link" href="/admin/activity">ดูทั้งหมด →</Link></div>{data.recent_activity.length ? <div className="alert-list">{data.recent_activity.slice(0, 6).map((item) => <div className="alert-item" style={{ background: "var(--canvas)" }} key={item.id}><div><strong>{item.action}</strong><p>{item.entity_type} · {item.entity_id}<br />{item.created_at_thai}</p></div></div>)}</div> : <div className="empty-state">ยังไม่มีประวัติการทำรายการ</div>}</section>
      </div>
    </>}
  </>;
}

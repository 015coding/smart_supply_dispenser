"use client";

import { Plus, RefreshCw, Search, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { AdminDispenser } from "@/lib/api/admin-types";
import { formatThaiDateTime } from "@/lib/domain/date";
import { StatusBadge } from "./StatusBadge";

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "ไม่สามารถโหลดรายการเครื่องได้";
}

export function AdminDispenserList() {
  const [items, setItems] = useState<AdminDispenser[]>([]);
  const [lifecycle, setLifecycle] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", page_size: "100" });
      if (lifecycle !== "all") params.set("lifecycle", lifecycle);
      if (query.trim()) params.set("q", query.trim());
      const result = await apiFetch<{ items: AdminDispenser[] }>(`/api/v1/admin/dispensers?${params.toString()}`);
      setItems(result.items);
      setError("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [lifecycle, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function publish(code: string) {
    try {
      await apiFetch(`/api/v1/admin/dispensers/${code}/publish`, { method: "POST" });
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return <>
    <div className="admin-topbar"><div><p className="eyebrow">การจัดการเครื่อง</p><h1>เครื่องแจกสิ่งของ</h1><p>จัดเตรียม draft เติมสต็อก และเผยแพร่ข้อมูลให้ประชาชนค้นหา</p></div><div className="admin-actions"><button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} />รีเฟรช</button><Link className="button button-primary" href="/admin/dispensers/new"><Plus size={15} />สร้าง draft</Link></div></div>
    {error && <div className="form-message" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
    <section className="admin-panel"><div className="filter-panel" style={{ boxShadow: "none", padding: 0, border: 0, background: "transparent" }}><div className="input-wrap search-field"><label htmlFor="admin-dispenser-search"><Search size={12} style={{ verticalAlign: "-2px" }} /> ค้นหาเครื่อง</label><input className="input" id="admin-dispenser-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อเครื่อง รหัส หรือที่อยู่" /></div><div className="input-wrap"><label htmlFor="admin-lifecycle">การเผยแพร่</label><select className="select" id="admin-lifecycle" value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}><option value="all">ทั้งหมด</option><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่แล้ว</option><option value="archived">เก็บถาวร</option></select></div></div></section>
    <section className="admin-panel" style={{ marginTop: 16, padding: 0 }}>{loading && !items.length ? <div className="empty-state">กำลังโหลดรายการเครื่อง…</div> : items.length ? <div className="table-wrap" style={{ border: 0 }}><table className="data-table"><thead><tr><th>เครื่อง</th><th>การเผยแพร่</th><th>สถานะบริการ</th><th>ชุดที่แจกได้</th><th>แก้ไขล่าสุด</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.code}><td><Link className="text-link" href={`/admin/dispensers/${item.code}`}><strong>{item.code}</strong><br />{item.name || "ยังไม่ได้ตั้งชื่อ"}</Link><br /><span style={{ color: "var(--muted)", fontSize: ".74rem" }}>{item.district}{item.province ? ` · ${item.province}` : ""}</span></td><td><StatusBadge status={item.lifecycle} /></td><td><StatusBadge status={item.service_status} /></td><td><strong>{item.available_bundle_count.toLocaleString("th-TH")}</strong> ชุด</td><td>{formatThaiDateTime(item.updated_at)}</td><td>{item.lifecycle === "draft" && <button className="button button-quiet" type="button" onClick={() => void publish(item.code)}>เผยแพร่</button>}</td></tr>)}</tbody></table></div> : <div className="empty-state"><Truck size={35} style={{ color: "var(--teal)", marginBottom: 8 }} /><strong>ยังไม่มีเครื่องที่ตรงกับตัวกรอง</strong><span>สร้าง draft แรกเพื่อเริ่มเตรียมจุดแจก</span></div>}</section>
  </>;
}

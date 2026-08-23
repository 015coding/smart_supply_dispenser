"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { AdminActivity as ActivityRecord } from "@/lib/api/admin-types";

function errorMessage(error: unknown): string { return error instanceof ApiClientError ? error.message : "ไม่สามารถโหลดประวัติได้"; }

export function AdminActivity() {
  const [items, setItems] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await apiFetch<{ items: ActivityRecord[] }>("/api/v1/admin/activity?page=1&page_size=100")).items); setError(""); }
    catch (caught) { setError(errorMessage(caught)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return <>
    <div className="admin-topbar"><div><p className="eyebrow">ตรวจสอบย้อนหลัง</p><h1>ประวัติการทำรายการ</h1><p>บันทึกการเปลี่ยนข้อมูลจากผู้ดูแลและระบบอุปกรณ์</p></div><button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} />รีเฟรช</button></div>
    {error && <div className="form-message" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
    <section className="admin-panel" style={{ padding: 0 }}>{loading && !items.length ? <div className="empty-state">กำลังโหลดประวัติ…</div> : items.length ? <div className="table-wrap" style={{ border: 0 }}><table className="data-table"><thead><tr><th>เวลา</th><th>การกระทำ</th><th>รายการ</th><th>ผู้ดำเนินการ</th><th>รายละเอียด</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.created_at_thai}</td><td><strong>{item.action}</strong></td><td>{item.entity_type}<br />{item.entity_id}</td><td>{item.actor}</td><td><code style={{ fontSize: ".7rem", whiteSpace: "pre-wrap" }}>{JSON.stringify(item.field_diff)}</code></td></tr>)}</tbody></table></div> : <div className="empty-state"><Activity size={35} style={{ color: "var(--teal)", marginBottom: 8 }} /><strong>ยังไม่มีประวัติการทำรายการ</strong><span>กิจกรรมจะปรากฏเมื่อมีการเปลี่ยนข้อมูล</span></div>}</section>
  </>;
}

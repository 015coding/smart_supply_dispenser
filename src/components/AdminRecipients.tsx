"use client";

import { Plus, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { formatThaiDateTime } from "@/lib/domain/date";

interface Recipient { id: string; citizen_id: string; name: string; active: boolean; created_at: string; updated_at: string; }

function errorMessage(error: unknown): string { return error instanceof ApiClientError ? error.message : "ไม่สามารถโหลดรายชื่อได้"; }

export function AdminRecipients() {
  const [items, setItems] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await apiFetch<{ items: Recipient[] }>("/api/v1/admin/recipients?page=1&page_size=100")).items); setError(""); }
    catch (caught) { setError(errorMessage(caught)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return <>
    <div className="admin-topbar"><div><p className="eyebrow">รายชื่อผู้มีสิทธิ์</p><h1>ผู้มีสิทธิ์รับของ</h1><p>เลขประจำตัวประชาชนแสดงแบบปิดบังในหน้าจัดการ</p></div><div className="admin-actions"><Link className="button button-primary" href="/admin/recipients/new"><Plus size={15} />สร้าง / Import รายชื่อ</Link><button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} />รีเฟรช</button></div></div>
    {error && <div className="form-message" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
    <section className="admin-panel" style={{ padding: 0 }}>{loading && !items.length ? <div className="empty-state">กำลังโหลดรายชื่อ…</div> : items.length ? <div className="table-wrap" style={{ border: 0 }}><table className="data-table"><thead><tr><th>เลขประจำตัวประชาชน</th><th>ชื่อ</th><th>สถานะ</th><th>แก้ไขล่าสุด</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.citizen_id}</strong></td><td>{item.name}</td><td><span className={`status-badge ${item.active ? "status-available" : "status-archived"}`}>{item.active ? "ใช้งาน" : "ปิดสิทธิ์"}</span></td><td>{formatThaiDateTime(item.updated_at)}</td></tr>)}</tbody></table></div> : <div className="empty-state"><Users size={35} style={{ color: "var(--teal)", marginBottom: 8 }} /><strong>ยังไม่มีผู้มีสิทธิ์รับของ</strong><span>กด “สร้าง / Import รายชื่อ” เพื่อเพิ่มข้อมูลและส่งเข้า API</span></div>}</section>
  </>;
}

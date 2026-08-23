"use client";

import { ArrowLeft, CheckCircle2, FileUp, Send, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api/client";

interface ImportRow {
  rowNumber: number;
  citizenId: string;
  name: string;
  valid: boolean;
  error: string | null;
}

interface ImportPreview {
  id: string;
  checksum: string;
  createdAt: string;
  expiresAt: string;
  status: "preview" | "committed" | "expired";
  validCount: number;
  invalidCount: number;
  committedCount: number;
  rows: ImportRow[];
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

const csvTemplate = "citizen_id,name\n";

export function AdminRecipientEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [citizenId, setCitizenId] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function createRecipient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch("/api/v1/admin/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizen_id: citizenId, name, active })
      });
      setCitizenId("");
      setName("");
      setActive(true);
      setSuccess("เพิ่มรายชื่อสำเร็จ และข้อมูลพร้อมให้เครื่องดึงผ่าน Device API ในรอบ sync ถัดไป");
    } catch (caught) {
      setError(errorMessage(caught, "ไม่สามารถเพิ่มรายชื่อได้"));
    } finally {
      setSaving(false);
    }
  }

  async function previewImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("กรุณาเลือกไฟล์ CSV ก่อนตรวจสอบ");
      return;
    }
    setImporting(true);
    setError("");
    setSuccess("");
    try {
      const body = new FormData();
      body.append("file", file);
      setPreview(await apiFetch<ImportPreview>("/api/v1/admin/eligibility-imports/preview", { method: "POST", body }));
    } catch (caught) {
      setError(errorMessage(caught, "ไม่สามารถตรวจสอบไฟล์ CSV ได้"));
      setPreview(null);
    } finally {
      setImporting(false);
    }
  }

  async function commitImport() {
    if (!preview || preview.status !== "preview") return;
    setCommitting(true);
    setError("");
    setSuccess("");
    try {
      const result = await apiFetch<ImportPreview>(`/api/v1/admin/eligibility-imports/${preview.id}/commit`, { method: "POST" });
      setPreview(result);
      setSuccess(`ยิง API สำเร็จ เพิ่มรายชื่อใหม่ ${result.committedCount.toLocaleString("th-TH")} รายการ`);
    } catch (caught) {
      setError(errorMessage(caught, "ไม่สามารถยืนยัน import ได้"));
    } finally {
      setCommitting(false);
    }
  }

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setPreview(null);
    setError("");
    setSuccess("");
  }

  return <>
    <div className="admin-topbar">
      <div>
        <Link className="back-link" href="/admin/recipients"><ArrowLeft size={15} /> กลับรายการรายชื่อ</Link>
        <p className="eyebrow">รายชื่อผู้มีสิทธิ์</p>
        <h1>สร้างรายชื่อ</h1>
        <p>เพิ่มทีละรายชื่อ หรือ import CSV แล้วกดยืนยันส่งเข้าระบบ API ได้ทันที</p>
      </div>
    </div>
    {error && <div className="form-message" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
    {success && <div className="form-success" role="status" style={{ marginBottom: 16 }}><CheckCircle2 size={16} />{success}</div>}

    <div className="admin-columns" style={{ marginTop: 0 }}>
      <section className="admin-panel form-section">
        <div className="section-heading"><div><h2>เพิ่มรายชื่อทีละคน</h2><p>ระบบจะตรวจสอบเลขประจำตัวประชาชนและกันข้อมูลซ้ำให้</p></div><UserPlus size={19} color="var(--teal)" /></div>
        <form className="form-grid" onSubmit={createRecipient}>
          <div className="input-wrap full"><label htmlFor="recipient-citizen-id">เลขประจำตัวประชาชน</label><input className="input" id="recipient-citizen-id" inputMode="numeric" autoComplete="off" value={citizenId} onChange={(event) => setCitizenId(event.target.value)} placeholder="กรอก 13 หลัก" required /></div>
          <div className="input-wrap full"><label htmlFor="recipient-name">ชื่อ-นามสกุล</label><input className="input" id="recipient-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น คุณสายฝน ใจดี" required /></div>
          <label className="admin-user full"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> เปิดสิทธิ์ใช้งานทันที</label>
          <div className="form-actions full"><button className="button button-primary" type="submit" disabled={saving}><Send size={15} />{saving ? "กำลังยิง API…" : "บันทึกและยิง API"}</button></div>
        </form>
      </section>

      <section className="admin-panel form-section">
        <div className="section-heading"><div><h2>Import รายชื่อจาก CSV</h2><p>รูปแบบไฟล์ต้องเป็น <code>citizen_id,name</code></p></div><FileUp size={19} color="var(--teal)" /></div>
        <form onSubmit={previewImport}>
          <div className="import-drop"><label htmlFor="recipient-csv">เลือกไฟล์ CSV</label><input ref={fileInputRef} id="recipient-csv" type="file" accept=".csv,text/csv" onChange={selectFile} /><span>{file ? `ไฟล์ที่เลือก: ${file.name}` : "รองรับไฟล์ขนาดไม่เกิน 5 MB"}</span></div>
          <div className="form-actions"><a className="button button-secondary" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate)}`} download="recipients-template.csv">ดาวน์โหลดตัวอย่าง</a><button className="button button-secondary" type="submit" disabled={!file || importing}><FileUp size={15} />{importing ? "กำลังตรวจสอบ…" : "ตรวจสอบไฟล์"}</button></div>
        </form>
        {preview && <div className="import-preview">
          <div className="import-summary"><span className="summary-pill">ใช้ได้ {preview.validCount.toLocaleString("th-TH")}</span><span className="summary-pill">ผิดพลาด {preview.invalidCount.toLocaleString("th-TH")}</span>{preview.status === "committed" && <span className="summary-pill">ส่งแล้ว {preview.committedCount.toLocaleString("th-TH")}</span>}</div>
          <div className="table-wrap"><table className="data-table"><thead><tr><th>แถว</th><th>เลขประจำตัว</th><th>ชื่อ</th><th>ผลตรวจ</th></tr></thead><tbody>{preview.rows.slice(0, 30).map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.citizenId}</td><td>{row.name}</td><td className={row.valid ? "import-valid" : "import-invalid"}>{row.valid ? "พร้อมส่ง" : row.error}</td></tr>)}</tbody></table></div>
          {preview.rows.length > 30 && <p className="import-note">แสดงตัวอย่าง 30 แถวแรกจากทั้งหมด {preview.rows.length.toLocaleString("th-TH")} แถว</p>}
          {preview.invalidCount > 0 && <a className="text-link" href={`/api/v1/admin/eligibility-imports/${preview.id}/errors.csv`}>ดาวน์โหลดแถวที่ผิดพลาด</a>}
          <div className="form-actions"><button className="button button-primary" type="button" onClick={() => void commitImport()} disabled={committing || preview.status !== "preview" || preview.validCount === 0}><Send size={15} />{committing ? "กำลังยิง API…" : preview.status === "committed" ? "ส่งแล้ว" : "ยืนยันและยิง API"}</button></div>
        </div>}
      </section>
    </div>
  </>;
}

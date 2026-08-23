"use client";

import { Archive, ArrowLeft, ImagePlus, PackagePlus, Save, Send, Trash2, Upload, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { AdminDispenser, AdminPlan } from "@/lib/api/admin-types";
import { SUPPORTED_UNITS } from "@/lib/domain/types";
import { formatThaiDate, formatThaiDateTime } from "@/lib/domain/date";
import { StatusBadge } from "./StatusBadge";

const AdminLocationPicker = dynamic(
  () => import("./AdminLocationPicker").then((module) => module.AdminLocationPicker),
  { ssr: false, loading: () => <div className="location-map-loading full">กำลังโหลดแผนที่…</div> }
);

interface ChannelForm {
  number: number;
  supply_name: string;
  unit: string;
  capacity: string;
  balance: string;
  low_stock_threshold: string;
  enabled: boolean;
}

interface EditorForm {
  name: string;
  address: string;
  province: string;
  district: string;
  latitude: string;
  longitude: string;
  contact: string;
  notice: string;
  service_override: "normal" | "temporarily_closed" | "maintenance";
  device_api_enabled_for_testing: boolean;
  channels: ChannelForm[];
}

const emptyChannels = (): ChannelForm[] => Array.from({ length: 3 }, (_, index) => ({
  number: index + 1,
  supply_name: "",
  unit: "ชิ้น",
  capacity: "0",
  balance: "0",
  low_stock_threshold: "0",
  enabled: false
}));

const emptyForm = (): EditorForm => ({
  name: "",
  address: "",
  province: "",
  district: "",
  latitude: "",
  longitude: "",
  contact: "",
  notice: "",
  service_override: "normal",
  device_api_enabled_for_testing: false,
  channels: emptyChannels()
});

function fromDispenser(dispenser: AdminDispenser): EditorForm {
  return {
    name: dispenser.name,
    address: dispenser.address,
    province: dispenser.province,
    district: dispenser.district,
    latitude: dispenser.latitude === null ? "" : String(dispenser.latitude),
    longitude: dispenser.longitude === null ? "" : String(dispenser.longitude),
    contact: dispenser.contact ?? "",
    notice: dispenser.notice ?? "",
    service_override: dispenser.service_override,
    device_api_enabled_for_testing: dispenser.device_api_enabled_for_testing,
    channels: dispenser.channels.map((channel) => ({
      number: channel.number,
      supply_name: channel.supply_name,
      unit: channel.unit,
      capacity: String(channel.capacity),
      balance: String(channel.balance),
      low_stock_threshold: String(channel.low_stock_threshold),
      enabled: channel.enabled
    }))
  };
}

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "ไม่สามารถบันทึกข้อมูลได้";
}

function inputNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function AdminDispenserEditor({ code }: { code?: string }) {
  const router = useRouter();
  const editing = Boolean(code);
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [dispenser, setDispenser] = useState<AdminDispenser | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stockChannel, setStockChannel] = useState(1);
  const [stockType, setStockType] = useState<"refill" | "adjustment">("refill");
  const [stockAmount, setStockAmount] = useState("10");
  const [stockReason, setStockReason] = useState("");
  const [stockSaving, setStockSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageSaving, setImageSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewUrlRef = useRef("");

  useEffect(() => {
    if (!code) return;
    let active = true;
    void apiFetch<AdminDispenser>(`/api/v1/admin/dispensers/${code}`).then((result) => {
      if (!active) return;
      setDispenser(result);
      setForm(fromDispenser(result));
      setStockChannel(result.channels.find((channel) => channel.enabled)?.number ?? 1);
    }).catch((caught) => {
      if (active) setError(errorMessage(caught));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [code]);

  useEffect(() => () => {
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
  }, []);

  function updateChannel(number: number, field: keyof ChannelForm, value: string | boolean) {
    setForm((current) => ({ ...current, channels: current.channels.map((channel) => channel.number === number ? { ...channel, [field]: value } : channel) }));
  }

  function updateLocation(latitude: string, longitude: string) {
    setForm((current) => ({ ...current, latitude, longitude }));
  }

  function clearSelectedImage() {
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    imagePreviewUrlRef.current = "";
    setImagePreviewUrl("");
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    if (!file) {
      clearSelectedImage();
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("รูปภาพต้องมีขนาดไม่เกิน 10 MB");
      clearSelectedImage();
      return;
    }
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    imagePreviewUrlRef.current = URL.createObjectURL(file);
    setImagePreviewUrl(imagePreviewUrlRef.current);
    setImageFile(file);
  }

  async function uploadImage(dispenserCode: string, file: File): Promise<AdminDispenser> {
    const body = new FormData();
    body.append("image", file);
    return apiFetch<AdminDispenser>(`/api/v1/admin/dispensers/${dispenserCode}/image`, { method: "PUT", body });
  }

  async function uploadSelectedImage() {
    if (!code || !imageFile) return;
    setImageSaving(true);
    setError("");
    try {
      const result = await uploadImage(code, imageFile);
      setDispenser(result);
      clearSelectedImage();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setImageSaving(false);
    }
  }

  async function deleteImage() {
    if (!code || !dispenser?.image_url) return;
    setImageSaving(true);
    setError("");
    try {
      const result = await apiFetch<AdminDispenser>(`/api/v1/admin/dispensers/${code}/image`, { method: "DELETE" });
      setDispenser(result);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setImageSaving(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      address: form.address,
      province: form.province,
      district: form.district,
      latitude: form.latitude.trim() ? inputNumber(form.latitude) : null,
      longitude: form.longitude.trim() ? inputNumber(form.longitude) : null,
      contact: form.contact.trim() || null,
      notice: form.notice.trim() || null,
      service_override: form.service_override,
      device_api_enabled_for_testing: form.device_api_enabled_for_testing,
      channels: form.channels.map((channel) => ({
        number: channel.number,
        supply_name: channel.supply_name,
        unit: channel.unit,
        capacity: inputNumber(channel.capacity),
        balance: inputNumber(channel.balance),
        low_stock_threshold: inputNumber(channel.low_stock_threshold),
        enabled: channel.enabled
      }))
    };
    try {
      let result = await apiFetch<AdminDispenser>(editing ? `/api/v1/admin/dispensers/${code}` : "/api/v1/admin/dispensers", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      let imageUploadError = "";
      if (imageFile) {
        setImageSaving(true);
        try {
          result = await uploadImage(result.code, imageFile);
          clearSelectedImage();
        } catch (caught) {
          imageUploadError = `บันทึกข้อมูลเครื่องแล้ว แต่${errorMessage(caught)}`;
        } finally {
          setImageSaving(false);
        }
      }
      setDispenser(result);
      setForm(fromDispenser(result));
      if (!editing) {
        router.replace(`/admin/dispensers/${result.code}`);
        router.refresh();
      }
      if (imageUploadError) setError(imageUploadError);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function lifecycleAction(action: "publish" | "archive") {
    if (!code) return;
    setSaving(true);
    setError("");
    try {
      const result = await apiFetch<AdminDispenser>(`/api/v1/admin/dispensers/${code}/${action}`, { method: "POST" });
      setDispenser(result);
      setForm(fromDispenser(result));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function saveStock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code) return;
    setStockSaving(true);
    setError("");
    const payload = stockType === "refill"
      ? { channel_number: stockChannel, type: stockType, amount: inputNumber(stockAmount) }
      : { channel_number: stockChannel, type: stockType, target_balance: inputNumber(stockAmount), reason: stockReason };
    try {
      await apiFetch(`/api/v1/admin/dispensers/${code}/stock-movements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await apiFetch<AdminDispenser>(`/api/v1/admin/dispensers/${code}`);
      setDispenser(result);
      setForm(fromDispenser(result));
      setStockReason("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setStockSaving(false);
    }
  }

  if (loading) return <div className="admin-panel empty-state">กำลังโหลดข้อมูลเครื่อง…</div>;

  const activePlans = dispenser?.plans ?? [];
  const displayedImageUrl = imagePreviewUrl || dispenser?.image_url || "";
  return <>
    <div className="admin-topbar"><div><Link className="back-link" href="/admin/dispensers"><ArrowLeft size={15} /> กลับรายการเครื่อง</Link><p className="eyebrow">{editing ? `แก้ไข ${code}` : "สร้างเครื่องใหม่"}</p><h1>{editing ? (dispenser?.name || code) : "สร้าง draft ใหม่"}</h1><p>{editing ? "แก้ไขข้อมูลโดยไม่เปลี่ยนรหัสเครื่อง" : "บันทึกเป็นฉบับร่างก่อนตรวจสอบและเผยแพร่"}</p></div><div className="admin-actions">{dispenser && <StatusBadge status={dispenser.lifecycle} />}{dispenser?.lifecycle === "draft" && <button className="button button-primary" type="button" disabled={saving} onClick={() => void lifecycleAction("publish")}><Send size={15} />เผยแพร่</button>}{dispenser?.lifecycle === "published" && <button className="button button-secondary" type="button" disabled={saving} onClick={() => void lifecycleAction("archive")}><Archive size={15} />เก็บถาวร</button>}</div></div>
    {error && <div className="form-message" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
    <form onSubmit={save}>
      <section className="admin-panel form-section"><div className="section-heading"><div><h2>ข้อมูลจุดแจก</h2><p>รหัสเครื่องจะถูกสร้างอัตโนมัติเมื่อบันทึกครั้งแรก</p></div></div><div className="form-grid"><div className="input-wrap"><label htmlFor="dispenser-name">ชื่อจุดแจก</label><input className="input" id="dispenser-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="input-wrap"><label htmlFor="dispenser-contact">เบอร์ติดต่อ</label><input className="input" id="dispenser-contact" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /></div><div className="input-wrap"><label htmlFor="dispenser-province">จังหวัด</label><input className="input" id="dispenser-province" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} /></div><div className="input-wrap"><label htmlFor="dispenser-district">อำเภอ</label><input className="input" id="dispenser-district" value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /></div><div className="input-wrap full"><label htmlFor="dispenser-address">ที่อยู่ / จุดสังเกต</label><textarea className="textarea" id="dispenser-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div>
        <div className="dispenser-image-editor full">
          <div className="dispenser-image-preview">
            {displayedImageUrl
              ? <Image src={displayedImageUrl} alt={`รูป ${form.name || "เครื่องแจกสิ่งของ"}`} fill sizes="(max-width: 720px) 100vw, 420px" unoptimized={displayedImageUrl.startsWith("blob:")} />
              : <div className="dispenser-image-empty"><ImagePlus size={34} /><span>ยังไม่มีรูปเครื่อง</span></div>}
          </div>
          <div className="dispenser-image-controls">
            <div><strong>รูปเครื่อง</strong><p>เลือกไฟล์รูปภาพชนิดใดก็ได้ ขนาดไม่เกิน 10 MB</p></div>
            <label className="button button-secondary image-file-button" htmlFor="dispenser-image"><ImagePlus size={15} />{displayedImageUrl ? "เลือกรูปใหม่" : "เลือกรูป"}</label>
            <input ref={imageInputRef} className="image-file-input" id="dispenser-image" type="file" accept="image/*" onChange={selectImage} />
            {imageFile && <div className="selected-image-file"><span>{imageFile.name} · {(imageFile.size / 1024 / 1024).toFixed(2)} MB</span><button className="button button-quiet" type="button" onClick={clearSelectedImage} disabled={imageSaving}><X size={14} />ยกเลิก</button></div>}
            {!editing && imageFile && <p className="image-upload-note">รูปจะถูกอัปโหลดอัตโนมัติเมื่อกดบันทึกข้อมูล</p>}
            <div className="dispenser-image-actions">
              {editing && imageFile && <button className="button button-primary" type="button" onClick={() => void uploadSelectedImage()} disabled={imageSaving || saving}><Upload size={15} />{imageSaving ? "กำลังอัปโหลด…" : "อัปโหลดรูป"}</button>}
              {editing && dispenser?.image_url && !imageFile && <button className="button button-secondary" type="button" onClick={() => void deleteImage()} disabled={imageSaving || saving}><Trash2 size={15} />{imageSaving ? "กำลังลบ…" : "ลบรูป"}</button>}
            </div>
          </div>
        </div>
        <AdminLocationPicker latitude={form.latitude} longitude={form.longitude} onChange={updateLocation} /><div className="input-wrap"><label htmlFor="dispenser-service">สถานะการให้บริการ</label><select className="select" id="dispenser-service" value={form.service_override} onChange={(event) => setForm({ ...form, service_override: event.target.value as EditorForm["service_override"] })}><option value="normal">ปกติ</option><option value="temporarily_closed">ปิดชั่วคราว</option><option value="maintenance">ปิดซ่อมบำรุง</option></select></div><div className="input-wrap"><label htmlFor="dispenser-notice">ประกาศสำหรับประชาชน</label><input className="input" id="dispenser-notice" value={form.notice} onChange={(event) => setForm({ ...form, notice: event.target.value })} placeholder="เช่น กรุณานำบัตรประชาชนตัวจริงมาด้วย" /></div><div className="input-wrap full"><label className="admin-user"><input type="checkbox" checked={form.device_api_enabled_for_testing} onChange={(event) => setForm({ ...form, device_api_enabled_for_testing: event.target.checked })} /> เปิด Device API สำหรับการทดสอบ</label></div></div></section>
      <section className="admin-panel form-section" style={{ marginTop: 16 }}><div className="section-heading"><div><h2>สิ่งของในเครื่อง</h2><p>ช่องที่เปิดใช้งานจะเป็นรายการในชุดสิ่งของช่วยเหลือ</p></div></div>{form.channels.map((channel) => <div className="channel-editor" key={channel.number}><div className="channel-editor-heading"><strong>ช่องจ่าย {channel.number}</strong><label className="admin-user"><input type="checkbox" checked={channel.enabled} onChange={(event) => updateChannel(channel.number, "enabled", event.target.checked)} /> ใช้งาน</label></div><div className="channel-editor-fields"><div className="input-wrap wide"><label htmlFor={`supply-${channel.number}`}>ชื่อสิ่งของ</label><input className="input" id={`supply-${channel.number}`} value={channel.supply_name} onChange={(event) => updateChannel(channel.number, "supply_name", event.target.value)} placeholder="เช่น น้ำดื่ม" /></div><div className="input-wrap"><label htmlFor={`unit-${channel.number}`}>หน่วย</label><select className="select" id={`unit-${channel.number}`} value={SUPPORTED_UNITS.includes(channel.unit as typeof SUPPORTED_UNITS[number]) ? channel.unit : "อื่น ๆ"} onChange={(event) => updateChannel(channel.number, "unit", event.target.value)}>{SUPPORTED_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></div><div className="input-wrap"><label htmlFor={`capacity-${channel.number}`}>ความจุ</label><input className="input" id={`capacity-${channel.number}`} type="number" min="0" value={channel.capacity} onChange={(event) => updateChannel(channel.number, "capacity", event.target.value)} /></div><div className="input-wrap"><label htmlFor={`balance-${channel.number}`}>ยอดคงเหลือ</label><input className="input" id={`balance-${channel.number}`} type="number" min="0" value={channel.balance} onChange={(event) => updateChannel(channel.number, "balance", event.target.value)} /></div><div className="input-wrap"><label htmlFor={`threshold-${channel.number}`}>เตือนเมื่อเหลือ</label><input className="input" id={`threshold-${channel.number}`} type="number" min="0" value={channel.low_stock_threshold} onChange={(event) => updateChannel(channel.number, "low_stock_threshold", event.target.value)} /></div></div></div>)}<div className="form-actions"><Link className="button button-secondary" href="/admin/dispensers">ยกเลิก</Link><button className="button button-primary" type="submit" disabled={saving || imageSaving}><Save size={15} />{saving ? "กำลังบันทึก…" : "บันทึกข้อมูล"}</button></div></section>
    </form>
    {dispenser && <>
      <section className="admin-panel" style={{ marginTop: 16 }}><div className="section-heading"><div><h2>ปรับสต็อก</h2><p>การเติมและปรับยอดมีผลทันที และสร้างประวัติการทำรายการ</p></div><PackagePlus size={19} color="var(--teal)" /></div><form className="form-grid" onSubmit={saveStock}><div className="input-wrap"><label htmlFor="stock-channel">ช่องจ่าย</label><select className="select" id="stock-channel" value={stockChannel} onChange={(event) => setStockChannel(Number(event.target.value))}>{dispenser.channels.map((channel) => <option key={channel.number} value={channel.number}>ช่อง {channel.number} · {channel.supply_name || "ยังไม่ตั้งชื่อ"} · เหลือ {channel.balance}</option>)}</select></div><div className="input-wrap"><label htmlFor="stock-type">ประเภท</label><select className="select" id="stock-type" value={stockType} onChange={(event) => setStockType(event.target.value as typeof stockType)}><option value="refill">เติมสินค้า</option><option value="adjustment">ปรับยอดจากการตรวจนับ</option></select></div><div className="input-wrap"><label htmlFor="stock-amount">{stockType === "refill" ? "จำนวนที่เติม" : "ยอดใหม่"}</label><input className="input" id="stock-amount" type="number" min={stockType === "refill" ? "1" : "0"} value={stockAmount} onChange={(event) => setStockAmount(event.target.value)} required /></div>{stockType === "adjustment" && <div className="input-wrap"><label htmlFor="stock-reason">เหตุผล</label><input className="input" id="stock-reason" value={stockReason} onChange={(event) => setStockReason(event.target.value)} required /></div>}<div className="form-actions full"><button className="button button-secondary" type="submit" disabled={stockSaving}><PackagePlus size={15} />{stockSaving ? "กำลังบันทึก…" : "บันทึกสต็อก"}</button></div></form></section>
      <section className="admin-panel" style={{ marginTop: 16 }}><div className="section-heading"><div><h2>แผนการแจก</h2><p>แผนเป็น revision แบบแก้ย้อนหลังไม่ได้</p></div><span className="summary-pill">stock revision {dispenser.stock_revision}</span></div>{activePlans.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Revision</th><th>มีผลวันให้บริการ</th><th>รายการในชุด</th><th>สร้างเมื่อ</th></tr></thead><tbody>{activePlans.map((plan: AdminPlan) => <tr key={plan.version}><td><strong>v{plan.version}</strong></td><td>{formatThaiDate(plan.effective_service_day)}</td><td>{plan.items.filter((item) => item.enabled).map((item) => `${item.supply_name || `ช่อง ${item.number}`} × ${item.quantity_per_bundle}`).join(" · ")}</td><td>{formatThaiDateTime(plan.created_at)}</td></tr>)}</tbody></table></div> : <div className="empty-state">ยังไม่มีแผนการแจก</div>}</section>
    </>}
  </>;
}

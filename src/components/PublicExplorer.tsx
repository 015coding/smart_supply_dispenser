"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicDispenser, ServiceStatus } from "@/lib/domain/types";
import { apiFetch } from "@/lib/api/client";
import { DispenserCard } from "./DispenserCard";

interface ExplorerProps {
  initialItems: PublicDispenser[];
  initialFacets: { provinces: string[]; districts: string[] };
  initialTotal: number;
}

const statusOptions: Array<{ value: "all" | ServiceStatus; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "available", label: "พร้อมแจก" },
  { value: "out_of_stock", label: "ของหมด" },
  { value: "temporarily_closed", label: "ปิดชั่วคราว" },
  { value: "maintenance", label: "ปิดซ่อมบำรุง" }
];

export function PublicExplorer({ initialItems, initialFacets, initialTotal }: ExplorerProps) {
  const [items, setItems] = useState(initialItems);
  const [facets, setFacets] = useState(initialFacets);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("all");
  const [district, setDistrict] = useState("all");
  const [status, setStatus] = useState<"all" | ServiceStatus>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: "1", page_size: "100" });
      if (query.trim()) params.set("q", query.trim());
      if (province !== "all") params.set("province", province);
      if (district !== "all") params.set("district", district);
      if (status !== "all") params.set("status", status);
      try {
        const result = await apiFetch<{ items: PublicDispenser[]; pagination: { total: number }; facets: typeof initialFacets }>(`/api/v1/public/dispensers?${params.toString()}`, { signal: controller.signal });
        setItems(result.items); setFacets(result.facets); setTotal(result.pagination.total);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setItems([]);
      } finally { setLoading(false); }
    }, 180);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [district, initialFacets, province, query, status]);

  const available = useMemo(() => items.filter((item) => item.status === "available").length, [items]);
  const totalBundles = useMemo(() => items.reduce((sum, item) => sum + item.availableBundleCount, 0), [items]);

  return <>
    <section className="hero"><div className="app-container hero-grid">
      <div><p className="eyebrow">จุดแจกสิ่งของช่วยเหลือ</p><h1>ค้นหาจุดแจก<br /><span style={{ color: "var(--teal)" }}>ที่พร้อมแบ่งปัน</span></h1><p className="hero-copy">ตรวจสอบสถานะและจำนวนชุดสิ่งของจากเครื่องแจกใกล้พื้นที่ของคุณ โดยไม่ต้องใช้ตำแหน่งปัจจุบัน</p></div>
      <p className="hero-note">ข้อมูลบนหน้านี้แสดงสถานะการให้บริการและยอดที่ระบบได้รับรายงานล่าสุด อาจเปลี่ยนแปลงตามการเติมสินค้าและการแจกจริง</p>
    </div><div className="app-container stats-row"><div className="stat"><strong>{total.toLocaleString("th-TH")}</strong><span>เครื่องที่เผยแพร่</span></div><div className="stat"><strong>{available.toLocaleString("th-TH")}</strong><span>จุดที่พร้อมแจกในผลลัพธ์</span></div><div className="stat"><strong>{totalBundles.toLocaleString("th-TH")}</strong><span>ชุดที่แจกได้ในผลลัพธ์</span></div></div></section>
    <section className="app-container" aria-labelledby="public-list-heading">
      <div className="toolbar"><div><h2 id="public-list-heading">เครื่องแจกสิ่งของ</h2><p>เรียงจุดที่พร้อมแจกไว้ด้านบน</p></div><span style={{ color: "var(--muted)", fontSize: ".8rem" }}>{loading ? "กำลังค้นหา…" : `พบ ${items.length.toLocaleString("th-TH")} จุด`}</span></div>
      <div className="filter-panel">
        <div className="input-wrap search-field"><label htmlFor="public-search">ค้นหาชื่อเครื่องหรือที่อยู่</label><div style={{ position: "relative" }}><Search size={17} style={{ position: "absolute", left: 12, top: 13, color: "var(--muted)" }} /><input id="public-search" className="input" style={{ paddingLeft: 38 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น ศูนย์พักพิง หรือคลองหลวง" /></div></div>
        <div className="input-wrap"><label htmlFor="province-filter">จังหวัด</label><select id="province-filter" className="select" value={province} onChange={(event) => { setProvince(event.target.value); setDistrict("all"); }}><option value="all">ทุกจังหวัด</option>{facets.provinces.map((value) => <option key={value}>{value}</option>)}</select></div>
        <div className="input-wrap"><label htmlFor="district-filter">อำเภอ</label><select id="district-filter" className="select" value={district} onChange={(event) => setDistrict(event.target.value)}><option value="all">ทุกอำเภอ</option>{facets.districts.map((value) => <option key={value}>{value}</option>)}</select></div>
        <div className="input-wrap"><label htmlFor="status-filter"><SlidersHorizontal size={12} style={{ verticalAlign: "-2px" }} /> สถานะ</label><select id="status-filter" className="select" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      </div>
      <div className="card-grid" style={{ marginTop: 16 }}>{items.length ? items.map((item) => <DispenserCard key={item.code} dispenser={item} />) : <div className="empty-state"><strong>ยังไม่พบเครื่องที่ตรงกับการค้นหา</strong><span>ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองแล้วค้นหาใหม่</span></div>}</div>
    </section>
  </>;
}

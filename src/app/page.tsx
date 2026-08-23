import type { Metadata } from "next";
import { PublicExplorer } from "@/components/PublicExplorer";
import { PublicHeader } from "@/components/PublicHeader";
import { store } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ค้นหาจุดแจกสิ่งของช่วยเหลือ · พร้อมปัน",
  description: "ค้นหาเครื่องแจกสิ่งของช่วยเหลือ ดูสถานะ จำนวนชุด และตำแหน่งบนแผนที่"
};

export default async function HomePage() {
  const result = await store.listPublic({ page: 1, pageSize: 100 });

  return (
    <>
      <PublicHeader />
      <PublicExplorer
        initialItems={result.items}
        initialFacets={result.facets}
        initialTotal={result.pagination.total}
      />
      <footer className="footer">
        <div className="app-container">พร้อมปัน · ข้อมูลสถานะอาจเปลี่ยนแปลงตามการรายงานล่าสุดของแต่ละเครื่อง</div>
      </footer>
    </>
  );
}

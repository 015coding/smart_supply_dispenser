import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DispenserDetail } from "@/components/DispenserDetail";
import { PublicHeader } from "@/components/PublicHeader";
import { store } from "@/lib/server/store";

export const dynamic = "force-dynamic";

interface DispenserPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: DispenserPageProps): Promise<Metadata> {
  const { code } = await params;
  const dispenser = await store.getPublic(code);
  if (!dispenser) return { title: "ไม่พบเครื่องแจกสิ่งของ · พร้อมปัน" };
  return {
    title: `${dispenser.name || dispenser.code} · พร้อมปัน`,
    description: `ดูสถานะและจำนวนชุดสิ่งของของ ${dispenser.name || dispenser.code}`
  };
}

export default async function DispenserPage({ params }: DispenserPageProps) {
  const { code } = await params;
  const dispenser = await store.getPublic(code);
  if (!dispenser) notFound();

  return (
    <>
      <PublicHeader />
      <DispenserDetail dispenser={dispenser} />
      <footer className="footer">
        <div className="app-container">พร้อมปัน · ข้อมูลสถานะอาจเปลี่ยนแปลงตามการรายงานล่าสุดของแต่ละเครื่อง</div>
      </footer>
    </>
  );
}

import Link from "next/link";
import { Box } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="narrow-container" style={{ padding: "100px 0 140px" }}>
        <div className="empty-state">
          <Box size={42} strokeWidth={1.2} style={{ color: "var(--teal)", marginBottom: 10 }} />
          <strong>ไม่พบเครื่องแจกสิ่งของ</strong>
          <span>เครื่องอาจยังไม่เผยแพร่หรือรหัสไม่ถูกต้อง</span>
          <Link className="button button-primary" href="/" style={{ marginTop: 20 }}>กลับไปค้นหาเครื่อง</Link>
        </div>
      </main>
    </>
  );
}

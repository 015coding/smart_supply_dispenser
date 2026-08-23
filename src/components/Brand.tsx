import { Box } from "lucide-react";
import Link from "next/link";

export function Brand({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link className="brand" href={href} aria-label="ไปหน้าแรก พร้อมปัน">
      <span className="brand-mark"><Box size={19} strokeWidth={1.8} /></span>
      <span><strong>พร้อมปัน</strong>{!compact && <small>จุดแจกสิ่งของช่วยเหลือ</small>}</span>
    </Link>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "พร้อมปัน · จุดแจกสิ่งของช่วยเหลือ",
  description: "ค้นหาเครื่องแจกสิ่งของช่วยเหลือ ดูสถานะ จำนวนชุด และตำแหน่งบนแผนที่",
  applicationName: "พร้อมปัน"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}

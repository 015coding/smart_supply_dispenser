import Link from "next/link";
import { SwaggerViewer } from "./SwaggerViewer";

export const metadata = { title: "API Docs · พร้อมปัน" };

export default function ApiDocsPage() {
  return (
    <main className="docs-page">
      <div className="docs-header">
        <Link href="/">← กลับหน้าเว็บ</Link>
        <div>
          <p className="eyebrow">พร้อมปัน</p>
          <h1>REST API documentation</h1>
          <p>OpenAPI 3.1 สำหรับ Public, Admin และ Device API</p>
        </div>
      </div>
      <SwaggerViewer />
    </main>
  );
}

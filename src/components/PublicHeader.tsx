import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Brand } from "./Brand";

export function PublicHeader() {
  return <header className="site-header"><div className="app-container site-header-inner"><Brand /><Link className="header-link" href="/admin/login"><LockKeyhole size={15} /> สำหรับผู้ดูแล</Link></div></header>;
}

"use client";

import { Activity, Box, LayoutDashboard, LogOut, Menu, Settings2, Users, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";

const navItems = [
  { href: "/admin", label: "ภาพรวมระบบ", icon: LayoutDashboard },
  { href: "/admin/dispensers", label: "เครื่องแจกสิ่งของ", icon: Box },
  { href: "/admin/recipients", label: "ผู้มีสิทธิ์รับของ", icon: Users },
  { href: "/admin/activity", label: "ประวัติการทำรายการ", icon: Activity }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function logout() {
    await signOut({ redirect: false });
    router.replace("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [sidebarOpen]);

  return (
    <div className="admin-page">
      <div className="admin-shell">
        {sidebarOpen && <button className="admin-sidebar-backdrop" type="button" aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)} />}
        <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Brand href="/admin" />
            <button className="button button-quiet mobile-nav-toggle" type="button" onClick={() => setSidebarOpen(false)} aria-label="ปิดเมนู">
              <X size={18} />
            </button>
          </div>
          <nav className="admin-nav" aria-label="เมนูผู้ดูแล">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return <Link className={active ? "active" : undefined} href={href} key={href} onClick={() => setSidebarOpen(false)}><Icon size={17} />{label}</Link>;
            })}
            <Link href="/api-docs" onClick={() => setSidebarOpen(false)}><Settings2 size={17} />เอกสาร API</Link>
          </nav>
          <div className="admin-sidebar-footer">
            <div className="admin-user">ผู้ดูแลส่วนกลาง<br /><strong>Global Administrator</strong></div>
            <button className="button button-secondary" type="button" onClick={() => void logout()}><LogOut size={15} />ออกจากระบบ</button>
          </div>
        </aside>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 0" }}>
            <button className="button button-secondary mobile-nav-toggle" type="button" onClick={() => setSidebarOpen(true)} aria-label="เปิดเมนู"><Menu size={18} /></button>
            <Link className="button button-quiet mobile-nav-toggle" href="/"><Box size={16} />ดูหน้า Public</Link>
          </div>
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Info, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSafeAdminRedirectPath } from "@/lib/auth-redirect";
import { Brand } from "./Brand";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const redirectTo = getSafeAdminRedirectPath(searchParams.get("callbackUrl"), window.location.origin);
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      redirectTo
    });
    setLoading(false);
    if (!result || result.error) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    // Auth.js returns an absolute URL based on AUTH_URL/NEXTAUTH_URL. Keeping
    // navigation relative preserves the host-scoped session cookie when the
    // development server is reached through localhost, an IP, or a LAN name.
    router.replace(redirectTo);
    router.refresh();
  }

  return <main className="login-page"><section className="login-card">
    <Brand href="/" />
    <h1>เข้าสู่ระบบผู้ดูแล</h1>
    <p>จัดการเครื่องแจกสิ่งของ สต็อก รายชื่อผู้มีสิทธิ์ และรายงานการให้บริการ</p>
    <form className="login-form" onSubmit={submit}>
      <div className="input-wrap"><label htmlFor="admin-username">ชื่อผู้ใช้</label><input className="input" id="admin-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></div>
      <div className="input-wrap"><label htmlFor="admin-password">รหัสผ่าน</label><input className="input" id="admin-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
      {error && <p className="form-message" role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={loading}><LockKeyhole size={16} />{loading ? "กำลังตรวจสอบ…" : "เข้าสู่ Dashboard"}</button>
    </form>
    <div className="login-footer"><Info size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />บัญชีผู้ดูแลกำหนดจาก environment variables ของระบบ</div>
  </section></main>;
}

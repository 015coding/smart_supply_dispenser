import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminShell><AdminDashboard /></AdminShell>;
}

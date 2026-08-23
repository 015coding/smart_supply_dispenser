import { AdminActivity } from "@/components/AdminActivity";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminActivityPage() {
  return <AdminShell><AdminActivity /></AdminShell>;
}

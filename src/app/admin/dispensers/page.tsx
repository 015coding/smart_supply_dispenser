import { AdminDispenserList } from "@/components/AdminDispenserList";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminDispensersPage() {
  return <AdminShell><AdminDispenserList /></AdminShell>;
}

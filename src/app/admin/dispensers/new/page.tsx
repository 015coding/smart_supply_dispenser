import { AdminDispenserEditor } from "@/components/AdminDispenserEditor";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default function NewDispenserPage() {
  return <AdminShell><AdminDispenserEditor /></AdminShell>;
}

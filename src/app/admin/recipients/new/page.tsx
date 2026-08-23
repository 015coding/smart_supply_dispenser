import { AdminRecipientEditor } from "@/components/AdminRecipientEditor";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default function NewRecipientPage() {
  return <AdminShell><AdminRecipientEditor /></AdminShell>;
}

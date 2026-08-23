import { AdminRecipients } from "@/components/AdminRecipients";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminRecipientsPage() {
  return <AdminShell><AdminRecipients /></AdminShell>;
}

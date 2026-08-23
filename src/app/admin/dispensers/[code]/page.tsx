import { AdminDispenserEditor } from "@/components/AdminDispenserEditor";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function EditDispenserPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <AdminShell><AdminDispenserEditor code={code} /></AdminShell>;
}

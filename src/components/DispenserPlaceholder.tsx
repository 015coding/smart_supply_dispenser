import { Box } from "lucide-react";

export function DispenserPlaceholder({ className = "" }: { className?: string }) {
  return <div className={className} aria-label="ยังไม่มีรูปเครื่อง"><Box size={52} strokeWidth={1.2} /></div>;
}

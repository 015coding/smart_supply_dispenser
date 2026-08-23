const BANGKOK_TIME_ZONE = "Asia/Bangkok";

function dateParts(date: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BANGKOK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function serviceDayFor(date: Date = new Date()): string {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatServiceDay(date: Date = new Date()): string {
  return serviceDayFor(date);
}

export function formatThaiDateTime(value: string | Date | null): string {
  if (!value) return "ยังไม่มีข้อมูล";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: BANGKOK_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatThaiDate(value: string | Date | null): string {
  if (!value) return "ยังไม่มีข้อมูล";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: BANGKOK_TIME_ZONE,
    dateStyle: "medium"
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function isServiceDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function addServiceDays(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export { BANGKOK_TIME_ZONE };

import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/server/errors";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  field_errors?: Record<string, string>;
  trace_id: string;
}

export function traceId(): string {
  return randomUUID();
}

export function json<T>(data: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function noStore(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  result.set("Cache-Control", "no-store, max-age=0");
  return result;
}

export function problemResponse(error: unknown, requestTraceId = traceId()): Response {
  const appError = error instanceof AppError ? error : new AppError(500, "internal_error", "เกิดข้อผิดพลาดภายในระบบ");
  const body: ProblemDetails = {
    type: "about:blank",
    title: appError.status >= 500 ? "Internal Server Error" : "Request Error",
    status: appError.status,
    code: appError.code,
    detail: appError.message,
    ...(appError.fieldErrors ? { field_errors: appError.fieldErrors } : {}),
    trace_id: requestTraceId
  };
  return json(body, {
    status: appError.status,
    headers: noStore({ "Content-Type": "application/problem+json; charset=utf-8", "X-Trace-Id": requestTraceId })
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError(400, "invalid_json", "รูปแบบ JSON ไม่ถูกต้อง");
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) throw new AppError(403, "csrf_rejected", "คำขอจากต้นทางนี้ไม่ได้รับอนุญาต");
}

export function asApiError(error: unknown): Response {
  return problemResponse(error);
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    status: 200,
    headers: noStore({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    })
  });
}

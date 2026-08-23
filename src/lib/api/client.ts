export class ApiClientError extends Error {
  readonly status: number;
  readonly problem?: { code?: string; detail?: string; field_errors?: Record<string, string>; trace_id?: string };

  constructor(status: number, problem?: ApiClientError["problem"]) {
    super(problem?.detail ?? "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    this.name = "ApiClientError";
    this.status = status;
    this.problem = problem;
  }
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, headers: { Accept: "application/json", ...init?.headers } });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new ApiClientError(response.status, payload ?? undefined);
  return payload as T;
}

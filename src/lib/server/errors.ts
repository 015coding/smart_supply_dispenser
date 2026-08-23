export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, code: string, detail: string, fieldErrors?: Record<string, string>) {
    super(detail);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function notFound(detail = "ไม่พบข้อมูลที่ร้องขอ"): AppError {
  return new AppError(404, "not_found", detail);
}

export function conflict(detail: string, code = "conflict"): AppError {
  return new AppError(409, code, detail);
}

export function validationError(detail: string, fieldErrors?: Record<string, string>): AppError {
  return new AppError(422, "validation_error", detail, fieldErrors);
}

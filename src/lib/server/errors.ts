const APP_ERROR_MARKER = Symbol.for("smart-supply-dispenser.app-error");

export class AppError extends Error {
  readonly [APP_ERROR_MARKER] = true;
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

export function isAppError(error: unknown): error is AppError {
  return typeof error === "object"
    && error !== null
    && (error as Record<PropertyKey, unknown>)[APP_ERROR_MARKER] === true
    && typeof (error as { status?: unknown }).status === "number"
    && typeof (error as { code?: unknown }).code === "string"
    && typeof (error as { message?: unknown }).message === "string";
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

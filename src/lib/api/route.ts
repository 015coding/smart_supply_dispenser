import { z } from "zod";
import { AppError } from "@/lib/server/errors";
import { problemResponse } from "@/lib/api/response";

export function apiRoute<TArgs extends unknown[]>(handler: (...args: TArgs) => Promise<Response>): (...args: TArgs) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return problemResponse(error);
    }
  };
}

export function parseSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "request";
    fieldErrors[key] ??= issue.message;
  }
  throw new AppError(422, "validation_error", "ข้อมูลที่ส่งมาไม่ผ่านการตรวจสอบ", fieldErrors);
}

export function queryParams(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

export function routeParams(context: { params: Record<string, string> }): Record<string, string> {
  return context.params;
}

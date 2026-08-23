import { timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/server/errors";
import { store } from "@/lib/server/store";

const DEVICE_AUTH_ERROR = "อุปกรณ์ไม่ผ่านการยืนยันตัวตน";

function matchesSecret(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function requireDevice(request: Request): Promise<string> {
  const code = request.headers.get("x-device-code")?.trim().toUpperCase();
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expected = process.env.DEVICE_SHARED_SECRET ?? "";
  if (!code || !token || !expected || !matchesSecret(token, expected)) throw new AppError(401, "device_unauthorized", DEVICE_AUTH_ERROR);

  try {
    const dispenser = await store.getAdminDispenser(code);
    if (dispenser.lifecycle === "archived" || (dispenser.lifecycle === "draft" && !dispenser.deviceApiEnabledForTesting)) throw new Error("not eligible");
    await store.markDeviceSeen(code);
  } catch {
    throw new AppError(401, "device_unauthorized", DEVICE_AUTH_ERROR);
  }
  return code;
}

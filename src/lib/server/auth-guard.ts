import { getServerSession } from "next-auth";
import { AppError } from "@/lib/server/errors";
import { authOptions } from "@/lib/auth";

export async function requireAdmin(request?: Request): Promise<{ actor: string }> {
  if (process.env.NODE_ENV === "test" && request?.headers.get("x-test-admin") === "true") return { actor: "test-admin" };
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new AppError(401, "unauthorized", "กรุณาเข้าสู่ระบบผู้ดูแล");
  return { actor: session.user.name ?? "admin" };
}

import { put, del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { AppError } from "@/lib/server/errors";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const LOCAL_IMAGE_URL_PREFIX = "/api/v1/public/images/";

export function imageUploadDirectory(): string {
  return process.env.IMAGE_UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads");
}

export function isLocalImageFilename(filename: string): boolean {
  return /^[A-Z0-9-]+-[0-9a-f-]+\.webp$/.test(filename);
}

export async function uploadDispenserImage(code: string, file: File): Promise<string> {
  if (file.size === 0) throw new AppError(415, "empty_image", "ไฟล์รูปภาพว่างเปล่า");
  if (file.size > MAX_IMAGE_BYTES) throw new AppError(413, "image_too_large", "รูปภาพต้องมีขนาดไม่เกิน 10 MB");
  const source = Buffer.from(await file.arrayBuffer());
  let webp: Buffer;
  try {
    webp = await sharp(source).rotate().resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    throw new AppError(415, "invalid_image", "ไฟล์ที่เลือกไม่ใช่รูปภาพหรือไม่สามารถอ่านรูปภาพนี้ได้");
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const result = await put(`dispensers/${code}.webp`, webp, { access: "public", addRandomSuffix: true, token, contentType: "image/webp" });
    return result.url;
  }

  const filename = `${code.toUpperCase()}-${randomUUID()}.webp`;
  const directory = imageUploadDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ directory, filename), webp, { flag: "wx" });
  return `${LOCAL_IMAGE_URL_PREFIX}${filename}`;
}

export async function deleteDispenserImage(url: string | null): Promise<void> {
  if (!url) return;
  if (url.startsWith(LOCAL_IMAGE_URL_PREFIX)) {
    const filename = url.slice(LOCAL_IMAGE_URL_PREFIX.length);
    if (!isLocalImageFilename(filename)) return;
    await unlink(path.join(/* turbopackIgnore: true */ imageUploadDirectory(), filename)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    return;
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new AppError(503, "blob_not_configured", "ยังไม่ได้ตั้งค่า Vercel Blob");
  await del(url, { token });
}

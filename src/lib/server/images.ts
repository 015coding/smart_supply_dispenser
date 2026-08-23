import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { AppError } from "@/lib/server/errors";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasImageSignature(buffer: Buffer): boolean {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return isJpeg || isPng || isWebp;
}

export async function uploadDispenserImage(code: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) throw new AppError(415, "unsupported_image_type", "รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP");
  if (file.size > MAX_IMAGE_BYTES) throw new AppError(413, "image_too_large", "รูปภาพต้องมีขนาดไม่เกิน 5 MB");
  const source = Buffer.from(await file.arrayBuffer());
  if (!hasImageSignature(source)) throw new AppError(415, "invalid_image_signature", "ไฟล์ไม่ตรงกับชนิดรูปภาพที่แจ้งมา");
  let webp: Buffer;
  try {
    webp = await sharp(source).rotate().resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    throw new AppError(415, "invalid_image", "ไม่สามารถอ่านหรือประมวลผลรูปภาพนี้ได้");
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new AppError(503, "blob_not_configured", "ยังไม่ได้ตั้งค่า Vercel Blob");
  const result = await put(`dispensers/${code}.webp`, webp, { access: "public", addRandomSuffix: true, token, contentType: "image/webp" });
  return result.url;
}

export async function deleteDispenserImage(url: string | null): Promise<void> {
  if (!url) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new AppError(503, "blob_not_configured", "ยังไม่ได้ตั้งค่า Vercel Blob");
  await del(url, { token });
}

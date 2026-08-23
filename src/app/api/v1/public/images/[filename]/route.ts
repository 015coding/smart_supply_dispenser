import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageUploadDirectory, isLocalImageFilename } from "@/lib/server/images";

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!isLocalImageFilename(filename)) return new Response("Not found", { status: 404 });

  try {
    const image = await readFile(path.join(/* turbopackIgnore: true */ imageUploadDirectory(), filename));
    return new Response(image, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(image.byteLength),
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response("Not found", { status: 404 });
    throw error;
  }
}

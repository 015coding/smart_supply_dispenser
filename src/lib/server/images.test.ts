import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { deleteDispenserImage, LOCAL_IMAGE_URL_PREFIX, MAX_IMAGE_BYTES, uploadDispenserImage } from "./images";

describe("dispenser image storage", () => {
  let uploadDirectory = "";
  const originalUploadDirectory = process.env.IMAGE_UPLOAD_DIR;
  const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

  beforeEach(async () => {
    uploadDirectory = await mkdtemp(path.join(os.tmpdir(), "dispenser-images-"));
    process.env.IMAGE_UPLOAD_DIR = uploadDirectory;
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  afterEach(async () => {
    await rm(uploadDirectory, { recursive: true, force: true });
    if (originalUploadDirectory === undefined) delete process.env.IMAGE_UPLOAD_DIR;
    else process.env.IMAGE_UPLOAD_DIR = originalUploadDirectory;
    if (originalBlobToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
  });

  it("stores a valid image locally as webp and deletes it", async () => {
    const source = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#1d7774" } }).png().toBuffer();
    const url = await uploadDispenserImage("DSP-0001", new File([source], "machine.png", { type: "image/png" }));
    expect(url.startsWith(LOCAL_IMAGE_URL_PREFIX)).toBe(true);

    const stored = await readFile(path.join(uploadDirectory, url.slice(LOCAL_IMAGE_URL_PREFIX.length)));
    await expect(sharp(stored).metadata()).resolves.toMatchObject({ format: "webp" });

    await deleteDispenserImage(url);
    await expect(readFile(path.join(uploadDirectory, url.slice(LOCAL_IMAGE_URL_PREFIX.length)))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects content that is not an image", async () => {
    await expect(uploadDispenserImage("DSP-0001", new File(["not an image"], "fake.jpg", { type: "image/jpeg" }))).rejects.toMatchObject({ code: "invalid_image" });
  });

  it("rejects files larger than 10 MB", async () => {
    const oversized = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", { type: "image/png" });
    await expect(uploadDispenserImage("DSP-0001", oversized)).rejects.toMatchObject({ code: "image_too_large", status: 413 });
  });
});

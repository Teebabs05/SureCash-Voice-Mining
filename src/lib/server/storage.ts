import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Local-disk file storage for the MVP. Swap for S3/R2/Supabase Storage by
 * replacing this function — callers only depend on the returned public URL.
 */
export async function saveUploadedFile(params: {
  folder: "receipts" | "voice" | "task-proofs" | "avatars";
  buffer: Buffer;
  extension: string;
}) {
  const dir = path.join(UPLOAD_ROOT, params.folder);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${params.extension.replace(/^\./, "")}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, params.buffer);

  return `/uploads/${params.folder}/${filename}`;
}

import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);
const MAX_BYTES = 5 * 1024 * 1024;

export class UploadError extends Error {}

async function check(file: File, allowPdf: boolean) {
  const ext = ALLOWED.get(file.type);
  if (!ext || (!allowPdf && ext === "pdf")) throw new UploadError("type");
  if (file.size > MAX_BYTES) throw new UploadError("size");
  // Check the real file content, not just the declared type
  const h = Buffer.from(await file.slice(0, 12).arrayBuffer());
  const ok =
    (ext === "jpg" && h[0] === 0xff && h[1] === 0xd8) ||
    (ext === "png" && h.subarray(0, 4).toString("hex") === "89504e47") ||
    (ext === "webp" && h.subarray(0, 4).toString() === "RIFF" && h.subarray(8, 12).toString() === "WEBP") ||
    (ext === "pdf" && h.subarray(0, 4).toString() === "%PDF");
  if (!ok) throw new UploadError("type");
  return ext;
}

async function supabaseUpload(bucket: string, key: string, file: File) {
  const url = `${process.env.SUPABASE_URL}/storage/v1/object/${bucket}/${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": file.type },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new UploadError("upload");
}

const useSupabase = () => process.env.STORAGE_PROVIDER === "supabase";

/** Public photo (listing photos). Returns a URL. */
export async function savePublicImage(file: File): Promise<string> {
  const ext = await check(file, false);
  const key = `${crypto.randomUUID()}.${ext}`;
  if (useSupabase()) {
    await supabaseUpload("photos", key, file);
    return `${process.env.SUPABASE_URL}/storage/v1/object/public/photos/${key}`;
  }
  const dir = path.join(process.cwd(), "uploads", "public");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, key), Buffer.from(await file.arrayBuffer()));
  return `/media/${key}`;
}

/** Private document (licence, ID). Returns a storage key; only the owner and admins can read it via /api/files. */
export async function savePrivateDoc(file: File): Promise<string> {
  const ext = await check(file, true);
  const key = `${crypto.randomUUID()}.${ext}`;
  if (useSupabase()) {
    await supabaseUpload("documents", key, file);
    return key;
  }
  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, key), Buffer.from(await file.arrayBuffer()));
  return key;
}

export async function readPrivateDoc(key: string): Promise<{ data: Buffer; type: string } | null> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/.test(key)) return null;
  const ext = key.split(".").pop()!;
  const type = [...ALLOWED.entries()].find(([, e]) => e === ext)![0];
  if (useSupabase()) {
    const res = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/documents/${key}`, {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!res.ok) return null;
    return { data: Buffer.from(await res.arrayBuffer()), type };
  }
  try {
    return { data: await readFile(path.join(process.cwd(), "uploads", key)), type };
  } catch {
    return null;
  }
}

/** Local mode only: reads a public photo saved by savePublicImage. */
export async function readLocalPublicImage(key: string): Promise<{ data: Buffer; type: string } | null> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) return null;
  const ext = key.split(".").pop()!;
  const type = [...ALLOWED.entries()].find(([, e]) => e === ext)![0];
  try {
    return { data: await readFile(path.join(process.cwd(), "uploads", "public", key)), type };
  } catch {
    return null;
  }
}

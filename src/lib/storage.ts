import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);
const MAX_BYTES = 5 * 1024 * 1024;
/** Photos are re-encoded, so bigger originals are fine (phones take 5-12 MB pictures). */
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export const PHOTO_MAX_WIDTH = 1600;
export const THUMB_WIDTH = 640;

export class UploadError extends Error {}

async function check(file: File, allowPdf: boolean) {
  const ext = ALLOWED.get(file.type);
  if (!ext || (!allowPdf && ext === "pdf")) throw new UploadError("type");
  if (file.size > (allowPdf ? MAX_BYTES : MAX_PHOTO_BYTES)) throw new UploadError("size");
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

/** Works with both the new "sb_secret_…" keys and the legacy service_role JWT. */
function supabaseHeaders(): Record<string, string> {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

async function supabaseUpload(bucket: string, key: string, body: Buffer, type: string, upsert = false) {
  const url = `${(process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "")}/storage/v1/object/${bucket}/${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      "Content-Type": type,
      // Photos never change once stored (new photo = new name): let browsers and the CDN keep them for a year
      ...(bucket === "photos" ? { "cache-control": "max-age=31536000" } : {}),
      ...(upsert ? { "x-upsert": "true" } : {}),
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error(`[storage] Supabase refused upload to ${bucket} (${res.status}): ${detail}`);
    throw new UploadError("upload");
  }
}

const useSupabase = () => {
  const on = process.env.STORAGE_PROVIDER?.trim() === "supabase";
  if (!on && process.env.VERCEL) console.error(`[storage] STORAGE_PROVIDER is "${process.env.STORAGE_PROVIDER ?? ""}" — must be "supabase" online (Vercel cannot keep files)`);
  if (on && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) console.error("[storage] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
  return on;
};

/** Re-encodes a photo: right way up, at most 1600 px wide, WebP (≈10× lighter than a phone photo), plus a 640 px thumbnail. */
export async function compressPhoto(input: Buffer): Promise<{ full: Buffer; thumb: Buffer }> {
  const base = sharp(input, { failOn: "none" }).rotate();
  const full = await base.clone().resize({ width: PHOTO_MAX_WIDTH, height: PHOTO_MAX_WIDTH, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  const thumb = await base.clone().resize({ width: THUMB_WIDTH, height: THUMB_WIDTH, fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
  return { full, thumb };
}

/** Stores an already-read image (compressed + thumbnail). Returns the public URL of the full-size photo. */
export async function storePublicImage(input: Buffer): Promise<string> {
  let out: { full: Buffer; thumb: Buffer };
  try {
    out = await compressPhoto(input);
  } catch {
    throw new UploadError("type");
  }
  const id = crypto.randomUUID();
  if (useSupabase()) {
    await supabaseUpload("photos", `${id}-sm.webp`, out.thumb, "image/webp");
    await supabaseUpload("photos", `${id}.webp`, out.full, "image/webp");
    return `${(process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "")}/storage/v1/object/public/photos/${id}.webp`;
  }
  const dir = path.join(process.cwd(), "uploads", "public");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${id}-sm.webp`), out.thumb);
  await writeFile(path.join(dir, `${id}.webp`), out.full);
  return `/media/${id}.webp`;
}

/** Public photo (listing photos). Returns a URL. */
export async function savePublicImage(file: File): Promise<string> {
  await check(file, false);
  return storePublicImage(Buffer.from(await file.arrayBuffer()));
}

/** Downloads an existing (old, uncompressed) photo and stores a compressed copy. Returns the new URL. */
export async function recompressPublicImage(url: string): Promise<string> {
  const abs = url.startsWith("/media/") ? null : url;
  let data: Buffer | null = null;
  if (abs) {
    const res = await fetch(abs);
    if (!res.ok) throw new UploadError("upload");
    data = Buffer.from(await res.arrayBuffer());
  } else {
    data = (await readLocalPublicImage(url.slice("/media/".length)))?.data ?? null;
  }
  if (!data) throw new UploadError("upload");
  return storePublicImage(data);
}

/** Private document (licence, ID). Returns a storage key; only the owner and admins can read it via /api/files. */
export async function savePrivateDoc(file: File): Promise<string> {
  const ext = await check(file, true);
  const key = `${crypto.randomUUID()}.${ext}`;
  if (useSupabase()) {
    await supabaseUpload("documents", key, Buffer.from(await file.arrayBuffer()), file.type);
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
      headers: supabaseHeaders(),
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
  if (!/^[0-9a-f-]{36}(-sm)?\.(jpg|png|webp)$/.test(key)) return null;
  const ext = key.split(".").pop()!;
  const type = [...ALLOWED.entries()].find(([, e]) => e === ext)![0];
  try {
    return { data: await readFile(path.join(process.cwd(), "uploads", "public", key)), type };
  } catch {
    return null;
  }
}

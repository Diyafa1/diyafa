import { NextResponse } from "next/server";
import { readLocalPublicImage } from "@/lib/storage";

/** Serves listing photos stored on this machine (local mode). Online, photos come from Supabase Storage. */
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const f = await readLocalPublicImage((await params).key);
  if (!f) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(f.data), { headers: { "Content-Type": f.type, "Cache-Control": "public, max-age=31536000, immutable" } });
}

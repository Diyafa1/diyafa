import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readPrivateDoc } from "@/lib/storage";

/** Private documents (licences, IDs): only the owner and admins. */
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const user = await getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (user.role !== "ADMIN") {
    const own = await db.hostProfile.findFirst({ where: { userId: user.id, OR: [{ licenseDocPath: key }, { idDocPath: key }] } });
    if (!own) return new NextResponse("Forbidden", { status: 403 });
  }
  const f = await readPrivateDoc(key);
  if (!f) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(f.data), {
    headers: { "Content-Type": f.type, "Cache-Control": "private, no-store", "Content-Disposition": "inline" },
  });
}

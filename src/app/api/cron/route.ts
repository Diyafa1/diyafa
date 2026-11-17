import { NextResponse } from "next/server";
import { completeFinishedStays, expireStaleHolds } from "@/lib/bookings";

/** Daily maintenance (Vercel Cron). Protected by CRON_SECRET. */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse("Unauthorized", { status: 401 });
  await expireStaleHolds();
  await completeFinishedStays();
  return NextResponse.json({ ok: true });
}

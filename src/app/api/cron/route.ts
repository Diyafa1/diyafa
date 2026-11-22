import { NextResponse } from "next/server";
import { runAutomations } from "@/lib/automations";

/** Daily maintenance (Vercel Cron). Protected by CRON_SECRET. */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({ ok: true, ...(await runAutomations()) });
}

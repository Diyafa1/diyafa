import { NextResponse } from "next/server";
import { runAutomations, sendDailyReport } from "@/lib/automations";

/** Daily maintenance (Vercel Cron). Protected by CRON_SECRET. */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse("Unauthorized", { status: 401 });
  const auto = await runAutomations();
  const reports = await sendDailyReport();
  return NextResponse.json({ ok: true, ...auto, reports });
}

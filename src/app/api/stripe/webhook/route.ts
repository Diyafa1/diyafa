import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { BookingError, markPaymentFailed, markPaymentPaid } from "@/lib/bookings";

/**
 * Stripe → Diyafa notification (webhook). Confirms bookings even if the traveller closes the page
 * right after paying. Set it up in Stripe: Developers → Webhooks → endpoint
 * https://<site>/api/stripe/webhook, events checkout.session.completed and checkout.session.expired,
 * then put the signing secret (whsec_…) in Vercel as STRIPE_WEBHOOK_SECRET.
 */
function verify(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts.t;
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 600) return false; // older than 10 minutes
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export async function POST(req: Request) {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return new NextResponse("webhook not configured", { status: 503 });
  const payload = await req.text();
  if (!verify(payload, req.headers.get("stripe-signature"), secret)) return new NextResponse("bad signature", { status: 400 });

  const event = JSON.parse(payload) as { type: string; data: { object: { id: string; payment_status?: string; amount_total?: number; client_reference_id?: string } } };
  const session = event.data.object;
  const payment = await db.payment.findFirst({ where: { OR: [{ providerRef: session.id }, { id: session.client_reference_id ?? "" }] } });
  if (!payment) return NextResponse.json({ ignored: true });

  try {
    if (event.type === "checkout.session.completed" && session.payment_status === "paid" && session.amount_total === payment.amount) {
      await markPaymentPaid(payment.id); // idempotent: safe if the traveller also came back to the site
    } else if (event.type === "checkout.session.expired") {
      await markPaymentFailed(payment.id);
    }
  } catch (e) {
    if (!(e instanceof BookingError)) throw e;
  }
  return NextResponse.json({ received: true });
}

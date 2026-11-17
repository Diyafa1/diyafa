import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { BookingError, markPaymentFailed, markPaymentPaid } from "@/lib/bookings";

/** Return URL for the real gateway (Moyasar). The payment is verified server-to-server, never trusted from the URL. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pid = url.searchParams.get("pid") ?? "";
  const p = await db.payment.findUnique({ where: { id: pid } });
  if (!p || !p.providerRef) return NextResponse.redirect(new URL("/trips", req.url));
  const v = await getPaymentProvider().verifyPayment(p.providerRef);
  let result = "success";
  if (v.paid && v.amount === p.amount) {
    try {
      await markPaymentPaid(p.id);
    } catch (e) {
      result = e instanceof BookingError ? e.code : "failed";
    }
  } else {
    await markPaymentFailed(p.id);
    result = "failed";
  }
  return NextResponse.redirect(new URL(`/trips/${p.bookingId}?pay=${result}`, req.url));
}

import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { BookingError, prepareBooking, takenNights } from "@/lib/bookings";
import { parseBookingInput } from "@/lib/booking-input";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let input;
  try {
    input = parseBookingInput(body);
  } catch {
    return NextResponse.json({ error: "dates" }, { status: 400 });
  }
  const user = await getUser();

  // Bed availability for shared apartments
  let takenBeds: string[] = [];
  if (input.checkOut && input.checkOut > input.checkIn) {
    const beds = await db.bed.findMany({ where: { room: { listingId: input.listingId } }, select: { id: true } });
    for (const b of beds) {
      const taken = await takenNights(b.id, input.checkIn, input.checkOut);
      if (taken.size) takenBeds.push(b.id);
    }
  }
  if (input.bedId && takenBeds.includes(input.bedId)) return NextResponse.json({ error: "not_available", takenBeds });

  try {
    const p = await prepareBooking(input, user ? { id: user.id, gender: user.gender } : { id: "", gender: null });
    if (p.listing.type !== "SHARED_BED") {
      const taken = await takenNights(p.unitKey, p.checkIn, p.checkOut);
      if (taken.size) return NextResponse.json({ error: "not_available", takenBeds });
    }
    return NextResponse.json({ quote: p.quote, nights: p.nights, months: p.months, vatPercent: p.rates.vatPercent, checkOut: p.checkOut.toISOString().slice(0, 10), takenBeds });
  } catch (e) {
    if (e instanceof BookingError) {
      // For anonymous visitors, gender checks only apply once logged in
      if (!user && (e.code === "gender_missing")) return NextResponse.json({ error: null, takenBeds });
      return NextResponse.json({ error: e.code, takenBeds });
    }
    throw e;
  }
}

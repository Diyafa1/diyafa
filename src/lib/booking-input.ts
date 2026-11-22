import { parseDay } from "./dates";
import type { BookingInput } from "./bookings";

/** Parses booking fields coming from a form or JSON body. Throws "dates" on bad input. */
export function parseBookingInput(o: Record<string, unknown>): BookingInput {
  const s = (k: string) => (o[k] === undefined || o[k] === null ? "" : String(o[k]).trim());
  let checkIn: Date, checkOut: Date | undefined;
  try {
    checkIn = parseDay(s("checkIn"));
    checkOut = s("checkOut") ? parseDay(s("checkOut")) : undefined;
  } catch {
    throw new Error("dates");
  }
  const months = s("months") ? Number(s("months")) : undefined;
  return {
    listingId: s("listingId"),
    bedId: s("bedId") || null,
    checkIn,
    checkOut,
    months,
    guests: Number(s("guests") || "1"),
    promoCode: s("promoCode") || null,
  };
}

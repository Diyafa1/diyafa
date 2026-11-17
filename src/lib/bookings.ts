import "server-only";
import { Prisma, type Booking, type Listing, type User } from "@prisma/client";
import crypto from "node:crypto";
import { db } from "./db";
import { addDays, addMonths, dayKey, eachNight, nightsBetween, todayUTC } from "./dates";
import { computeQuote, nightlySubtotal, type Quote } from "./pricing";
import { getRates } from "./settings";
import { computeCancellation } from "./cancellation";
import { getPaymentProvider } from "./payments";
import { sendEmail } from "./email";
import { moneyText } from "./money";

export const ACTIVE_STATUSES = ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED", "COMPLETED"] as const;
export const HOLD_MINUTES = 30; // Stripe Checkout sessions last at least 30 minutes

export class BookingError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export type BookingInput = {
  listingId: string;
  bedId?: string | null;
  checkIn: Date;
  checkOut?: Date; // nightly stays
  months?: number; // long-term
  guests: number;
};

export type PreparedBooking = {
  listing: Listing;
  bedId: string | null;
  unitKey: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  months: number | null;
  guests: number;
  quote: Quote;
  rates: { hostPercent: number; guestFeePercent: number; vatPercent: number };
};

/** Releases holds whose payment window has passed so the dates become free again. */
export async function expireStaleHolds(tx: Prisma.TransactionClient | typeof db = db) {
  await tx.booking.updateMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

/** Marks finished stays as completed (called lazily and by the daily cron). */
export async function completeFinishedStays() {
  await db.booking.updateMany({ where: { status: "CONFIRMED", checkOut: { lte: todayUTC() } }, data: { status: "COMPLETED" } });
}

/** Validates the request and computes the price. Does NOT reserve anything. */
export async function prepareBooking(input: BookingInput, user: Pick<User, "id" | "gender"> | null, now = new Date()): Promise<PreparedBooking> {
  const listing = await db.listing.findUnique({
    where: { id: input.listingId },
    include: { host: { include: { hostProfile: true } }, rooms: { include: { beds: true } } },
  });
  if (!listing || listing.status !== "APPROVED" || listing.host.status !== "ACTIVE" || listing.host.hostProfile?.status !== "APPROVED")
    throw new BookingError("unavailable");
  if (user && listing.hostId === user.id) throw new BookingError("own_listing");

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (input.checkIn < today) throw new BookingError("past_date");
  if (!Number.isInteger(input.guests) || input.guests < 1) throw new BookingError("guests");

  let checkOut: Date;
  let months: number | null = null;
  let subtotal: number;
  let bedId: string | null = null;
  let guests = input.guests;

  if (listing.type === "LONG_TERM") {
    months = input.months ?? 0;
    if (!Number.isInteger(months) || months < Math.max(1, listing.minMonths) || months > 24) throw new BookingError("months");
    if (!listing.pricePerMonth) throw new BookingError("unavailable");
    checkOut = addMonths(input.checkIn, months);
    subtotal = listing.pricePerMonth * months;
    if (guests > listing.maxGuests) throw new BookingError("guests");
  } else {
    if (!input.checkOut) throw new BookingError("dates");
    checkOut = input.checkOut;
    const n = nightsBetween(input.checkIn, checkOut);
    if (n < 1) throw new BookingError("dates");
    if (n < listing.minNights) throw new BookingError("min_nights");
    if (n > 90) throw new BookingError("dates");
    const nights = eachNight(input.checkIn, checkOut);
    const days = await db.calendarDay.findMany({ where: { listingId: listing.id, date: { gte: input.checkIn, lt: checkOut } } });

    if (listing.type === "SHARED_BED") {
      const bed = listing.rooms.flatMap((r) => r.beds.map((b) => ({ ...b, gender: r.gender }))).find((b) => b.id === input.bedId);
      if (!bed || !bed.active) throw new BookingError("bed");
      if (user && user.gender && user.gender !== bed.gender) throw new BookingError("gender");
      if (user && !user.gender) throw new BookingError("gender_missing");
      bedId = bed.id;
      guests = 1;
      // blocked days apply to the whole apartment; beds keep their own price
      if (days.some((d) => d.blocked)) throw new BookingError("blocked");
      subtotal = bed.pricePerNight * nights.length;
    } else {
      if (guests > listing.maxGuests) throw new BookingError("guests");
      if (!listing.pricePerNight) throw new BookingError("unavailable");
      if (days.some((d) => d.blocked)) throw new BookingError("blocked");
      subtotal = nightlySubtotal(nights, listing.pricePerNight, new Map(days.map((d) => [dayKey(d.date), d.price])));
    }
  }
  if (listing.type === "LONG_TERM") {
    const blocked = await db.calendarDay.count({ where: { listingId: listing.id, blocked: true, date: { gte: input.checkIn, lt: checkOut } } });
    if (blocked) throw new BookingError("blocked");
  }

  const rates = await getRates(listing.type);
  return {
    listing,
    bedId,
    unitKey: bedId ?? listing.id,
    checkIn: input.checkIn,
    checkOut,
    nights: nightsBetween(input.checkIn, checkOut),
    months,
    guests,
    quote: computeQuote(subtotal, rates),
    rates,
  };
}

function isOverlapError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("booking_no_overlap") || msg.includes("23P01");
}

const newCode = () => "DY-" + crypto.randomBytes(4).toString("hex").toUpperCase();

/** Creates a payment hold. The database constraint guarantees no two active bookings overlap on the same unit. */
export async function createBooking(user: User, input: BookingInput) {
  const p = await prepareBooking(input, user);
  let booking: Booking;
  try {
    booking = await db.$transaction(async (tx) => {
      await expireStaleHolds(tx);
      return tx.booking.create({
        data: {
          code: newCode(),
          guestId: user.id,
          listingId: p.listing.id,
          bedId: p.bedId,
          unitKey: p.unitKey,
          checkIn: p.checkIn,
          checkOut: p.checkOut,
          nights: p.nights,
          months: p.months,
          guests: p.guests,
          status: "PENDING_PAYMENT",
          subtotal: p.quote.subtotal,
          serviceFee: p.quote.serviceFee,
          vat: p.quote.vat,
          total: p.quote.total,
          hostCommission: p.quote.hostCommission,
          hostPayout: p.quote.hostPayout,
          hostPercent: p.rates.hostPercent,
          guestFeePercent: p.rates.guestFeePercent,
          vatPercent: p.rates.vatPercent,
          cancellationPolicy: p.listing.cancellationPolicy,
          expiresAt: new Date(Date.now() + HOLD_MINUTES * 60000),
        },
      });
    });
  } catch (e) {
    if (isOverlapError(e)) throw new BookingError("not_available");
    throw e;
  }

  const provider = getPaymentProvider();
  const payment = await db.payment.create({ data: { bookingId: booking.id, provider: provider.name, amount: booking.total } });
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const r = await provider.createPayment({
    paymentId: payment.id,
    amount: booking.total,
    description: `Diyafa ${booking.code}`,
    callbackUrl: `${appUrl}/pay/callback?pid=${payment.id}`,
  });
  await db.payment.update({ where: { id: payment.id }, data: { providerRef: r.providerRef } });
  return { booking, redirectUrl: r.redirectUrl };
}

/** Called once the gateway confirms the payment. Idempotent. */
export async function markPaymentPaid(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { booking: { include: { listing: { include: { host: true } }, guest: true } } } });
  if (!payment) throw new BookingError("payment");
  if (payment.status === "PAID") return payment.booking;
  const b = payment.booking;
  if (b.status !== "PENDING_PAYMENT") {
    // Hold expired before payment: if dates are still free, revive it; else refund.
    if (b.status === "EXPIRED") {
      try {
        await db.booking.update({ where: { id: b.id }, data: { status: "PENDING_PAYMENT" } });
      } catch (e) {
        if (isOverlapError(e)) {
          await db.payment.update({ where: { id: payment.id }, data: { status: "PAID" } });
          await refundBooking(b.id, b.total);
          throw new BookingError("not_available");
        }
        throw e;
      }
    } else throw new BookingError("payment");
  }
  const status = b.listing.instantBook ? "CONFIRMED" : "REQUESTED";
  await db.$transaction([
    db.payment.update({ where: { id: payment.id }, data: { status: "PAID" } }),
    db.booking.update({ where: { id: b.id }, data: { status, expiresAt: null } }),
  ]);
  await sendEmail(
    b.guest.email,
    status === "CONFIRMED" ? `Diyafa — réservation confirmée ${b.code}` : `Diyafa — demande envoyée ${b.code}`,
    `${b.listing.title}\n${dayKey(b.checkIn)} → ${dayKey(b.checkOut)}`,
  );
  await sendEmail(
    b.listing.host.email,
    status === "CONFIRMED" ? `Diyafa — nouvelle réservation ${b.code}` : `Diyafa — nouvelle demande à accepter ${b.code}`,
    `${b.listing.title}\n${dayKey(b.checkIn)} → ${dayKey(b.checkOut)}`,
  );
  return { ...b, status };
}

export async function markPaymentFailed(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "INITIATED") return;
  await db.$transaction([
    db.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } }),
    db.booking.updateMany({ where: { id: payment.bookingId, status: "PENDING_PAYMENT" }, data: { status: "EXPIRED" } }),
  ]);
}

async function refundBooking(bookingId: string, amount: number) {
  if (amount <= 0) return;
  const charge = await db.payment.findFirst({ where: { bookingId, kind: "CHARGE", status: "PAID" } });
  if (!charge) return;
  const provider = getPaymentProvider();
  const r = await provider.refund(charge.providerRef ?? "", amount);
  await db.payment.create({
    data: { bookingId, kind: "REFUND", provider: provider.name, providerRef: charge.providerRef, amount, status: r.ok ? "REFUNDED" : "FAILED" },
  });
  if (!r.ok) throw new BookingError("refund_failed");
}

/** Host accepts or declines a request. */
export async function respondToRequest(bookingId: string, hostId: string, accept: boolean) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { listing: true, guest: true } });
  if (!b || b.listing.hostId !== hostId) throw new BookingError("not_found");
  if (b.status !== "REQUESTED") throw new BookingError("state");
  if (accept) {
    await db.booking.update({ where: { id: b.id }, data: { status: "CONFIRMED" } });
    await sendEmail(b.guest.email, `Diyafa — réservation acceptée ${b.code}`, b.listing.title);
  } else {
    await refundBooking(b.id, b.total);
    await db.booking.update({
      where: { id: b.id },
      data: { status: "DECLINED", refundedAmount: b.total, hostPayout: 0, hostCommission: 0 },
    });
    await sendEmail(b.guest.email, `Diyafa — demande refusée ${b.code}`, `${b.listing.title}\nVous êtes remboursé intégralement.`);
  }
}

/** Cancels a booking. Refund follows the listing policy for guests; full refund when the host or admin cancels. */
export async function cancelBooking(bookingId: string, actor: User, reason: string, adminShare?: number) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { listing: { include: { host: true } }, guest: true } });
  if (!b) throw new BookingError("not_found");
  const by = actor.role === "ADMIN" ? "admin" : b.guestId === actor.id ? "guest" : b.listing.hostId === actor.id ? "host" : null;
  if (!by) throw new BookingError("not_found");
  if (!["REQUESTED", "CONFIRMED"].includes(b.status)) throw new BookingError("state");
  if (b.payoutId) throw new BookingError("paid_out");
  if (by !== "admin" && b.checkIn <= todayUTC()) throw new BookingError("started");

  const out = computeCancellation(b, by, new Date(), adminShare);
  await refundBooking(b.id, out.refundAmount);
  await db.booking.update({
    where: { id: b.id },
    data: {
      status: "CANCELLED",
      refundedAmount: out.refundAmount,
      hostPayout: out.newHostPayout,
      hostCommission: out.newHostCommission,
      cancelledBy: by,
      cancelReason: reason.slice(0, 500),
    },
  });
  const msg = `${b.listing.title}\n${dayKey(b.checkIn)} → ${dayKey(b.checkOut)}\nRemboursement : ${moneyText(out.refundAmount)}`;
  await sendEmail(b.guest.email, `Diyafa — réservation annulée ${b.code}`, msg);
  await sendEmail(b.listing.host.email, `Diyafa — réservation annulée ${b.code}`, msg);
  return out;
}

/** Dates already taken for a unit (to grey them out in the calendar). */
export async function takenNights(unitKey: string, from: Date, to: Date): Promise<Set<string>> {
  await expireStaleHolds();
  const rows = await db.booking.findMany({
    where: { unitKey, status: { in: [...ACTIVE_STATUSES] }, checkIn: { lt: to }, checkOut: { gt: from } },
    select: { checkIn: true, checkOut: true },
  });
  const s = new Set<string>();
  for (const r of rows) for (let d = r.checkIn; d < r.checkOut; d = addDays(d, 1)) s.add(dayKey(d));
  return s;
}

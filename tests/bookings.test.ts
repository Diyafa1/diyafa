import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { BookingError, cancelBooking, createBooking, markPaymentPaid, respondToRequest } from "@/lib/bookings";
import { createPayout, owedByHost } from "@/lib/payouts";
import { searchListings } from "@/lib/listings";
import { addDays, todayUTC } from "@/lib/dates";

let host: User, guest: User, guest2: User, woman: User, admin: User;
let flatId: string, bedsId: string, bedsWomenId: string, maleBed: string, maleBed2: string, femaleBed: string;
const d = (n: number) => addDays(todayUTC(), n);

async function code(p: Promise<unknown>) {
  try {
    await p;
    return "ok";
  } catch (e) {
    if (e instanceof BookingError) return e.code;
    throw e;
  }
}

beforeAll(async () => {
  await db.commissionSetting.createMany({ data: [
    { listingType: "SHORT_STAY", hostPercent: 10, guestFeePercent: 5, vatPercent: 15 },
    { listingType: "SHARED_BED", hostPercent: 10, guestFeePercent: 5, vatPercent: 15 },
    { listingType: "LONG_TERM", hostPercent: 5, guestFeePercent: 2, vatPercent: 15 },
  ] });
  const mk = (email: string, extra = {}) => db.user.create({ data: { email, name: email, passwordHash: "x", ...extra } });
  host = await mk("h@t", { role: "HOST", hostProfile: { create: { displayName: "H", whatsapp: "1", licenseNumber: "L", idNumber: "I", status: "APPROVED" } } });
  guest = await mk("g@t", { gender: "MALE" });
  guest2 = await mk("g2@t", { gender: "MALE" });
  woman = await mk("w@t", { gender: "FEMALE" });
  admin = await mk("a@t", { role: "ADMIN" });
  const common = { hostId: host.id, city: "MAKKAH" as const, title: "T", description: "D", address: "A", distanceToHaramM: 500, licenseNumber: "L", status: "APPROVED" as const };
  flatId = (await db.listing.create({ data: { ...common, type: "SHORT_STAY", pricePerNight: 10000, maxGuests: 4, instantBook: true } })).id;
  const beds = await db.listing.create({
    data: { ...common, type: "SHARED_BED", instantBook: true, bedGender: "MALE", rooms: { create: [
      { name: "M", gender: "MALE", beds: { create: [{ label: "1", pricePerNight: 5000 }, { label: "2", pricePerNight: 5000 }] } },
    ] } },
    include: { rooms: { include: { beds: true } } },
  });
  bedsId = beds.id;
  [maleBed, maleBed2] = beds.rooms[0].beds.map((b) => b.id);
  const women = await db.listing.create({
    data: { ...common, type: "SHARED_BED", instantBook: true, bedGender: "FEMALE", rooms: { create: [{ name: "F", gender: "FEMALE", beds: { create: [{ label: "1", pricePerNight: 6000 }] } }] } },
    include: { rooms: { include: { beds: true } } },
  });
  bedsWomenId = women.id;
  femaleBed = women.rooms[0].beds[0].id;
});

beforeEach(async () => {
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.payout.deleteMany();
  await db.calendarDay.deleteMany();
});

describe("no double booking", () => {
  it("refuses overlapping dates on the same apartment", async () => {
    await createBooking(guest, { listingId: flatId, checkIn: d(10), checkOut: d(13), guests: 2 });
    expect(await code(createBooking(guest2, { listingId: flatId, checkIn: d(12), checkOut: d(14), guests: 1 }))).toBe("not_available");
    expect(await code(createBooking(guest2, { listingId: flatId, checkIn: d(9), checkOut: d(11), guests: 1 }))).toBe("not_available");
  });
  it("allows back-to-back stays (check-out day = next check-in day)", async () => {
    await createBooking(guest, { listingId: flatId, checkIn: d(10), checkOut: d(13), guests: 2 });
    expect(await code(createBooking(guest2, { listingId: flatId, checkIn: d(13), checkOut: d(15), guests: 1 }))).toBe("ok");
  });
  it("is safe when 10 people click at the same moment", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => code(createBooking(guest2, { listingId: flatId, checkIn: d(30), checkOut: d(32), guests: 1 }))),
    );
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
    expect(results.filter((r) => r === "not_available")).toHaveLength(9);
  });
  it("beds: one bed cannot be booked twice, but two beds in the same room can", async () => {
    await createBooking(guest, { listingId: bedsId, bedId: maleBed, checkIn: d(5), checkOut: d(8), guests: 1 });
    expect(await code(createBooking(guest2, { listingId: bedsId, bedId: maleBed, checkIn: d(6), checkOut: d(7), guests: 1 }))).toBe("not_available");
    expect(await code(createBooking(guest2, { listingId: bedsId, bedId: maleBed2, checkIn: d(6), checkOut: d(7), guests: 1 }))).toBe("ok");
  });
  it("beds: concurrent clicks on the same bed → only one wins", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () => code(createBooking(guest2, { listingId: bedsId, bedId: maleBed, checkIn: d(40), checkOut: d(41), guests: 1 }))),
    );
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
  });
  it("beds: men and women rooms are enforced", async () => {
    expect(await code(createBooking(woman, { listingId: bedsId, bedId: maleBed, checkIn: d(5), checkOut: d(6), guests: 1 }))).toBe("gender");
    expect(await code(createBooking(guest, { listingId: bedsWomenId, bedId: femaleBed, checkIn: d(5), checkOut: d(6), guests: 1 }))).toBe("gender");
    expect(await code(createBooking(woman, { listingId: bedsWomenId, bedId: femaleBed, checkIn: d(5), checkOut: d(6), guests: 1 }))).toBe("ok");
  });
  it("cancelled or expired bookings free the dates again", async () => {
    const { booking } = await createBooking(guest, { listingId: flatId, checkIn: d(10), checkOut: d(12), guests: 1 });
    await db.booking.update({ where: { id: booking.id }, data: { expiresAt: new Date(Date.now() - 1000) } }); // payment window passed
    expect(await code(createBooking(guest2, { listingId: flatId, checkIn: d(10), checkOut: d(12), guests: 1 }))).toBe("ok");
  });
  it("blocked days in the host calendar cannot be booked", async () => {
    await db.calendarDay.create({ data: { listingId: flatId, date: d(21), blocked: true } });
    expect(await code(createBooking(guest, { listingId: flatId, checkIn: d(20), checkOut: d(23), guests: 1 }))).toBe("blocked");
  });
});

describe("long-term rentals", () => {
  it("cannot be booked or paid online (visit arranged on WhatsApp)", async () => {
    const lt = await db.listing.create({ data: { hostId: host.id, city: "MAKKAH", title: "LT", description: "D", address: "A", distanceToHaramM: 900, status: "APPROVED", type: "LONG_TERM", pricePerMonth: 100000 } });
    expect(await code(createBooking(guest, { listingId: lt.id, checkIn: d(10), months: 3, guests: 1 }))).toBe("long_term_contact");
  });
});

describe("booking rules", () => {
  it("rejects past dates, own listing, too many guests", async () => {
    expect(await code(createBooking(guest, { listingId: flatId, checkIn: d(-1), checkOut: d(2), guests: 1 }))).toBe("past_date");
    expect(await code(createBooking(host, { listingId: flatId, checkIn: d(3), checkOut: d(4), guests: 1 }))).toBe("own_listing");
    expect(await code(createBooking(guest, { listingId: flatId, checkIn: d(3), checkOut: d(4), guests: 9 }))).toBe("guests");
  });
  it("hidden listings and unapproved hosts cannot be booked", async () => {
    await db.listing.update({ where: { id: flatId }, data: { status: "SUSPENDED" } });
    expect(await code(createBooking(guest, { listingId: flatId, checkIn: d(3), checkOut: d(4), guests: 1 }))).toBe("unavailable");
    await db.listing.update({ where: { id: flatId }, data: { status: "APPROVED" } });
  });
  it("uses calendar special prices and the commission rates, and saves them on the booking", async () => {
    await db.calendarDay.create({ data: { listingId: flatId, date: d(51), price: 30000 } });
    const { booking } = await createBooking(guest, { listingId: flatId, checkIn: d(50), checkOut: d(53), guests: 1 });
    expect(booking.subtotal).toBe(10000 + 30000 + 10000); // 500 €
    expect(booking.serviceFee).toBe(2500); // 5% guest
    expect(booking.hostCommission).toBe(5000); // 10% host
    expect(booking.vat).toBe(1125); // 15% of Diyafa's 75 €
    expect(booking.onlineAmount).toBe(8625);
    expect(booking.payOnSite).toBe(45000);
    expect(booking.total).toBe(53625);
    expect(booking.hostPayout).toBe(0);
    // only the online part is sent to the payment page
    expect((await db.payment.findFirstOrThrow({ where: { bookingId: booking.id } })).amount).toBe(8625);
    // changing the rates later does not change existing bookings
    await db.commissionSetting.update({ where: { listingType: "SHORT_STAY" }, data: { hostPercent: 20 } });
    const again = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(again.hostPercent).toBe(10);
    const { booking: b2 } = await createBooking(guest, { listingId: flatId, checkIn: d(60), checkOut: d(61), guests: 1 });
    expect(b2.hostCommission).toBe(2000);
    await db.commissionSetting.update({ where: { listingType: "SHORT_STAY" }, data: { hostPercent: 10 } });
  });
});

describe("payment, requests, cancellation, payouts", () => {
  it("instant booking is confirmed after payment", async () => {
    const { booking } = await createBooking(guest, { listingId: flatId, checkIn: d(3), checkOut: d(5), guests: 1 });
    const p = await db.payment.findFirstOrThrow({ where: { bookingId: booking.id } });
    await markPaymentPaid(p.id);
    await markPaymentPaid(p.id); // idempotent
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe("CONFIRMED");
  });
  it("request-to-book: host declines → full refund", async () => {
    await db.listing.update({ where: { id: flatId }, data: { instantBook: false } });
    const { booking } = await createBooking(guest, { listingId: flatId, checkIn: d(3), checkOut: d(5), guests: 1 });
    const p = await db.payment.findFirstOrThrow({ where: { bookingId: booking.id } });
    await markPaymentPaid(p.id);
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe("REQUESTED");
    expect(await code(respondToRequest(booking.id, guest.id, true))).toBe("not_found"); // only the host
    await respondToRequest(booking.id, host.id, false);
    const b = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(b.status).toBe("DECLINED");
    expect(b.refundedAmount).toBe(b.onlineAmount);
    await db.listing.update({ where: { id: flatId }, data: { instantBook: true } });
  });
  it("guest cancels a moderate booking 3 days before → 50% back; someone else cannot cancel it", async () => {
    await db.listing.update({ where: { id: flatId }, data: { cancellationPolicy: "MODERATE" } });
    const { booking } = await createBooking(guest, { listingId: flatId, checkIn: d(3), checkOut: d(5), guests: 1 });
    await markPaymentPaid((await db.payment.findFirstOrThrow({ where: { bookingId: booking.id } })).id);
    expect(await code(cancelBooking(booking.id, guest2, ""))).toBe("not_found");
    await cancelBooking(booking.id, guest, "change of plans");
    const b = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(b.status).toBe("CANCELLED");
    expect(b.refundedAmount).toBe(Math.round(b.onlineAmount * 0.5));
    expect(b.hostPayout).toBe(0);
    expect(await db.payment.count({ where: { bookingId: b.id, kind: "REFUND" } })).toBe(1);
  });
  it("payouts group what is owed to the host and never pay twice", async () => {
    const b = await db.booking.create({
      data: { code: "P1", guestId: guest.id, listingId: flatId, unitKey: flatId, checkIn: d(-3), checkOut: d(-1), nights: 2, guests: 1, status: "COMPLETED",
        subtotal: 20000, serviceFee: 1000, vat: 3150, total: 24150, hostCommission: 2000, hostPayout: 18000, hostPercent: 10, guestFeePercent: 5, vatPercent: 15, cancellationPolicy: "MODERATE" },
    });
    expect((await owedByHost()).get(host.id)?.amount).toBe(18000);
    const p = await createPayout(host.id);
    expect(p?.amount).toBe(18000);
    expect(await createPayout(host.id)).toBeNull();
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).payoutId).toBe(p!.id);
    expect(await code(cancelBooking(b.id, admin, "x"))).toBe("state");
  });
});

describe("promo codes", () => {
  it("applies a valid code, refuses an unknown or used-up one, and counts uses after payment", async () => {
    await db.promoCode.create({ data: { code: "TEST50", percentOff: 50, maxUses: 1 } });
    expect(await code(createBooking(guest, { listingId: flatId, checkIn: d(80), checkOut: d(81), guests: 1, promoCode: "NOPE" }))).toBe("promo_invalid");
    const { booking } = await createBooking(guest, { listingId: flatId, checkIn: d(80), checkOut: d(81), guests: 1, promoCode: " test50 " });
    expect(booking.discount).toBeGreaterThan(0);
    expect(booking.payOnSite).toBe(9000); // the host's share is untouched
    await markPaymentPaid((await db.payment.findFirstOrThrow({ where: { bookingId: booking.id } })).id);
    expect((await db.promoCode.findUniqueOrThrow({ where: { code: "TEST50" } })).uses).toBe(1);
    expect(await code(createBooking(guest2, { listingId: flatId, checkIn: d(82), checkOut: d(83), guests: 1, promoCode: "TEST50" }))).toBe("promo_invalid");
  });
});

describe("search", () => {
  it("hides apartments already booked for the requested dates", async () => {
    await createBooking(guest, { listingId: flatId, checkIn: d(10), checkOut: d(12), guests: 1 });
    const busy = await searchListings({ city: "MAKKAH", type: "SHORT_STAY", checkIn: d(11), checkOut: d(13) });
    expect(busy.map((l) => l.id)).not.toContain(flatId);
    const free = await searchListings({ city: "MAKKAH", type: "SHORT_STAY", checkIn: d(12), checkOut: d(14) });
    expect(free.map((l) => l.id)).toContain(flatId);
  });
  it("shared apartment stays visible while at least one bed is free", async () => {
    await createBooking(guest, { listingId: bedsId, bedId: maleBed, checkIn: d(10), checkOut: d(12), guests: 1 });
    expect((await searchListings({ type: "SHARED_BED", checkIn: d(10), checkOut: d(12) })).map((l) => l.id)).toContain(bedsId);
  });
  it("men / women filter: shows bed apartments only if a bed of that gender is free", async () => {
    expect((await searchListings({ gender: "FEMALE" })).map((l) => l.id)).toEqual([bedsWomenId]);
    await createBooking(woman, { listingId: bedsWomenId, bedId: femaleBed, checkIn: d(70), checkOut: d(72), guests: 1 });
    expect((await searchListings({ gender: "FEMALE", checkIn: d(70), checkOut: d(72) })).map((l) => l.id)).toEqual([]);
    expect((await searchListings({ gender: "MALE", checkIn: d(70), checkOut: d(72) })).map((l) => l.id)).toEqual([bedsId]);
  });
  it("filters by distance and price", async () => {
    expect((await searchListings({ maxDistance: 400 })).length).toBe(0);
    expect((await searchListings({ maxPrice: 9000 })).map((l) => l.id).sort()).toEqual([bedsId, bedsWomenId].sort());
  });
});

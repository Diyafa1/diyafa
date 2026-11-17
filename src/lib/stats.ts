import "server-only";
import type { Booking, City, ListingType } from "@prisma/client";
import { db } from "./db";
import { addDays, todayUTC } from "./dates";

/** Diyafa's net revenue on a booking (service fee + host commission), net of refunds and VAT. */
export function platformRevenue(b: Pick<Booking, "total" | "refundedAmount" | "vat" | "hostPayout">) {
  const received = b.total - b.refundedAmount;
  if (received <= 0) return 0;
  const vatKept = Math.round((b.vat * received) / b.total);
  return received - vatKept - b.hostPayout;
}
export function vatKept(b: Pick<Booking, "total" | "refundedAmount" | "vat">) {
  const received = b.total - b.refundedAmount;
  return received <= 0 ? 0 : Math.round((b.vat * received) / b.total);
}

type Agg = { bookings: number; volume: number; commissions: number };

export async function dashboardStats(days: number | null) {
  const since = days ? addDays(todayUTC(), -days) : undefined;
  const bookings = await db.booking.findMany({
    where: { status: { in: ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "DECLINED"] }, ...(since ? { createdAt: { gte: since } } : {}) },
    include: { listing: { select: { city: true, type: true } } },
  });
  const paid = bookings.filter((b) => b.status !== "DECLINED");
  const totals = { bookings: paid.length, volume: 0, commissions: 0, vat: 0, refunds: 0 };
  const byCity = new Map<City, Agg>();
  const byType = new Map<ListingType, Agg>();
  for (const b of bookings) {
    totals.refunds += b.refundedAmount;
    if (b.status === "DECLINED") continue;
    const vol = b.total - b.refundedAmount;
    const com = platformRevenue(b);
    totals.volume += vol;
    totals.commissions += com;
    totals.vat += vatKept(b);
    for (const [map, key] of [[byCity, b.listing.city], [byType, b.listing.type]] as const) {
      const m = (map as Map<string, Agg>).get(key) ?? { bookings: 0, volume: 0, commissions: 0 };
      m.bookings++;
      m.volume += vol;
      m.commissions += com;
      (map as Map<string, Agg>).set(key, m);
    }
  }
  return { totals, byCity, byType };
}

/** Occupancy over the last 30 days: booked unit-nights / available unit-nights. A unit = a whole listing or one bed. */
export async function occupancy30() {
  const end = todayUTC();
  const start = addDays(end, -30);
  const listings = await db.listing.findMany({
    where: { status: "APPROVED" },
    select: { id: true, city: true, type: true, rooms: { select: { beds: { where: { active: true }, select: { id: true } } } } },
  });
  const units = new Map<string, { city: City; type: ListingType }>();
  for (const l of listings) {
    if (l.type === "SHARED_BED") for (const r of l.rooms) for (const b of r.beds) units.set(b.id, { city: l.city, type: l.type });
    else units.set(l.id, { city: l.city, type: l.type });
  }
  const bookings = await db.booking.findMany({
    where: { status: { in: ["CONFIRMED", "COMPLETED"] }, checkIn: { lt: end }, checkOut: { gt: start } },
    select: { unitKey: true, checkIn: true, checkOut: true },
  });
  const booked = new Map<string, number>();
  for (const b of bookings) {
    if (!units.has(b.unitKey)) continue;
    const s = b.checkIn > start ? b.checkIn : start;
    const e = b.checkOut < end ? b.checkOut : end;
    const n = Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
    booked.set(b.unitKey, (booked.get(b.unitKey) ?? 0) + n);
  }
  const group = (key: (u: { city: City; type: ListingType }) => string) => {
    const out = new Map<string, { units: number; nights: number }>();
    for (const [id, u] of units) {
      const k = key(u);
      const g = out.get(k) ?? { units: 0, nights: 0 };
      g.units++;
      g.nights += booked.get(id) ?? 0;
      out.set(k, g);
    }
    return out;
  };
  const rate = (g?: { units: number; nights: number }) => (g && g.units ? g.nights / (g.units * 30) : 0);
  const all = group(() => "all").get("all");
  return { overall: rate(all), byCity: group((u) => u.city), byType: group((u) => u.type), rate };
}

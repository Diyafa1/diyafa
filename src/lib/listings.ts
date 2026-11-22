import "server-only";
import type { City, Gender, ListingType, Prisma } from "@prisma/client";
import { db } from "./db";
import { ACTIVE_STATUSES, expireStaleHolds } from "./bookings";
import { addMonths } from "./dates";

/** A listing is public only if it is approved AND its host is approved and active. */
export const PUBLIC_LISTING: Prisma.ListingWhereInput = {
  status: "APPROVED",
  host: { status: "ACTIVE", hostProfile: { status: "APPROVED" } },
};

export type SearchFilters = {
  city?: City;
  type?: ListingType;
  checkIn?: Date;
  checkOut?: Date;
  months?: number;
  guests?: number;
  minPrice?: number; // cents
  maxPrice?: number;
  maxDistance?: number; // metres
  sort?: "distance" | "priceAsc" | "priceDesc" | "rating";
  gender?: Gender; // beds for men or women only
};

const listingInclude = {
  photos: { orderBy: { position: "asc" }, take: 1 },
  rooms: { include: { beds: { where: { active: true } } } },
  reviews: { where: { hidden: false }, select: { rating: true } },
} satisfies Prisma.ListingInclude;

export type ListingCardData = Prisma.ListingGetPayload<{ include: typeof listingInclude }> & {
  displayPrice: number;
  rating: number | null;
  reviewCount: number;
};

export function displayPrice(l: { type: ListingType; pricePerNight: number | null; pricePerMonth: number | null; rooms: { beds: { pricePerNight: number }[] }[] }) {
  if (l.type === "LONG_TERM") return l.pricePerMonth ?? 0;
  if (l.type === "SHARED_BED") {
    const prices = l.rooms.flatMap((r) => r.beds.map((b) => b.pricePerNight));
    return prices.length ? Math.min(...prices) : 0;
  }
  return l.pricePerNight ?? 0;
}

function decorate(l: Prisma.ListingGetPayload<{ include: typeof listingInclude }>): ListingCardData {
  const n = l.reviews.length;
  return {
    ...l,
    displayPrice: displayPrice(l),
    rating: n ? l.reviews.reduce((s, r) => s + r.rating, 0) / n : null,
    reviewCount: n,
  };
}

export async function searchListings(f: SearchFilters): Promise<ListingCardData[]> {
  const where: Prisma.ListingWhereInput = { ...PUBLIC_LISTING };
  if (f.city) where.city = f.city;
  if (f.type) where.type = f.type;
  if (f.maxDistance) where.distanceToHaramM = { lte: f.maxDistance };
  if (f.guests && f.type !== "SHARED_BED") {
    where.OR = [{ type: "SHARED_BED" }, { maxGuests: { gte: f.guests } }];
  }
  if (f.gender) {
    where.type = "SHARED_BED";
    where.rooms = { some: { gender: f.gender, beds: { some: { active: true } } } };
  }
  let rows = (await db.listing.findMany({ where, include: listingInclude, take: 300 })).map(decorate);

  if (f.minPrice) rows = rows.filter((r) => r.displayPrice >= f.minPrice!);
  if (f.maxPrice) rows = rows.filter((r) => r.displayPrice <= f.maxPrice!);

  if (f.checkIn) {
    const checkIn = f.checkIn;
    await expireStaleHolds();
    const ids = rows.map((r) => r.id);
    const endFor = (r: ListingCardData) =>
      r.type === "LONG_TERM" ? addMonths(checkIn, Math.max(f.months ?? r.minMonths, r.minMonths)) : f.checkOut;
    const maxEnd = rows.reduce<Date | undefined>((m, r) => {
      const e = endFor(r);
      return e && (!m || e > m) ? e : m;
    }, undefined);
    if (maxEnd) {
      const [bookings, blocked] = await Promise.all([
        db.booking.findMany({
          where: { listingId: { in: ids }, status: { in: [...ACTIVE_STATUSES] }, checkIn: { lt: maxEnd }, checkOut: { gt: checkIn } },
          select: { listingId: true, unitKey: true, checkIn: true, checkOut: true },
        }),
        db.calendarDay.findMany({
          where: { listingId: { in: ids }, blocked: true, date: { gte: checkIn, lt: maxEnd } },
          select: { listingId: true, date: true },
        }),
      ]);
      rows = rows.filter((r) => {
        const end = endFor(r);
        if (!end || end <= checkIn) return true;
        if (blocked.some((b) => b.listingId === r.id && b.date >= checkIn && b.date < end)) return false;
        const overlapping = bookings.filter((b) => b.listingId === r.id && b.checkIn < end && b.checkOut > checkIn);
        if (r.type === "SHARED_BED") {
          const beds = r.rooms.filter((room) => !f.gender || room.gender === f.gender).flatMap((room) => room.beds.map((b) => b.id));
          return beds.some((bedId) => !overlapping.some((b) => b.unitKey === bedId));
        }
        return overlapping.length === 0;
      });
    }
  }

  const sort = f.sort ?? "distance";
  rows.sort((a, b) =>
    sort === "priceAsc" ? a.displayPrice - b.displayPrice
    : sort === "priceDesc" ? b.displayPrice - a.displayPrice
    : sort === "rating" ? (b.rating ?? 0) - (a.rating ?? 0)
    : a.distanceToHaramM - b.distanceToHaramM,
  );
  return rows;
}

export async function featuredListings(limit = 8) {
  const rows = await db.listing.findMany({ where: PUBLIC_LISTING, include: listingInclude, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(decorate);
}

export async function getListingCards(where: Prisma.ListingWhereInput) {
  return (await db.listing.findMany({ where, include: listingInclude })).map(decorate);
}

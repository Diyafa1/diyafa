import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { todayUTC } from "./dates";

/** Bookings whose host share is due: stay has started (or booking was cancelled with a partial payout), not yet paid out. */
export function eligibleForPayout(hostId?: string): Prisma.BookingWhereInput {
  return {
    payoutId: null,
    hostPayout: { gt: 0 },
    ...(hostId ? { listing: { hostId } } : {}),
    OR: [
      { status: { in: ["CONFIRMED", "COMPLETED"] }, checkIn: { lte: todayUTC() } },
      { status: "CANCELLED" },
    ],
  };
}

export async function owedByHost() {
  const rows = await db.booking.findMany({
    where: eligibleForPayout(),
    select: { hostPayout: true, listing: { select: { hostId: true } } },
  });
  const map = new Map<string, { amount: number; count: number }>();
  for (const r of rows) {
    const m = map.get(r.listing.hostId) ?? { amount: 0, count: 0 };
    m.amount += r.hostPayout;
    m.count++;
    map.set(r.listing.hostId, m);
  }
  return map;
}

/** Groups all eligible bookings of a host into one payout (status PENDING until the admin marks it paid). */
export async function createPayout(hostId: string) {
  return db.$transaction(async (tx) => {
    const rows = await tx.booking.findMany({ where: eligibleForPayout(hostId), select: { id: true, hostPayout: true } });
    if (!rows.length) return null;
    const payout = await tx.payout.create({ data: { hostId, amount: rows.reduce((s, r) => s + r.hostPayout, 0) } });
    await tx.booking.updateMany({ where: { id: { in: rows.map((r) => r.id) }, payoutId: null }, data: { payoutId: payout.id } });
    return payout;
  });
}

import type { CancellationPolicy } from "@prisma/client";

/** Share of the total refunded when the GUEST cancels a confirmed booking. */
export function guestRefundShare(policy: CancellationPolicy, checkIn: Date, now: Date): number {
  const hoursBefore = (checkIn.getTime() - now.getTime()) / 3600000;
  const days = hoursBefore / 24;
  switch (policy) {
    case "FLEXIBLE":
      return hoursBefore >= 24 ? 1 : 0.5;
    case "MODERATE":
      return days >= 5 ? 1 : hoursBefore >= 24 ? 0.5 : 0;
    case "STRICT":
      return days >= 14 ? 1 : days >= 7 ? 0.5 : 0;
  }
}

export type CancelOutcome = {
  refundAmount: number;
  newHostPayout: number;
  newHostCommission: number;
};

/**
 * by = "guest" applies the listing policy (full refund if the host had not yet accepted);
 * by = "host" | "admin" always refunds in full and the host gets nothing.
 */
export function computeCancellation(
  b: { total: number; subtotal: number; hostPercent: number; status: string; checkIn: Date; cancellationPolicy: CancellationPolicy },
  by: "guest" | "host" | "admin",
  now: Date,
  adminShare?: number,
): CancelOutcome {
  let share: number;
  if (by === "admin" && adminShare !== undefined) share = Math.min(1, Math.max(0, adminShare));
  else if (by !== "guest" || b.status === "REQUESTED") share = 1;
  else share = guestRefundShare(b.cancellationPolicy, b.checkIn, now);

  const refundAmount = Math.round(b.total * share);
  const keptSubtotal = Math.round(b.subtotal * (1 - share));
  const newHostCommission = Math.round((keptSubtotal * b.hostPercent) / 100);
  return { refundAmount, newHostPayout: keptSubtotal - newHostCommission, newHostCommission };
}

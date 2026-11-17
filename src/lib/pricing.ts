import type { ListingType } from "@prisma/client";

export type Rates = { hostPercent: number; guestFeePercent: number; vatPercent: number };

export const DEFAULT_RATES: Record<ListingType, Rates> = {
  SHORT_STAY: { hostPercent: 10, guestFeePercent: 5, vatPercent: 15 },
  SHARED_BED: { hostPercent: 10, guestFeePercent: 5, vatPercent: 15 },
  LONG_TERM: { hostPercent: 5, guestFeePercent: 2, vatPercent: 15 },
};

export type Quote = {
  subtotal: number; // accommodation price (halalas)
  serviceFee: number; // paid by guest to Diyafa
  vat: number; // VAT on (subtotal + service fee)
  total: number; // what the guest pays
  hostCommission: number; // kept by Diyafa from the host's share
  hostPayout: number; // what Diyafa owes the host
  platformRevenue: number; // serviceFee + hostCommission (excl. VAT)
};

const pct = (amount: number, p: number) => Math.round((amount * p) / 100);

export function computeQuote(subtotal: number, rates: Rates): Quote {
  if (!Number.isInteger(subtotal) || subtotal < 0) throw new Error("invalid subtotal");
  const serviceFee = pct(subtotal, rates.guestFeePercent);
  const vat = pct(subtotal + serviceFee, rates.vatPercent);
  const hostCommission = pct(subtotal, rates.hostPercent);
  return {
    subtotal,
    serviceFee,
    vat,
    total: subtotal + serviceFee + vat,
    hostCommission,
    hostPayout: subtotal - hostCommission,
    platformRevenue: serviceFee + hostCommission,
  };
}

/** Sum of nightly prices, using per-day overrides where present. */
export function nightlySubtotal(nights: Date[], basePrice: number, overrides: Map<string, number | null>): number {
  return nights.reduce((sum, d) => {
    const o = overrides.get(d.toISOString().slice(0, 10));
    return sum + (o ?? basePrice);
  }, 0);
}

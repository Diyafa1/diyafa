import type { ListingType } from "@prisma/client";

export type Rates = { hostPercent: number; guestFeePercent: number; vatPercent: number };

export const DEFAULT_RATES: Record<ListingType, Rates> = {
  SHORT_STAY: { hostPercent: 20, guestFeePercent: 10, vatPercent: 0 },
  SHARED_BED: { hostPercent: 20, guestFeePercent: 10, vatPercent: 0 },
  LONG_TERM: { hostPercent: 20, guestFeePercent: 10, vatPercent: 0 },
};

/**
 * Payment model: the guest pays ONLINE only Diyafa's share (guest service fee + host commission, + VAT on it),
 * and pays the REST directly to the host ON SITE (in cash or as agreed with the host).
 */
export type Quote = {
  subtotal: number; // accommodation price set by the host (cents)
  serviceFee: number; // guest fee, Diyafa
  hostCommission: number; // host commission, Diyafa
  vat: number; // VAT on Diyafa's share only
  onlineAmount: number; // paid online by card (Stripe) = serviceFee + hostCommission + vat
  payOnSite: number; // paid to the host on arrival = subtotal - hostCommission
  total: number; // whole stay for the guest = onlineAmount + payOnSite
  hostPayout: number; // owed by Diyafa to the host: always 0 in this model (the host is paid on site)
  platformRevenue: number; // serviceFee + hostCommission - discount (excl. VAT)
  discount: number; // promo / referral discount, paid by Diyafa (taken from the online part)
};

const pct = (amount: number, p: number) => Math.round((amount * p) / 100);

export function computeQuote(subtotal: number, rates: Rates, discountPercent = 0): Quote {
  if (!Number.isInteger(subtotal) || subtotal < 0) throw new Error("invalid subtotal");
  const serviceFee = pct(subtotal, rates.guestFeePercent);
  const hostCommission = Math.min(subtotal, pct(subtotal, rates.hostPercent));
  const vat = pct(serviceFee + hostCommission, rates.vatPercent);
  // The discount never touches the host's share: Diyafa gives up part of its own commission.
  const discount = Math.min(pct(subtotal, Math.max(0, discountPercent)), serviceFee + hostCommission);
  const onlineAmount = serviceFee + hostCommission + vat - discount;
  const payOnSite = subtotal - hostCommission;
  return {
    subtotal,
    serviceFee,
    hostCommission,
    vat,
    onlineAmount,
    payOnSite,
    total: onlineAmount + payOnSite,
    hostPayout: 0,
    platformRevenue: serviceFee + hostCommission - discount,
    discount,
  };
}

export type SeasonRange = { startDate: Date; endDate: Date; percent: number };

/** Season increase (in %) for a night: the highest matching season, 0 if none. */
export function seasonPercent(night: Date, seasons: SeasonRange[]): number {
  return seasons.reduce((m, s) => (night >= s.startDate && night <= s.endDate ? Math.max(m, s.percent) : m), 0);
}

/**
 * Sum of nightly prices: a special price set by the host in the calendar always wins;
 * otherwise the base price, raised during busy seasons if the host opted in.
 */
export function nightlySubtotal(nights: Date[], basePrice: number, overrides: Map<string, number | null>, seasons: SeasonRange[] = []): number {
  return nights.reduce((sum, d) => {
    const o = overrides.get(d.toISOString().slice(0, 10));
    if (o != null) return sum + o;
    return sum + Math.round(basePrice * (1 + seasonPercent(d, seasons) / 100));
  }, 0);
}

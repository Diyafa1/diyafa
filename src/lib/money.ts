/**
 * Currency of the whole site. Amounts are stored as integers in the smallest unit (cents for EUR).
 * To change currency later, change this line (and the "(€)" labels in src/lib/i18n).
 */
export const CURRENCY = "EUR";

export function formatMoney(cents: number, locale = "ar"): string {
  const loc = locale === "ar" ? "ar-SA-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-IE";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
/** Plain text amount for e-mails, e.g. "120.50 €". */
export const moneyText = (cents: number) => `${(cents / 100).toFixed(2)} €`;
export const toCents = (amount: number) => Math.round(amount * 100);

/** Long-term rentals are priced per year in Saudi riyals (paid directly, never online). */
export function formatSAR(halalas: number, locale = "ar"): string {
  const loc = locale === "ar" ? "ar-SA-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(loc, { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(halalas / 100);
}

/** Price shown for a listing: SAR per year for long-term, euros otherwise. */
export function formatListingPrice(l: { type: string }, amount: number, locale = "ar") {
  return l.type === "LONG_TERM" ? formatSAR(amount, locale) : formatMoney(amount, locale);
}

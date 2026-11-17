/** All amounts are stored in halalas (1 SAR = 100 halalas). */
export function formatSAR(halalas: number, locale = "ar"): string {
  const loc = locale === "ar" ? "ar-SA-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: halalas % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(halalas / 100);
}
export const toHalalas = (sar: number) => Math.round(sar * 100);
export const toSAR = (halalas: number) => halalas / 100;

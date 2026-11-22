import type { Locale } from "./i18n";

const FRENCH_COUNTRIES = new Set(["FR", "BE", "LU", "CH", "MC", "MA", "DZ", "TN", "SN", "CI"]);
const ARABIC_COUNTRIES = new Set(["SA", "AE", "QA", "KW", "BH", "OM", "JO", "EG", "IQ", "LB", "SY", "YE", "PS", "LY", "SD"]);

/**
 * First visit: choose the language from the visitor's country (given by Vercel) and browser languages.
 * France / Belgium → French. Arab countries → Arabic. Otherwise the browser's preferred language, or English.
 */
export function detectLocale(country: string | null, acceptLanguage: string | null): Locale {
  const c = (country ?? "").toUpperCase();
  if (FRENCH_COUNTRIES.has(c)) return "fr";
  if (ARABIC_COUNTRIES.has(c)) return "ar";
  const langs = (acceptLanguage ?? "")
    .split(",")
    .map((p) => p.split(";")[0].trim().slice(0, 2).toLowerCase())
    .filter(Boolean);
  for (const l of langs) if (l === "fr" || l === "ar" || l === "en") return l;
  return "en";
}

import { en, type Dict, type TKey } from "./en";
import { fr } from "./fr";
import { ar } from "./ar";

export const LOCALES = ["ar", "en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_NAMES: Record<Locale, string> = { ar: "العربية", en: "English", fr: "Français" };
export const isLocale = (x: unknown): x is Locale => LOCALES.includes(x as Locale);

const DICTS: Record<Locale, Dict> = { ar, en, fr };
export type { TKey };
export type T = (key: TKey, vars?: Record<string, string | number>) => string;

export function makeT(locale: Locale): T {
  const d = DICTS[locale];
  return (key, vars) => {
    let s = d[key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}
export const getDict = (l: Locale) => DICTS[l];
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

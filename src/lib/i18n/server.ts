import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, makeT, type Locale } from ".";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("locale")?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}
export async function getT() {
  const locale = await getLocale();
  return { t: makeT(locale), locale };
}

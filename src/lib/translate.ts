import "server-only";
import { db } from "./db";

/**
 * Automatic translation of what hosts write (title, description, rules) into fr / en / ar.
 * Provider: Google Cloud Translation (GOOGLE_TRANSLATE_API_KEY) or DeepL (DEEPL_API_KEY).
 * Translations are stored on the listing, so each text is translated once, not on every visit.
 */
export const LANGS = ["fr", "en", "ar"] as const;
export type Lang = (typeof LANGS)[number];
export type ListingTexts = { title: string; description: string; rules: string | null };
export type Translations = Partial<Record<Lang, ListingTexts>>;

export const translationEnabled = () => !!(process.env.GOOGLE_TRANSLATE_API_KEY?.trim() || process.env.DEEPL_API_KEY?.trim());

async function google(texts: string[], target: Lang): Promise<{ out: string[]; source?: string }> {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(process.env.GOOGLE_TRANSLATE_API_KEY!.trim())}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, target, format: "text" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`google translate ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { data: { translations: { translatedText: string; detectedSourceLanguage?: string }[] } };
  return { out: j.data.translations.map((x) => x.translatedText), source: j.data.translations[0]?.detectedSourceLanguage };
}

async function deepl(texts: string[], target: Lang): Promise<{ out: string[]; source?: string }> {
  const key = process.env.DEEPL_API_KEY!.trim();
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texts, target_lang: target === "en" ? "EN-GB" : target.toUpperCase() }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`deepl ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { translations: { text: string; detected_source_language?: string }[] };
  return { out: j.translations.map((x) => x.text), source: j.translations[0]?.detected_source_language?.toLowerCase() };
}

export async function translateTexts(t: ListingTexts): Promise<{ source: string | null; translations: Translations }> {
  const fn = process.env.GOOGLE_TRANSLATE_API_KEY?.trim() ? google : deepl;
  const texts = [t.title, t.description, t.rules ?? ""];
  const translations: Translations = {};
  let source: string | null = null;
  for (const lang of LANGS) {
    const { out, source: detected } = await fn(texts, lang);
    source ??= detected ?? null;
    translations[lang] = { title: out[0], description: out[1], rules: t.rules ? out[2] : null };
  }
  return { source, translations };
}

/** Translates one listing and saves the result. Never throws (the listing stays in its original language). */
export async function translateListing(id: string): Promise<boolean> {
  if (!translationEnabled()) return false;
  const l = await db.listing.findUnique({ where: { id }, select: { title: true, description: true, rules: true } });
  if (!l) return false;
  try {
    const { source, translations } = await translateTexts(l);
    await db.listing.update({ where: { id }, data: { sourceLang: source, translations } });
    return true;
  } catch (e) {
    console.error("[translate]", e instanceof Error ? e.message : e);
    return false;
  }
}

/** Text to show a visitor: their language if a translation exists, otherwise the original. */
export function localizedTexts(
  l: { title: string; description: string; rules: string | null; sourceLang?: string | null; translations?: unknown },
  locale: string,
  original = false,
): ListingTexts & { translated: boolean } {
  const tr = (l.translations ?? {}) as Translations;
  const sameLang = l.sourceLang?.slice(0, 2) === locale;
  const pick = !original && !sameLang ? tr[locale as Lang] : undefined;
  return pick ? { ...pick, translated: true } : { title: l.title, description: l.description, rules: l.rules, translated: false };
}

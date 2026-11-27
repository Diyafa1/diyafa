import type { Metadata } from "next";
import { LOCALES, type Locale } from "@/lib/i18n";

export const SITE_URL = (process.env.APP_URL || "https://www.al-diyafa.com").replace(/\/+$/, "");
const OG_LOCALE: Record<Locale, string> = { fr: "fr_FR", en: "en_US", ar: "ar_SA" };

/** Same page in each language (?lang=xx), so Google can index French, English and Arabic separately. */
export function langUrl(path: string, locale: Locale) {
  const u = new URL(path, SITE_URL);
  u.searchParams.set("lang", locale);
  return u.toString();
}

export function alternates(path: string, locale: Locale): Metadata["alternates"] {
  return {
    canonical: langUrl(path, locale),
    languages: { ...Object.fromEntries(LOCALES.map((l) => [l, langUrl(path, l)])), "x-default": new URL(path, SITE_URL).toString() },
  };
}

/** Title, description, language versions and social preview for a public page. */
export function pageMeta(o: { path: string; locale: Locale; title: string; description: string; image?: string; absoluteTitle?: boolean }): Metadata {
  const images = [{ url: o.image ?? `${SITE_URL}/icons/og.png`, width: o.image ? undefined : 1200, height: o.image ? undefined : 630 }];
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: alternates(o.path, o.locale),
    openGraph: { type: "website", siteName: "Al-Diyafa الضيافة", title: o.title, description: o.description, url: langUrl(o.path, o.locale), locale: OG_LOCALE[o.locale], images },
    twitter: { card: "summary_large_image", title: o.title, description: o.description, images: images.map((i) => i.url) },
  };
}

export const NO_INDEX: Metadata = { robots: { index: false, follow: false } };

/** Inline structured data for Google (schema.org). */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

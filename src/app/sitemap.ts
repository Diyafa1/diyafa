import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { PUBLIC_LISTING } from "@/lib/listings";
import { LOCALES } from "@/lib/i18n";
import { langUrl } from "@/lib/seo";

export const revalidate = 3600;

function entry(path: string, priority: number, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, langUrl(path, l)]));
  // One line per language version, each pointing to the others (what Google recommends)
  return LOCALES.map((l) => ({ url: langUrl(path, l), lastModified, priority, changeFrequency: "daily" as const, alternates: { languages } }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await db.listing.findMany({ where: PUBLIC_LISTING, select: { id: true, updatedAt: true }, take: 5000 }).catch(() => []);
  return [
    ...entry("/", 1),
    ...entry("/makkah", 0.9),
    ...entry("/madinah", 0.9),
    ...entry("/search", 0.7),
    ...listings.flatMap((l) => entry(`/listings/${l.id}`, 0.8, l.updatedAt)),
    ...entry("/register", 0.5),
    ...entry("/help", 0.4),
    ...entry("/contact", 0.3),
    ...entry("/terms", 0.1),
    ...entry("/privacy", 0.1),
  ];
}

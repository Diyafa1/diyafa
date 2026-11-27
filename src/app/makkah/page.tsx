import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import { CITY_PAGES } from "@/lib/seo-content";
import { pageMeta } from "@/lib/seo";
import { CityLanding } from "@/components/CityLanding";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = CITY_PAGES.MAKKAH[locale];
  return pageMeta({ path: "/makkah", locale, title: c.title, description: c.description, absoluteTitle: true });
}

export default function Page() {
  return <CityLanding city="MAKKAH" path="/makkah" />;
}

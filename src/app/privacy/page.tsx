import { StaticPage } from "@/components/StaticPage";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";
import { SEO } from "@/lib/seo-content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { ...pageMeta({ path: "/privacy", locale, ...SEO.privacy[locale] }) };
}
export default function Page() {
  return <StaticPage page="privacy" />;
}

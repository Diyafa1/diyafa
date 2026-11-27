import Link from "next/link";
import type { City } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { searchListings } from "@/lib/listings";
import { CITY_PAGES } from "@/lib/seo-content";
import { SITE_URL, jsonLd, langUrl } from "@/lib/seo";
import { ListingCard } from "./ListingCard";

/** SEO landing page for one city: useful text + the city's listings + FAQ (also given to Google as structured data). */
export async function CityLanding({ city, path }: { city: Extract<City, "MAKKAH" | "MADINAH">; path: string }) {
  const { t, locale } = await getT();
  const c = CITY_PAGES[city][locale];
  const listings = (await searchListings({ city })).slice(0, 12);
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Al-Diyafa", item: langUrl("/", locale) },
        { "@type": "ListItem", position: 2, name: t(`city.${city}`), item: langUrl(path, locale) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: listings.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/listings/${l.id}` })),
    },
  ];
  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />
      <nav className="mb-3 text-sm text-neutral-500"><Link href="/" className="text-neutral-500">Al-Diyafa</Link> › {t(`city.${city}`)}</nav>
      <h1 className="text-3xl md:text-4xl">{c.h1}</h1>
      <div className="mt-4 max-w-3xl space-y-3 text-neutral-700">
        {c.intro.map((p) => <p key={p}>{p}</p>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/search?city=${city}&type=SHORT_STAY`} className="btn-primary no-underline">{t("type.SHORT_STAY")}</Link>
        <Link href={`/search?city=${city}&type=SHARED_BED&gender=MALE`} className="btn-secondary no-underline">{t("type.SHARED_BED")} · {t("gender.MALE")}</Link>
        <Link href={`/search?city=${city}&type=SHARED_BED&gender=FEMALE`} className="btn-secondary no-underline">{t("type.SHARED_BED")} · {t("gender.FEMALE")}</Link>
        <Link href={`/search?city=${city}&type=LONG_TERM`} className="btn-secondary no-underline">{t("type.LONG_TERM")}</Link>
      </div>

      {listings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl">{c.all}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => <ListingCard key={l.id} l={l} t={t} locale={locale} />)}
          </div>
          <Link href={`/search?city=${city}`} className="btn-secondary mt-6 inline-flex no-underline">{c.cta}</Link>
        </section>
      )}

      <section className="mt-12 max-w-3xl">
        <h2 className="mb-4 text-xl">FAQ</h2>
        <div className="space-y-3">
          {c.faq.map((f) => (
            <details key={f.q} className="card p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-neutral-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

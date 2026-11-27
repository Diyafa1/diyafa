import { getT } from "@/lib/i18n/server";
import { searchListings } from "@/lib/listings";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { parseSearch } from "@/lib/search-params";
import { SearchForm } from "@/components/SearchForm";
import { ListingCard } from "@/components/ListingCard";
import { Empty } from "@/components/ui";
import { MapView } from "@/components/MapView";
import { HARAM_COORDS } from "@/lib/haram";
import { formatListingPrice } from "@/lib/money";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";
import { SEO } from "@/lib/seo-content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { ...pageMeta({ path: "/search", locale, ...SEO.search[locale] }) };
}


export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t, locale } = await getT();
  const sp = await searchParams;
  const filters = parseSearch(sp);
  const results = await searchListings(filters);
  if (results.length === 0 && (filters.city || filters.checkIn || filters.type)) {
    // Unmet demand: kept for the owner (Admin → Bookings → Not found)
    const user = await getUser();
    await db.searchLog
      .create({ data: { city: filters.city, type: filters.type, gender: filters.gender, checkIn: filters.checkIn, checkOut: filters.checkOut, months: filters.months, guests: filters.guests, maxPrice: filters.maxPrice, userId: user?.id } })
      .catch(() => {});
  }
  const keep = new URLSearchParams();
  for (const k of ["checkIn", "checkOut", "guests", "months"]) if (sp[k]) keep.set(k, sp[k]!);
  const q = keep.toString() ? `?${keep}` : "";
  const showMap = sp.view === "map";
  const base = new URLSearchParams(Object.entries(sp).filter(([k, v]) => k !== "view" && v) as [string, string][]);
  const listQs = base.toString();
  base.set("view", "map");
  if (!sp.city) base.set("city", "MAKKAH");
  const mapQs = base.toString();
  return (
    <div className="container-page py-6">
      <details className="mb-6" open={!showMap}>
        <summary className="mb-3 cursor-pointer text-sm font-medium text-neutral-700">{t("search.filters")}</summary>
        <SearchForm t={t} sp={sp} full />
      </details>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-600">{t("search.results", { n: results.length })}</p>
        <div className="flex gap-1">
          <Link href={`/search?${listQs}`} className={`${!showMap ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>{t("search.list")}</Link>
          <Link href={`/search?${mapQs}`} className={`${showMap ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>{t("search.map")}</Link>
        </div>
      </div>
      {showMap && (
        <div className="mb-6">
          <MapView
            center={HARAM_COORDS[sp.city === "MADINAH" ? "MADINAH" : "MAKKAH"]}
            haramLabel={t(sp.city === "MADINAH" ? "map.nabawi" : "map.haram")}
            points={results.filter((l) => l.latitude != null && l.longitude != null && (!sp.city || l.city === sp.city)).map((l) => ({ id: l.id, lat: l.latitude!, lng: l.longitude!, label: formatListingPrice(l, l.displayPrice, locale), href: `/listings/${l.id}${q}` }))}
          />
        </div>
      )}
      {results.length === 0 ? (
        <Empty>{t("search.none")}</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((l) => <ListingCard key={l.id} l={l} t={t} locale={locale} query={q} />)}
        </div>
      )}
    </div>
  );
}

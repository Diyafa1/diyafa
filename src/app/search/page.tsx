import { getT } from "@/lib/i18n/server";
import { searchListings } from "@/lib/listings";
import { parseSearch } from "@/lib/search-params";
import { SearchForm } from "@/components/SearchForm";
import { ListingCard } from "@/components/ListingCard";
import { Empty } from "@/components/ui";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t, locale } = await getT();
  const sp = await searchParams;
  const results = await searchListings(parseSearch(sp));
  const keep = new URLSearchParams();
  for (const k of ["checkIn", "checkOut", "guests", "months"]) if (sp[k]) keep.set(k, sp[k]!);
  const q = keep.toString() ? `?${keep}` : "";
  return (
    <div className="container-page py-6">
      <details className="mb-6" open>
        <summary className="mb-3 cursor-pointer text-sm font-medium text-neutral-700">{t("search.filters")}</summary>
        <SearchForm t={t} sp={sp} full />
      </details>
      <p className="mb-4 text-sm text-neutral-600">{t("search.results", { n: results.length })}</p>
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

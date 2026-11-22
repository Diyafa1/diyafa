import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { featuredListings } from "@/lib/listings";
import { SearchForm } from "@/components/SearchForm";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { t, locale } = await getT();
  const featured = await featuredListings(8);
  return (
    <>
      <section className="border-b border-neutral-100 bg-white">
        <div className="container-page py-10 md:py-16">
          <h1 className="max-w-2xl text-3xl leading-tight md:text-5xl">{t("home.title")}</h1>
          <p className="mt-3 max-w-xl text-neutral-600">{t("home.subtitle")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
            {(["MAKKAH", "MADINAH"] as const).map((c) => (
              <Link key={c} href={`/search?city=${c}`} className="card flex flex-col items-center gap-1 p-4 text-neutral-900 no-underline hover:border-brand">
                <span className="text-lg font-semibold">{t(`city.${c}`)}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <SearchForm t={t} />
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {(["SHORT_STAY", "SHARED_BED", "LONG_TERM"] as const).map((ty) => (
            <div key={ty} className="card p-4 hover:border-brand">
              <Link href={`/search?type=${ty}`} className="block text-neutral-900 no-underline">
                <div className="font-medium">{t(`type.${ty}`)}</div>
                <div className="text-sm text-neutral-500">{t(`type.${ty}.desc`)}</div>
              </Link>
              {ty === "SHARED_BED" && (
                <div className="mt-3 flex gap-2">
                  <Link href="/search?type=SHARED_BED&gender=MALE" className="btn-secondary btn-sm no-underline">{t("gender.MALE")}</Link>
                  <Link href="/search?type=SHARED_BED&gender=FEMALE" className="btn-secondary btn-sm no-underline">{t("gender.FEMALE")}</Link>
                </div>
              )}
            </div>
          ))}
        </div>

        <h2 className="mb-4 text-xl">{t("home.featured")}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((l) => <ListingCard key={l.id} l={l} t={t} locale={locale} />)}
        </div>
      </section>

      <section className="container-page pb-6">
        <div className="card grid gap-6 p-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xl">{t("home.whyTitle")}</h2>
            <ul className="space-y-2 text-sm text-neutral-700">
              {(["home.why1", "home.why2", "home.why3"] as const).map((k) => (
                <li key={k} className="flex gap-2"><span className="text-brand">✓</span>{t(k)}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start justify-center gap-3 rounded-[12px] bg-brand-50 p-5">
            <p className="font-medium text-neutral-900">{t("home.hostCta")}</p>
            <Link href="/register?as=host" className="btn-primary no-underline">{t("home.hostCtaBtn")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

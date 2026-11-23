import Link from "next/link";
import type { ListingCardData } from "@/lib/listings";
import type { Locale, T } from "@/lib/i18n";
import { formatListingPrice } from "@/lib/money";
import { DistanceBadge } from "./DistanceBadge";
import { localizedTexts } from "@/lib/translate";

export function ListingCard({ l, t, locale, query = "" }: { l: ListingCardData; t: T; locale: Locale; query?: string }) {
  const unit = l.type === "LONG_TERM" ? t("listing.perYear") : l.type === "SHARED_BED" ? t("listing.perBed") : t("listing.perNight");
  return (
    <Link href={`/listings/${l.id}${query}`} className="group block text-neutral-900 no-underline">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-neutral-100">
        {l.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photos[0].url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        )}
        <span className="badge absolute start-2 top-2 bg-white/95">{t(`type.${l.type}`)}</span>
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-medium">{localizedTexts(l, locale).title}</h3>
        {l.rating !== null && (
          <span className="shrink-0 text-xs text-neutral-700">★ {l.rating.toFixed(1)}</span>
        )}
      </div>
      <div className="text-xs text-neutral-500">{t(`city.${l.city}`)}{l.neighborhood ? ` · ${l.neighborhood}` : ""}</div>
      <DistanceBadge meters={l.distanceToHaramM} walk={l.walkMinutes} driveMinutes={l.driveMinutes} t={t} compact />
      {l.type === "SHARED_BED" && l.bedGender && <div className="mt-1"><span className="badge-brand">{t(`beds.for.${l.bedGender}`)}</span></div>}
      <div className="mt-1 text-sm">
        {l.type === "SHARED_BED" && <span className="text-neutral-500">{t("listing.from")} </span>}
        <span className="font-semibold">{formatListingPrice(l, l.displayPrice, locale)}</span>
        <span className="text-neutral-500"> {unit}</span>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { thumbUrl } from "@/lib/photo-url";
import type { Booking, Listing, ListingPhoto } from "@prisma/client";
import type { Locale, T } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "./ui";

export function fmtDay(d: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

export function TripCard({ b, t, locale, href }: { b: Booking & { listing: Listing & { photos: ListingPhoto[] } }; t: T; locale: Locale; href: string }) {
  return (
    <Link href={href} className="card flex gap-3 p-3 text-neutral-900 no-underline hover:border-brand">
      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-[12px] bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {b.listing.photos[0] && <img src={thumbUrl(b.listing.photos[0].url)} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="truncate font-medium">{b.listing.title}</div>
          <StatusBadge status={b.status} label={t(`status.${b.status}`)} />
        </div>
        <div className="text-xs text-neutral-500">{t(`city.${b.listing.city}`)} · {b.code}</div>
        <div className="text-sm text-neutral-700">{fmtDay(b.checkIn, locale)} → {fmtDay(b.checkOut, locale)}</div>
        <div className="text-sm font-medium">{formatMoney(b.total, locale)}</div>
      </div>
    </Link>
  );
}

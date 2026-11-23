import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { displayPrice } from "@/lib/listings";
import { formatListingPrice } from "@/lib/money";
import { Empty, StatusBadge } from "@/components/ui";
import { pauseListingAction } from "@/app/actions/host";

export default async function HostListings() {
  const user = await requireRole("HOST");
  const { t, locale } = await getT();
  const rows = await db.listing.findMany({
    where: { hostId: user.id },
    include: { photos: { orderBy: { position: "asc" }, take: 1 }, rooms: { include: { beds: { where: { active: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <div className="mb-4 flex justify-end"><Link href="/host/listings/new" className="btn-primary no-underline">+ {t("host.newListing")}</Link></div>
      {rows.length === 0 ? <Empty>{t("host.noListings")}</Empty> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((l) => (
            <li key={l.id} className="card flex gap-3 p-3">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-[12px] bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.photos[0] && <img src={l.photos[0].url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-start justify-between gap-2"><span className="truncate font-medium">{l.title}</span><StatusBadge status={l.status} label={t(`lstatus.${l.status}`)} /></div>
                <div className="text-neutral-500">{t(`type.${l.type}`)} · {t(`city.${l.city}`)}</div>
                <div>{formatListingPrice(l, displayPrice(l), locale)}</div>
                {l.rejectionReason && l.status === "REJECTED" && <div className="text-brand">{l.rejectionReason}</div>}
                {l.paused && <div className="font-medium text-brand">⏸️ {t("cal.pausedBadge")}</div>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href={`/host/listings/${l.id}`} className="btn-secondary btn-sm no-underline">{t("host.edit")}</Link>
                  {l.type !== "LONG_TERM" && <Link href={`/host/listings/${l.id}/calendar`} className="btn-primary btn-sm no-underline">📅 {t("cal.availability")}</Link>}
                  <Link href={`/listings/${l.id}`} className="btn-ghost btn-sm no-underline">{t("host.view")}</Link>
                  {l.status === "APPROVED" && (
                    <form action={pauseListingAction}><input type="hidden" name="id" value={l.id} /><button className="btn-ghost btn-sm">{l.paused ? `▶️ ${t("cal.resume")}` : `⏸️ ${t("cal.pause")}`}</button></form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

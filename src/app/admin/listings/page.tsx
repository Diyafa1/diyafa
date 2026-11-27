import { requireSection } from "@/lib/auth";
import { thumbUrl } from "@/lib/photo-url";
import Link from "next/link";
import { Choice } from "@/components/Choice";
import type { ListingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { fixDistanceAction, reviewListingAction } from "@/app/actions/admin";
import { displayPrice } from "@/lib/listings";
import { formatListingPrice } from "@/lib/money";
import { Empty, StatusBadge } from "@/components/ui";
import { DecisionNotice, ReviewTrace } from "@/components/DecisionNotice";

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; incomplete?: string; what?: string; error?: string; done?: string; who?: string; mail?: string }> }) {
  await requireSection("listings");
  const { t, locale } = await getT();
  const sp = await searchParams;
  const statuses = ["PENDING", "APPROVED", "DRAFT", "REJECTED", "SUSPENDED"];
  const status = statuses.includes(sp.status ?? "") ? (sp.status as ListingStatus) : undefined;
  const rows = await db.listing.findMany({
    where: { ...(status ? { status } : {}), ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {}) },
    include: { host: { include: { hostProfile: true } }, photos: { take: 1, orderBy: { position: "asc" } }, rooms: { include: { beds: true } }, _count: { select: { photos: true, bookings: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });
  return (
    <div className="space-y-4">
      <DecisionNotice done={sp.done} who={sp.who} mail={sp.mail} />
      {sp.error === "distance" && <div className="alert-brand">{t("lf.err.distance")}</div>}
      {sp.incomplete && <div className="alert-brand">{t(sp.what === "photos" ? "admin.incompletePhotos" : sp.what === "beds" ? "admin.incompleteBeds" : "admin.incompletePrice")}</div>}
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder={t("admin.search")} className="input max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input max-w-[180px]">
          <option value="">{t("common.all")}</option>
          {statuses.map((s) => <option key={s} value={s}>{t(`lstatus.${s}` as never)}</option>)}
        </select>
        <button className="btn-secondary">{t("search.apply")}</button>
      </form>
      {rows.length === 0 ? <Empty>{t("admin.none")}</Empty> : rows.map((l) => (
        <div key={l.id} className="card flex flex-col gap-3 p-4 text-sm md:flex-row">
          <div className="h-24 w-32 shrink-0 overflow-hidden rounded-[12px] bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {l.photos[0] && <img src={thumbUrl(l.photos[0].url)} alt="" className="h-full w-full object-cover" loading="lazy" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Link href={`/listings/${l.id}`} className="font-medium text-neutral-900">{l.title}</Link>
              <div className="text-end">
                <StatusBadge status={l.status} label={t(`lstatus.${l.status}`)} />
                <ReviewTrace by={l.reviewedBy} at={l.reviewedAt} status={l.status} />
              </div>
            </div>
            <div className="text-neutral-600">{t(`type.${l.type}`)} · {t(`city.${l.city}`)} · {l.distanceToHaramM} m · {formatListingPrice(l, displayPrice(l), locale)}</div>
            <div className="text-neutral-600">{l.type === "LONG_TERM" ? t("lt.ownerLabel") : t("role.HOST")} : {l.host.hostProfile?.displayName ?? l.host.name} ({l.host.hostProfile ? t(`rstatus.${l.host.hostProfile.status}`) : "—"})</div>
            <div className="text-xs text-neutral-500">{t("lf.photos")}: {l._count.photos} · {t("admin.bookings")}: {l._count.bookings}</div>
            {l.type === "LONG_TERM" && (
              <div className="text-sm">
                {t("lf.ownerPhone")}: {l.ownerPhone ? <a href={`https://wa.me/${l.ownerPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="link" dir="ltr">{l.ownerPhone}</a> : "—"}
                {l.allowTwoPayments && <span className="badge-brand ms-2">{t("lt.twoPaymentsShort")}</span>}
              </div>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-neutral-500">📍 {l.distanceToHaramM >= 1000 ? `${(l.distanceToHaramM / 1000).toFixed(1)} km` : `${l.distanceToHaramM} m`}{l.walkMinutes ? ` · ${l.walkMinutes} min à pied` : ""}{l.driveMinutes ? ` · ${l.driveMinutes} min en voiture` : ""} — corriger</summary>
              <form action={fixDistanceAction} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={l.id} />
                <label className="block"><span className="label">Distance</span><input name="distanceValue" type="number" step="any" min={0} required defaultValue={l.distanceToHaramM >= 1000 ? l.distanceToHaramM / 1000 : l.distanceToHaramM} className="input w-24 py-1.5" /></label>
                <select name="distanceUnit" defaultValue={l.distanceToHaramM >= 1000 ? "km" : "m"} className="input w-20 py-1.5"><option value="m">m</option><option value="km">km</option></select>
                <label className="block"><span className="label">À pied (min)</span><input name="walkMinutes" type="number" min={1} defaultValue={l.walkMinutes ?? ""} className="input w-24 py-1.5" /></label>
                <label className="block"><span className="label">Voiture (min)</span><input name="driveMinutes" type="number" min={1} defaultValue={l.driveMinutes ?? ""} className="input w-24 py-1.5" /></label>
                <button className="btn-secondary btn-sm">{t("common.save")}</button>
              </form>
            </details>
            {(l._count.photos === 0 || displayPrice(l) === 0) && <div className="text-xs font-medium text-brand">⚠️ {l._count.photos === 0 ? t("admin.incompletePhotos") : t("admin.incompletePrice")}</div>}
            <form action={reviewListingAction} className="flex flex-wrap gap-2 pt-2">
              <input type="hidden" name="id" value={l.id} />
              <input name="reason" placeholder={t("admin.reason")} className="input max-w-xs py-1.5" />
              {l.status !== "APPROVED" && <Choice name="decision" value="approve" className="btn-primary btn-sm">{t("admin.approve")}</Choice>}
              {l.status !== "REJECTED" && <Choice name="decision" value="reject" className="btn-secondary btn-sm">{t("admin.reject")}</Choice>}
              {l.status !== "SUSPENDED" && <Choice name="decision" value="suspend" className="btn-secondary btn-sm">{t("admin.suspend")}</Choice>}
              <Choice name="decision" value="delete" className="btn-ghost btn-sm">{t("admin.delete")}</Choice>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}

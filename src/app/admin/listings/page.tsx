import { requireSection } from "@/lib/auth";
import Link from "next/link";
import { Choice } from "@/components/Choice";
import type { ListingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { reviewListingAction } from "@/app/actions/admin";
import { displayPrice } from "@/lib/listings";
import { formatListingPrice } from "@/lib/money";
import { Empty, StatusBadge } from "@/components/ui";

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; incomplete?: string; what?: string }> }) {
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
            {l.photos[0] && <img src={l.photos[0].url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Link href={`/listings/${l.id}`} className="font-medium text-neutral-900">{l.title}</Link>
              <StatusBadge status={l.status} label={t(`lstatus.${l.status}`)} />
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
            {(l._count.photos === 0 || displayPrice(l) === 0) && <div className="text-xs font-medium text-brand">⚠️ {l._count.photos === 0 ? t("admin.incompletePhotos") : t("admin.incompletePrice")}</div>}
            <form action={reviewListingAction} className="flex flex-wrap gap-2 pt-2">
              <input type="hidden" name="id" value={l.id} />
              <input name="reason" placeholder={t("admin.reason")} className="input max-w-xs py-1.5" />
              <Choice name="decision" value="approve" className="btn-primary btn-sm">{t("admin.approve")}</Choice>
              <Choice name="decision" value="reject" className="btn-secondary btn-sm">{t("admin.reject")}</Choice>
              <Choice name="decision" value="suspend" className="btn-secondary btn-sm">{t("admin.suspend")}</Choice>
              <Choice name="decision" value="delete" className="btn-ghost btn-sm">{t("admin.delete")}</Choice>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}

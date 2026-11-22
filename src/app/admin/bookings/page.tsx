import type { BookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { platformRevenue } from "@/lib/stats";
import { StatusBadge } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";
import { CancelForm } from "@/components/CancelForm";

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { t, locale } = await getT();
  const sp = await searchParams;
  const statuses = ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "DECLINED", "EXPIRED"];
  const status = statuses.includes(sp.status ?? "") ? (sp.status as BookingStatus) : undefined;
  const rows = await db.booking.findMany({
    where: { ...(status ? { status } : {}), ...(sp.q ? { OR: [{ code: { contains: sp.q, mode: "insensitive" } }, { guest: { email: { contains: sp.q, mode: "insensitive" } } }] } : {}) },
    include: { listing: { include: { host: true } }, guest: true, bed: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder={`${t("trips.code")} / ${t("auth.email")}`} className="input max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input max-w-[200px]">
          <option value="">{t("common.all")}</option>
          {statuses.map((s) => <option key={s} value={s}>{t(`status.${s}` as never)}</option>)}
        </select>
        <button className="btn-secondary">{t("search.apply")}</button>
      </form>
      <div className="space-y-3">
        {rows.map((b) => (
          <div key={b.id} className="card space-y-2 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium"><span dir="ltr">{b.code}</span> · {b.listing.title}{b.bed ? ` · ${b.bed.label}` : ""}</div>
                <div className="text-neutral-600">{b.guest.name} → {b.listing.host.name} · {fmtDay(b.checkIn, locale)} → {fmtDay(b.checkOut, locale)}</div>
              </div>
              <StatusBadge status={b.status} label={t(`status.${b.status}`)} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-neutral-700">
              <span>{t("book.total")}: {formatMoney(b.total, locale)}</span>
              <span>{t("admin.onlineReceived")}: {formatMoney(b.onlineAmount, locale)}</span>
              <span>{t("book.onSite")}: {formatMoney(b.payOnSite, locale)}</span>
              <span>{t("admin.commissions")}: {formatMoney(platformRevenue(b), locale)}</span>
              {b.refundedAmount > 0 && <span className="text-brand">{t("admin.refundsTotal")}: {formatMoney(b.refundedAmount, locale)}</span>}
              {b.cancelledBy && <span>({b.cancelledBy}{b.cancelReason ? `: ${b.cancelReason}` : ""})</span>}
            </div>
            {["REQUESTED", "CONFIRMED"].includes(b.status) && !b.payoutId && <CancelForm bookingId={b.id} label={t("admin.cancelRefund")} admin />}
          </div>
        ))}
      </div>
    </div>
  );
}

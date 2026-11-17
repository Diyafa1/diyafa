import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { todayUTC } from "@/lib/dates";
import { Empty, StatusBadge } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";
import { CancelForm } from "@/components/CancelForm";
import { RequestActions } from "../request-actions";
import { openDisputeAction } from "@/app/actions/reviews";

export default async function HostBookings() {
  const user = await requireRole("HOST");
  const { t, locale } = await getT();
  const rows = await db.booking.findMany({
    where: { listing: { hostId: user.id }, status: { notIn: ["EXPIRED", "PENDING_PAYMENT"] } },
    include: { listing: true, guest: true, bed: { include: { room: true } } },
    orderBy: { checkIn: "desc" },
    take: 200,
  });
  if (!rows.length) return <Empty>—</Empty>;
  return (
    <ul className="space-y-3">
      {rows.map((b) => (
        <li key={b.id} className="card space-y-2 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-medium">{b.listing.title}{b.bed ? ` · ${b.bed.room.name} / ${b.bed.label}` : ""}</div>
              <div className="text-neutral-600">{b.code} · {b.guest.name} · {b.guests} · {fmtDay(b.checkIn, locale)} → {fmtDay(b.checkOut, locale)}</div>
            </div>
            <StatusBadge status={b.status} label={t(`status.${b.status}`)} />
          </div>
          <div className="flex flex-wrap gap-4 text-neutral-700">
            <span>{t("earn.gross")}: {formatMoney(b.subtotal, locale)}</span>
            <span>{t("earn.commission")}: −{formatMoney(b.hostCommission, locale)}</span>
            <span className="font-medium">{t("earn.net")}: {formatMoney(b.hostPayout, locale)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {b.status === "REQUESTED" && <RequestActions bookingId={b.id} />}
            {b.status === "CONFIRMED" && b.checkIn > todayUTC() && !b.payoutId && <CancelForm bookingId={b.id} label={t("host.cancel")} />}
            {["CONFIRMED", "COMPLETED"].includes(b.status) && (
              <details>
                <summary className="btn-ghost btn-sm cursor-pointer">{t("trips.dispute")}</summary>
                <form action={openDisputeAction} className="mt-2 flex gap-2">
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input name="reason" required minLength={5} placeholder={t("trips.disputeReason")} className="input" />
                  <button className="btn-secondary btn-sm">{t("common.send")}</button>
                </form>
              </details>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { todayUTC } from "@/lib/dates";
import { Empty, Notice, Stat } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";

export default async function HostEarnings() {
  const user = await requireRole("HOST");
  const { t, locale } = await getT();
  const rows = await db.booking.findMany({
    where: { listing: { hostId: user.id }, status: { in: ["CONFIRMED", "COMPLETED"] } },
    include: { listing: { select: { title: true } } },
    orderBy: { checkIn: "desc" },
  });
  const gross = rows.reduce((s, b) => s + b.subtotal, 0);
  const commission = rows.reduce((s, b) => s + b.hostCommission, 0);
  const net = rows.reduce((s, b) => s + b.payOnSite, 0);
  const upcoming = rows.filter((b) => b.checkIn >= todayUTC()).reduce((s, b) => s + b.payOnSite, 0);
  return (
    <div className="space-y-8">
      <Notice>{t("earn.commissionNote")}</Notice>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("earn.gross")} value={formatMoney(gross, locale)} />
        <Stat label={t("earn.commission")} value={formatMoney(commission, locale)} />
        <Stat label={t("earn.onSite")} value={formatMoney(net, locale)} />
        <Stat label={t("earn.toCollect")} value={formatMoney(upcoming, locale)} />
      </div>
      <section>
        <h2 className="mb-3 text-lg">{t("earn.perBooking")}</h2>
        {rows.length === 0 ? <Empty>—</Empty> : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>{t("trips.code")}</th><th>{t("search.checkIn")}</th><th>{t("earn.gross")}</th><th>{t("earn.commission")}</th><th>{t("earn.onSite")}</th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td><div dir="ltr">{b.code}</div><div className="text-xs text-neutral-500">{b.listing.title}</div></td>
                    <td>{fmtDay(b.checkIn, locale)}</td>
                    <td>{formatMoney(b.subtotal, locale)}</td>
                    <td>−{formatMoney(b.hostCommission, locale)}</td>
                    <td className="font-medium">{formatMoney(b.payOnSite, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

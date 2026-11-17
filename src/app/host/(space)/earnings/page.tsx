import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatSAR } from "@/lib/money";
import { Empty, Stat, StatusBadge } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";

export default async function HostEarnings() {
  const user = await requireRole("HOST");
  const { t, locale } = await getT();
  const earning = { listing: { hostId: user.id }, status: { in: ["CONFIRMED", "COMPLETED", "CANCELLED"] as ("CONFIRMED" | "COMPLETED" | "CANCELLED")[] }, hostPayout: { gt: 0 } };
  const [rows, payouts] = await Promise.all([
    db.booking.findMany({ where: earning, include: { listing: { select: { title: true } } }, orderBy: { checkIn: "desc" } }),
    db.payout.findMany({ where: { hostId: user.id }, include: { _count: { select: { bookings: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  const grossKept = rows.reduce((s, b) => s + b.hostPayout + b.hostCommission, 0);
  const commission = rows.reduce((s, b) => s + b.hostCommission, 0);
  const net = rows.reduce((s, b) => s + b.hostPayout, 0);
  const paid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label={t("earn.gross")} value={formatSAR(grossKept, locale)} />
        <Stat label={t("earn.commission")} value={formatSAR(commission, locale)} />
        <Stat label={t("earn.net")} value={formatSAR(net, locale)} />
        <Stat label={t("earn.paid")} value={formatSAR(paid, locale)} />
        <Stat label={t("earn.pending")} value={formatSAR(net - paid, locale)} />
      </div>
      <section>
        <h2 className="mb-3 text-lg">{t("earn.history")}</h2>
        {payouts.length === 0 ? <Empty>{t("earn.noPayouts")}</Empty> : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>{t("common.date")}</th><th>{t("common.amount")}</th><th>{t("admin.bookings")}</th><th>{t("earn.reference")}</th><th>{t("common.status")}</th></tr></thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDay(p.paidAt ?? p.createdAt, locale)}</td>
                    <td>{formatSAR(p.amount, locale)}</td>
                    <td>{p._count.bookings}</td>
                    <td dir="ltr">{p.reference ?? "—"}</td>
                    <td><StatusBadge status={p.status} label={p.status === "PAID" ? t("earn.paid") : t("earn.pending")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-lg">{t("earn.perBooking")}</h2>
        {rows.length === 0 ? <Empty>—</Empty> : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>{t("trips.code")}</th><th>{t("search.checkIn")}</th><th>{t("earn.gross")}</th><th>{t("earn.commission")}</th><th>{t("earn.net")}</th><th>{t("admin.payouts")}</th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td><div dir="ltr">{b.code}</div><div className="text-xs text-neutral-500">{b.listing.title}</div></td>
                    <td>{fmtDay(b.checkIn, locale)}</td>
                    <td>{formatSAR(b.hostPayout + b.hostCommission, locale)}</td>
                    <td>−{formatSAR(b.hostCommission, locale)}</td>
                    <td className="font-medium">{formatSAR(b.hostPayout, locale)}</td>
                    <td>{b.payoutId ? "✓" : "—"}</td>
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

import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { owedByHost } from "@/lib/payouts";
import { createPayoutAction, markPayoutPaidAction } from "@/app/actions/admin";
import { Empty, StatusBadge } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";

export default async function AdminPayouts() {
  const { t, locale } = await getT();
  const owed = await owedByHost();
  const hosts = await db.user.findMany({ where: { id: { in: [...owed.keys()] } }, include: { hostProfile: true } });
  const payouts = await db.payout.findMany({ include: { host: { include: { hostProfile: true } }, _count: { select: { bookings: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 300 });
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg">{t("admin.owedHosts")}</h2>
        {hosts.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>{t("role.HOST")}</th><th>{t("host.iban")}</th><th>{t("admin.bookings")}</th><th>{t("common.amount")}</th><th></th></tr></thead>
              <tbody>
                {hosts.map((h) => (
                  <tr key={h.id}>
                    <td>{h.hostProfile?.displayName ?? h.name}<div className="text-xs text-neutral-500" dir="ltr">{h.email}</div></td>
                    <td dir="ltr">{h.hostProfile?.iban ?? "—"}<div className="text-xs text-neutral-500">{h.hostProfile?.bankName}</div></td>
                    <td>{owed.get(h.id)!.count}</td>
                    <td className="font-semibold">{formatMoney(owed.get(h.id)!.amount, locale)}</td>
                    <td>
                      <form action={createPayoutAction}><input type="hidden" name="hostId" value={h.id} /><button className="btn-primary btn-sm">{t("admin.createPayout")}</button></form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-lg">{t("earn.history")}</h2>
        {payouts.length === 0 ? <Empty>{t("earn.noPayouts")}</Empty> : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>{t("common.date")}</th><th>{t("role.HOST")}</th><th>{t("common.amount")}</th><th>{t("admin.bookings")}</th><th>{t("common.status")}</th><th></th></tr></thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDay(p.paidAt ?? p.createdAt, locale)}</td>
                    <td>{p.host.hostProfile?.displayName ?? p.host.name}<div className="text-xs text-neutral-500" dir="ltr">{p.host.hostProfile?.iban}</div></td>
                    <td className="font-medium">{formatMoney(p.amount, locale)}</td>
                    <td>{p._count.bookings}</td>
                    <td><StatusBadge status={p.status} label={p.status === "PAID" ? t("earn.paid") : t("earn.pending")} /></td>
                    <td>
                      {p.status === "PENDING" ? (
                        <form action={markPayoutPaidAction} className="flex gap-1">
                          <input type="hidden" name="id" value={p.id} />
                          <input name="reference" placeholder={t("earn.reference")} className="input w-32 py-1" />
                          <button className="btn-primary btn-sm">{t("admin.markPaid")}</button>
                        </form>
                      ) : <span dir="ltr" className="text-xs">{p.reference}</span>}
                    </td>
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

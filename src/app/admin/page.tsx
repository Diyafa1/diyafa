import Link from "next/link";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { dashboardStats, occupancy30 } from "@/lib/stats";
import { completeFinishedStays, expireStaleHolds } from "@/lib/bookings";
import { Stat } from "@/components/ui";
import { createDemoListingAction } from "@/app/actions/admin";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { autoDeclineStaleRequests } from "@/lib/automations";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const { t, locale } = await getT();
  const sp = await searchParams;
  await expireStaleHolds();
  await completeFinishedStays();
  await autoDeclineStaleRequests();
  if (!can(user, "finances")) {
    const [hosts, listings, disputes, reported] = await Promise.all([
      db.hostProfile.count({ where: { status: "PENDING" } }),
      db.listing.count({ where: { status: "PENDING" } }),
      db.dispute.count({ where: { status: "OPEN" } }),
      db.message.count({ where: { reported: true, hidden: false } }),
    ]);
    const items = [
      { ok: can(user, "hosts"), href: "/admin/hosts?status=PENDING", label: t("admin.hosts"), n: hosts },
      { ok: can(user, "listings"), href: "/admin/listings?status=PENDING", label: t("admin.listings"), n: listings },
      { ok: can(user, "disputes"), href: "/admin/disputes", label: t("admin.disputes"), n: disputes },
      { ok: can(user, "moderation"), href: "/admin/moderation", label: t("admin.reportedMessages"), n: reported },
    ].filter((i) => i.ok);
    return (
      <div className="space-y-4">
        <p className="text-neutral-700">{t("admin.dashboardStaff")}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="card block p-4 text-neutral-900 no-underline hover:border-brand">
              <div className="text-xs text-neutral-500">{i.label}</div>
              <div className="mt-1 text-2xl font-semibold">{i.n}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  const days = sp.p === "all" ? null : sp.p === "365" ? 365 : 30;
  const [stats, occ, pending] = await Promise.all([
    dashboardStats(days),
    occupancy30(),
    Promise.all([
      db.hostProfile.count({ where: { status: "PENDING" } }),
      db.listing.count({ where: { status: "PENDING" } }),
      db.dispute.count({ where: { status: "OPEN" } }),
      db.message.count({ where: { reported: true, hidden: false } }),
    ]),
  ]);
  const pct = (x: number) => `${Math.round(x * 100)} %`;
  const periods = [["30", "admin.period.30"], ["365", "admin.period.365"], ["all", "admin.period.all"]] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {periods.map(([p, k]) => (
          <Link key={p} href={`/admin?p=${p}`} className={`${(sp.p ?? "30") === p ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>{t(k)}</Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Stat label={t("admin.bookingsCount")} value={stats.totals.bookings} />
        <Stat label={t("admin.revenue")} value={formatMoney(stats.totals.volume, locale)} />
        <Stat label={t("admin.commissions")} value={formatMoney(stats.totals.commissions, locale)} />
        <Stat label={t("admin.onlineReceived")} value={formatMoney(stats.totals.online, locale)} />
        <Stat label={t("admin.occupancy")} value={pct(occ.overall)} />
      </div>

      <section className="card p-4">
        <h2 className="mb-3 text-lg">{t("admin.pendingItems")}</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/hosts" className="btn-secondary btn-sm no-underline">{t("admin.hosts")}: {pending[0]}</Link>
          <Link href="/admin/listings?status=PENDING" className="btn-secondary btn-sm no-underline">{t("admin.listings")}: {pending[1]}</Link>
          <Link href="/admin/disputes" className="btn-secondary btn-sm no-underline">{t("admin.disputes")}: {pending[2]}</Link>
          <Link href="/admin/moderation" className="btn-secondary btn-sm no-underline">{t("admin.reportedMessages")}: {pending[3]}</Link>
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-neutral-600">{t("admin.demoHint")}</p>
        <form action={createDemoListingAction}><button className="btn-secondary btn-sm">{t("admin.demoCreate")}</button></form>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {([["admin.byCity", stats.byCity, occ.byCity, "city"], ["admin.byType", stats.byType, occ.byType, "type"]] as const).map(([title, map, occMap, prefix]) => (
          <section key={title} className="card overflow-x-auto p-4">
            <h2 className="mb-3 text-lg">{t(title)}</h2>
            <table className="table">
              <thead><tr><th></th><th>{t("admin.bookingsCount")}</th><th>{t("admin.revenue")}</th><th>{t("admin.commissions")}</th><th>{t("admin.occupancy")}</th></tr></thead>
              <tbody>
                {(prefix === "city" ? ["MAKKAH", "MADINAH"] : ["SHORT_STAY", "SHARED_BED", "LONG_TERM"]).map((k) => {
                  const a = (map as Map<string, { bookings: number; volume: number; commissions: number }>).get(k);
                  return (
                    <tr key={k}>
                      <td className="font-medium">{t(`${prefix}.${k}` as never)}</td>
                      <td>{a?.bookings ?? 0}</td>
                      <td>{formatMoney(a?.volume ?? 0, locale)}</td>
                      <td>{formatMoney(a?.commissions ?? 0, locale)}</td>
                      <td>{pct(occ.rate(occMap.get(k)))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireSection } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { getNumberSetting } from "@/lib/settings";
import { AUTO_SUSPEND_REASON } from "@/lib/bookings";
import { Empty, Notice } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";
import type { TKey } from "@/lib/i18n";

export default async function AdminCancellations({ searchParams }: { searchParams: Promise<{ by?: string }> }) {
  await requireSection("cancellations");
  const { t, locale } = await getT();
  const sp = await searchParams;
  const BY = ["guest", "host", "admin", "decline", "auto"];
  const by = BY.includes(sp.by ?? "") ? sp.by : undefined;
  const since = new Date(Date.now() - 365 * 86400000);
  const [rows, perHost, limit] = await Promise.all([
    db.booking.findMany({
      where: { status: { in: ["CANCELLED", "DECLINED"] }, ...(by ? { cancelledBy: by } : {}) },
      include: { listing: { include: { host: { include: { hostProfile: true } } } }, guest: true },
      orderBy: [{ cancelledAt: "desc" }, { updatedAt: "desc" }],
      take: 300,
    }),
    db.booking.groupBy({ by: ["listingId"], where: { cancelledBy: "host", status: "CANCELLED", cancelledAt: { gte: since } }, _count: true }),
    getNumberSetting("autoSuspendHostCancellations"),
  ]);
  // per host
  const listings = await db.listing.findMany({ where: { id: { in: perHost.map((p) => p.listingId) } }, select: { id: true, hostId: true } });
  const counts = new Map<string, number>();
  for (const p of perHost) {
    const h = listings.find((l) => l.id === p.listingId)?.hostId;
    if (h) counts.set(h, (counts.get(h) ?? 0) + p._count);
  }
  const hosts = await db.user.findMany({ where: { id: { in: [...counts.keys()] } }, include: { hostProfile: true, listings: { select: { status: true, rejectionReason: true } } } });
  hosts.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg">{t("cancel.hostsTitle")}</h2>
        <Notice>{t("auto.suspend")} : <strong>{limit || "—"}</strong></Notice>
        {hosts.length === 0 ? <div className="mt-3"><Empty>{t("admin.none")}</Empty></div> : (
          <div className="card mt-3 overflow-x-auto">
            <table className="table">
              <thead><tr><th>{t("role.HOST")}</th><th>{t("cancel.count")}</th><th>{t("common.status")}</th></tr></thead>
              <tbody>
                {hosts.map((h) => {
                  const suspended = h.listings.some((l) => l.status === "SUSPENDED" && l.rejectionReason === AUTO_SUSPEND_REASON);
                  return (
                    <tr key={h.id}>
                      <td>{h.hostProfile?.displayName ?? h.name}<div className="text-xs text-neutral-500" dir="ltr">{h.email}</div></td>
                      <td className="font-semibold">{counts.get(h.id)}</td>
                      <td>{suspended ? <Link href="/admin/listings?status=SUSPENDED" className="badge-dark no-underline">{t("cancel.autoSuspended")}</Link> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap gap-2">
          <Link href="?" className={`${!by ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>{t("common.all")}</Link>
          {BY.map((b) => <Link key={b} href={`?by=${b}`} className={`${by === b ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>{t(`cancel.by.${b}` as TKey)}</Link>)}
        </div>
        {rows.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>{t("cancel.when")}</th><th>{t("trips.code")}</th><th>{t("cancel.by")}</th><th>{t("cancel.reason")}</th><th>{t("search.checkIn")}</th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td>{fmtDay(b.cancelledAt ?? b.updatedAt, locale)}</td>
                    <td><div dir="ltr">{b.code}</div><div className="text-xs text-neutral-500">{b.listing.title}</div><div className="text-xs text-neutral-500">{b.guest.name} → {b.listing.host.hostProfile?.displayName ?? b.listing.host.name}</div></td>
                    <td className="font-medium">{b.cancelledBy ? t(`cancel.by.${b.cancelledBy}` as TKey) : b.status === "DECLINED" ? t("cancel.by.decline") : "—"}</td>
                    <td className="max-w-xs">{b.cancelReason || <span className="text-neutral-400">{t("cancel.noReason")}</span>}</td>
                    <td>{fmtDay(b.checkIn, locale)}</td>
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

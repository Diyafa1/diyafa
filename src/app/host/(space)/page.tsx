import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { completeFinishedStays, expireStaleHolds } from "@/lib/bookings";
import { formatSAR } from "@/lib/money";
import { todayUTC } from "@/lib/dates";
import { Empty, Notice, Stat } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";
import { RequestActions } from "./request-actions";

export default async function HostDashboard({ searchParams }: { searchParams: Promise<{ applied?: string }> }) {
  const user = await requireRole("HOST");
  const { t, locale } = await getT();
  const sp = await searchParams;
  await expireStaleHolds();
  await completeFinishedStays();
  const [requests, upcoming, owed, listings] = await Promise.all([
    db.booking.findMany({ where: { listing: { hostId: user.id }, status: "REQUESTED" }, include: { listing: true, guest: true, bed: true }, orderBy: { checkIn: "asc" } }),
    db.booking.findMany({ where: { listing: { hostId: user.id }, status: "CONFIRMED", checkOut: { gt: todayUTC() } }, include: { listing: true, guest: true }, orderBy: { checkIn: "asc" }, take: 10 }),
    db.booking.aggregate({ where: { listing: { hostId: user.id }, payoutId: null, status: { in: ["CONFIRMED", "COMPLETED", "CANCELLED"] } }, _sum: { hostPayout: true } }),
    db.listing.groupBy({ by: ["status"], where: { hostId: user.id }, _count: true }),
  ]);
  const count = (s: string) => listings.find((l) => l.status === s)?._count ?? 0;
  return (
    <div className="space-y-8">
      {sp.applied && <Notice kind="brand">{t("host.pending")}</Notice>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("host.requests")} value={requests.length} />
        <Stat label={t("host.upcoming")} value={upcoming.length} />
        <Stat label={t("earn.pending")} value={formatSAR(owed._sum.hostPayout ?? 0, locale)} />
        <Stat label={t("host.listings")} value={count("APPROVED")} sub={`${t("lstatus.PENDING")}: ${count("PENDING")} · ${t("lstatus.DRAFT")}: ${count("DRAFT")}`} />
      </div>

      <section>
        <h2 className="mb-3 text-lg">{t("host.requests")}</h2>
        {requests.length === 0 ? <Empty>{t("host.noRequests")}</Empty> : (
          <ul className="space-y-3">
            {requests.map((b) => (
              <li key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <div className="font-medium">{b.listing.title}{b.bed ? ` · ${b.bed.label}` : ""}</div>
                  <div className="text-neutral-600">{b.guest.name} · {b.guests} · {fmtDay(b.checkIn, locale)} → {fmtDay(b.checkOut, locale)}</div>
                  <div className="text-neutral-600">{t("earn.net")}: <strong>{formatSAR(b.hostPayout, locale)}</strong></div>
                </div>
                <RequestActions bookingId={b.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg">{t("host.upcoming")}</h2>
        {upcoming.length === 0 ? <Empty>—</Empty> : (
          <div className="card overflow-x-auto">
            <table className="table">
              <tbody>
                {upcoming.map((b) => (
                  <tr key={b.id}>
                    <td>{fmtDay(b.checkIn, locale)} → {fmtDay(b.checkOut, locale)}</td>
                    <td>{b.listing.title}</td>
                    <td>{b.guest.name}</td>
                    <td className="text-end">{formatSAR(b.hostPayout, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link href="/host/bookings" className="link mt-2 inline-block text-sm">{t("host.bookings")} →</Link>
      </section>
    </div>
  );
}

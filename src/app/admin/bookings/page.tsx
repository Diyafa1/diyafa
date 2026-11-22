import Link from "next/link";
import type { BookingStatus } from "@prisma/client";
import { requireSection } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { platformRevenue } from "@/lib/stats";
import { Empty, StatusBadge } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";
import { CancelForm } from "@/components/CancelForm";
import type { TKey } from "@/lib/i18n";

const TABS = ["REQUESTED", "CONFIRMED", "PENDING_PAYMENT", "COMPLETED", "CANCELLED", "DECLINED", "NOT_FOUND"] as const;

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const me = await requireSection("bookings");
  const showMoney = can(me, "finances");
  const canRefund = can(me, "refunds");
  const { t, locale } = await getT();
  const sp = await searchParams;
  const tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? sp.tab! : "ALL";

  const [counts, notFoundCount] = await Promise.all([
    db.booking.groupBy({ by: ["status"], _count: true }),
    db.searchLog.count({ where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } } }),
  ]);
  const count = (s: string) => (s === "NOT_FOUND" ? notFoundCount : counts.find((c) => c.status === s)?._count ?? 0);
  const label = (s: string) => (s === "NOT_FOUND" ? t("req.notFound") : t(`status.${s}` as TKey));

  return (
    <div className="space-y-4">
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
        <Link href="?" className={`${tab === "ALL" ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>{t("common.all")}</Link>
        {TABS.map((s) => (
          <Link key={s} href={`?tab=${s}`} className={`${tab === s ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>
            {label(s)} <span className="opacity-70">({count(s)})</span>
          </Link>
        ))}
      </nav>
      {tab === "NOT_FOUND" ? <NotFound t={t} locale={locale} /> : <BookingList tab={tab} q={sp.q} showMoney={showMoney} canRefund={canRefund} t={t} locale={locale} />}
    </div>
  );
}

async function BookingList({ tab, q, showMoney, canRefund, t, locale }: { tab: string; q?: string; showMoney: boolean; canRefund: boolean; t: Awaited<ReturnType<typeof getT>>["t"]; locale: Awaited<ReturnType<typeof getT>>["locale"] }) {
  const rows = await db.booking.findMany({
    where: {
      ...(tab !== "ALL" ? { status: tab as BookingStatus } : { status: { not: "EXPIRED" } }),
      ...(q ? { OR: [{ code: { contains: q, mode: "insensitive" } }, { guest: { email: { contains: q, mode: "insensitive" } } }, { guest: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    },
    include: { listing: { include: { host: true } }, guest: true, bed: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return (
    <>
      <form className="flex flex-wrap gap-2">
        <input type="hidden" name="tab" value={tab === "ALL" ? "" : tab} />
        <input name="q" defaultValue={q} placeholder={`${t("trips.code")} / ${t("auth.name")} / ${t("auth.email")}`} className="input max-w-sm" />
        <button className="btn-secondary">{t("search.apply")}</button>
      </form>
      {rows.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
        <div className="space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="card space-y-2 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium"><span dir="ltr">{b.code}</span> · {b.listing.title}{b.bed ? ` · ${b.bed.label}` : ""}</div>
                  <div className="text-neutral-600">{b.guest.name} <span dir="ltr">({b.guest.email})</span> → {b.listing.host.name}</div>
                  <div className="text-neutral-600">{fmtDay(b.checkIn, locale)} → {fmtDay(b.checkOut, locale)} · {b.guests} · {t("req.createdOn")} {fmtDay(b.createdAt, locale)}</div>
                </div>
                <StatusBadge status={b.status} label={t(`status.${b.status}`)} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-neutral-700">
                <span>{t("book.totalStay")}: {formatMoney(b.total, locale)}</span>
                {showMoney && <span>{t("admin.onlineReceived")}: {formatMoney(b.onlineAmount, locale)}</span>}
                <span>{t("book.onSite")}: {formatMoney(b.payOnSite, locale)}</span>
                {showMoney && <span>{t("admin.commissions")}: {formatMoney(platformRevenue(b), locale)}</span>}
                {b.refundedAmount > 0 && <span className="text-brand">{t("admin.refundsTotal")}: {formatMoney(b.refundedAmount, locale)}</span>}
                {b.cancelledBy && <span>{t("cancel.by")}: {t(`cancel.by.${b.cancelledBy}` as TKey)}{b.cancelReason ? ` — ${b.cancelReason}` : ""}</span>}
              </div>
              {canRefund && ["REQUESTED", "CONFIRMED"].includes(b.status) && !b.payoutId && <CancelForm bookingId={b.id} label={t("admin.cancelRefund")} admin />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

async function NotFound({ t, locale }: { t: Awaited<ReturnType<typeof getT>>["t"]; locale: Awaited<ReturnType<typeof getT>>["locale"] }) {
  const since = new Date(Date.now() - 90 * 86400000);
  const rows = await db.searchLog.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 300 });
  // What is most often missing (city + type + bed gender)
  const groups = new Map<string, number>();
  for (const r of rows) {
    const k = [r.city ? t(`city.${r.city}`) : "—", r.type ? t(`type.${r.type}`) : t("search.anyType"), r.gender ? t(`gender.${r.gender}`) : ""].filter(Boolean).join(" · ");
    groups.set(k, (groups.get(k) ?? 0) + 1);
  }
  const top = [...groups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600">{t("req.notFoundIntro")}</p>
      {rows.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
        <>
          <div className="card p-4">
            <h2 className="mb-2 text-base">{t("req.mostWanted")}</h2>
            <ul className="space-y-1 text-sm">{top.map(([k, n]) => <li key={k} className="flex justify-between"><span>{k}</span><strong>{n}</strong></li>)}</ul>
          </div>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>{t("common.date")}</th><th>{t("search.city")}</th><th>{t("search.type")}</th><th>{t("search.checkIn")}</th><th>{t("search.checkOut")}</th><th>{t("search.guests")}</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDay(r.createdAt, locale)}</td>
                    <td>{r.city ? t(`city.${r.city}`) : "—"}</td>
                    <td>{r.type ? t(`type.${r.type}`) : "—"}{r.gender ? ` · ${t(`gender.${r.gender}`)}` : ""}</td>
                    <td>{r.checkIn ? fmtDay(r.checkIn, locale) : "—"}</td>
                    <td>{r.checkOut ? fmtDay(r.checkOut, locale) : r.months ? `${r.months} ${t("search.months").toLowerCase()}` : "—"}</td>
                    <td>{r.guests ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

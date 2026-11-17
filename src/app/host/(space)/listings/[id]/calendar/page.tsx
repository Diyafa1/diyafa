import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { ACTIVE_STATUSES, expireStaleHolds } from "@/lib/bookings";
import { addDays, dayKey, parseDay, todayUTC } from "@/lib/dates";
import { CalendarEditor } from "./editor";

export default async function CalendarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireRole("HOST");
  const { t } = await getT();
  const l = await db.listing.findUnique({ where: { id }, include: { rooms: { include: { beds: { where: { active: true } } } } } });
  if (!l || l.hostId !== user.id) notFound();
  await expireStaleHolds();

  const today = todayUTC();
  let start: Date;
  try {
    start = sp.m ? parseDay(`${sp.m}-01`) : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  } catch {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  }
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 2, 1));
  const [days, bookings] = await Promise.all([
    db.calendarDay.findMany({ where: { listingId: l.id, date: { gte: start, lt: end } } }),
    db.booking.findMany({ where: { listingId: l.id, status: { in: [...ACTIVE_STATUSES] }, checkIn: { lt: end }, checkOut: { gt: start } }, select: { checkIn: true, checkOut: true } }),
  ]);
  const booked: Record<string, number> = {};
  for (const b of bookings) for (let d = b.checkIn; d < b.checkOut; d = addDays(d, 1)) booked[dayKey(d)] = (booked[dayKey(d)] ?? 0) + 1;
  const bedCount = l.rooms.reduce((s, r) => s + r.beds.length, 0);
  const prevM = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  const nextM = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)).toISOString().slice(0, 7);

  return (
    <div className="space-y-4">
      <Link href={`/host/listings/${l.id}`} className="text-sm text-neutral-500">← {l.title}</Link>
      <h1 className="text-2xl">{t("cal.title")}</h1>
      <p className="text-sm text-neutral-600">{t("cal.hint")}</p>
      <div className="flex gap-2">
        <Link href={`?m=${prevM}`} className="btn-ghost btn-sm no-underline">{t("cal.prev")}</Link>
        <Link href={`?m=${nextM}`} className="btn-ghost btn-sm no-underline">{t("cal.next")}</Link>
      </div>
      <CalendarEditor
        listingId={l.id}
        start={dayKey(start)}
        today={dayKey(today)}
        basePrice={l.type === "LONG_TERM" ? null : l.pricePerNight}
        bedCount={l.type === "SHARED_BED" ? bedCount : null}
        days={Object.fromEntries(days.map((d) => [dayKey(d.date), { blocked: d.blocked, price: d.price }]))}
        booked={booked}
      />
    </div>
  );
}

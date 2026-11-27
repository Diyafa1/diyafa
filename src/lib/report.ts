import "server-only";
import { db } from "./db";
import { addDays, todayUTC } from "./dates";
import { formatMoney } from "./money";
import { platformRevenue } from "./stats";

export type DailyReport = Awaited<ReturnType<typeof buildReport>>;

/** Activity between `from` (included) and `to` (excluded), plus running totals. Saudi time is UTC+3. */
export async function buildReport(from: Date, to: Date) {
  const inRange = { gte: from, lt: to };
  const [
    newBookings, confirmed, requested, cancelled, declined, completed,
    payments, refunds, newGuests, newHosts, newListings,
    totUsers, totHosts, totListings, totBookings,
    pendingHosts, pendingListings, openDisputes, reported, notFound, newMessages,
  ] = await Promise.all([
    db.booking.count({ where: { createdAt: inRange, status: { notIn: ["EXPIRED", "PENDING_PAYMENT"] } } }),
    db.booking.findMany({ where: { createdAt: inRange, status: "CONFIRMED" }, include: { listing: { select: { title: true, city: true } }, guest: { select: { name: true } } } }),
    db.booking.count({ where: { status: "REQUESTED" } }),
    db.booking.findMany({ where: { cancelledAt: inRange, status: "CANCELLED" }, select: { code: true, cancelledBy: true, cancelReason: true } }),
    db.booking.count({ where: { cancelledAt: inRange, status: "DECLINED" } }),
    db.booking.count({ where: { status: "COMPLETED", checkOut: { gte: from, lte: to } } }),
    db.payment.findMany({ where: { kind: "CHARGE", status: "PAID", updatedAt: inRange } }),
    db.payment.findMany({ where: { kind: "REFUND", createdAt: inRange } }),
    db.user.count({ where: { createdAt: inRange, role: "GUEST" } }),
    db.hostProfile.count({ where: { createdAt: inRange } }),
    db.listing.count({ where: { createdAt: inRange } }),
    db.user.count(),
    db.hostProfile.count({ where: { status: "APPROVED" } }),
    db.listing.count({ where: { status: "APPROVED", paused: false } }),
    db.booking.count({ where: { status: { in: ["CONFIRMED", "COMPLETED"] } } }),
    db.hostProfile.count({ where: { status: "PENDING" } }),
    db.listing.count({ where: { status: "PENDING" } }),
    db.dispute.count({ where: { status: "OPEN" } }),
    db.message.count({ where: { reported: true, hidden: false } }),
    db.searchLog.count({ where: { createdAt: inRange } }),
    db.message.count({ where: { createdAt: inRange, hidden: false } }),
  ]);
  const paidBookings = await db.booking.findMany({ where: { id: { in: payments.map((p) => p.bookingId) } } });
  return {
    from, to,
    newBookings, confirmed, requested, cancelled, declined, completed,
    received: payments.reduce((s, p) => s + p.amount, 0),
    commission: paidBookings.reduce((s, b) => s + platformRevenue({ ...b, refundedAmount: 0 }), 0),
    refunded: refunds.reduce((s, p) => s + p.amount, 0),
    newGuests, newHosts, newListings, newMessages, notFound,
    totals: { users: totUsers, hosts: totHosts, listings: totListings, bookings: totBookings },
    todo: { pendingHosts, pendingListings, openDisputes, reported, requested },
  };
}

/** Yesterday in Makkah time (00:00 → 24:00 UTC+3). */
export function yesterdayRange() {
  const today = todayUTC();
  const end = new Date(today.getTime() - 3 * 3600000);
  return { from: addDays(end, -1), to: end, label: addDays(today, -1) };
}

const BY: Record<string, string> = { guest: "voyageur", host: "hôte", admin: "Al-Diyafa", decline: "refus hôte", auto: "auto" };

/** Content of the morning e-mail (French, for the owner). */
export function reportEmail(r: DailyReport, dayLabel: string) {
  const eur = (n: number) => formatMoney(n, "fr");
  const todo = r.todo;
  const todoLines = [
    todo.pendingHosts && `${todo.pendingHosts} hôte(s) à valider`,
    todo.pendingListings && `${todo.pendingListings} annonce(s) à valider`,
    todo.requested && `${todo.requested} demande(s) en attente de réponse des hôtes`,
    todo.openDisputes && `${todo.openDisputes} litige(s) ouvert(s)`,
    todo.reported && `${todo.reported} message(s) signalé(s)`,
  ].filter(Boolean) as string[];
  return {
    title: `Rapport du ${dayLabel}`,
    intro: "Assalamu alaykum, voici l'activité de Al-Diyafa sur la journée d'hier (heure de La Mecque).",
    rows: [
      ["Nouvelles réservations", String(r.newBookings)],
      ["Confirmées", String(r.confirmed.length)],
      ["Annulées", String(r.cancelled.length)],
      ["Refusées / sans réponse", String(r.declined)],
      ["Séjours terminés", String(r.completed)],
      ["Nouveaux clients inscrits", String(r.newGuests)],
      ["Nouveaux hôtes inscrits", String(r.newHosts)],
      ["Nouvelles annonces", String(r.newListings)],
      ["Messages échangés", String(r.newMessages)],
      ["Recherches sans résultat", String(r.notFound)],
    ] as [string, string][],
    highlight: [
      ["Encaissé en ligne", eur(r.received)],
      ["Remboursé", eur(r.refunded)],
      ["Vos commissions (réservations payées)", eur(r.commission)],
    ] as [string, string][],
    paragraphs: [
      ...(r.confirmed.length ? ["✅ Confirmées : " + r.confirmed.map((b) => `${b.code} — ${b.guest.name} — ${b.listing.title}`).join(" · ")] : []),
      ...(r.cancelled.length ? ["❌ Annulées : " + r.cancelled.map((b) => `${b.code} (${BY[b.cancelledBy ?? ""] ?? "—"}${b.cancelReason ? ` : ${b.cancelReason}` : ""})`).join(" · ")] : []),
      todoLines.length ? "📌 À faire : " + todoLines.join(" · ") : "📌 Rien en attente, tout est à jour.",
      `📊 Au total : ${r.totals.users} comptes · ${r.totals.hosts} hôtes validés · ${r.totals.listings} annonces en ligne · ${r.totals.bookings} réservations confirmées depuis le début.`,
    ],
  };
}

import "server-only";
import { db } from "./db";
import { respondToRequest, completeFinishedStays, expireStaleHolds } from "./bookings";
import { getNumberSetting } from "./settings";
import { emailGuest, emailHost } from "./emails";
import { buildReport, reportEmail, yesterdayRange } from "./report";
import { sendBrandEmail } from "./email";
import { addDays, dayKey, todayUTC } from "./dates";
import { moneyText } from "./money";

/** Requests the host has not answered in time are declined and refunded automatically. */
export async function autoDeclineStaleRequests() {
  const hours = await getNumberSetting("requestAutoDeclineHours");
  if (hours <= 0) return 0;
  const stale = await db.booking.findMany({
    where: { status: "REQUESTED", requestedAt: { lt: new Date(Date.now() - hours * 3600000) } },
    include: { listing: { select: { hostId: true } } },
    take: 50,
  });
  for (const b of stale) {
    try {
      await respondToRequest(b.id, b.listing.hostId, false, `Pas de réponse de l'hôte en ${hours} h`, true);
    } catch (e) {
      console.error("[auto-decline]", b.code, e instanceof Error ? e.message : e);
    }
  }
  return stale.length;
}

/** The day before arrival: reminder to the traveller (time, amount to pay on site) and to the host. */
export async function sendArrivalReminders() {
  const tomorrow = addDays(todayUTC(), 1);
  const list = await db.booking.findMany({
    where: { status: "CONFIRMED", checkIn: tomorrow, reminderSentAt: null },
    include: { guest: true, listing: { include: { host: true, photos: { orderBy: { position: "asc" }, take: 1 } } }, bed: { include: { room: true } } },
    take: 200,
  });
  for (const b of list) {
    await emailGuest(b, "reminder");
    await emailHost(b, "reminder");
    await db.booking.update({ where: { id: b.id }, data: { reminderSentAt: new Date() } });
  }
  return list.length;
}

/** After check-out: ask the traveller for a review. */
export async function askForReviews() {
  const list = await db.booking.findMany({
    where: { status: "COMPLETED", reviewAskedAt: null, review: null, checkOut: { gte: addDays(todayUTC(), -7) } },
    include: { guest: true, listing: { include: { host: true, photos: { orderBy: { position: "asc" }, take: 1 } } }, bed: { include: { room: true } } },
    take: 200,
  });
  const app = process.env.APP_URL || "http://localhost:3000";
  for (const b of list) {
    await emailGuest(b, "review");
    await db.booking.update({ where: { id: b.id }, data: { reviewAskedAt: new Date() } });
  }
  return list.length;
}

/** Morning report for the owner (every admin), sent once a day by the cron. */
export async function sendDailyReport() {
  const { from, to, label } = yesterdayRange();
  const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(label);
  const r = await buildReport(from, to);
  const c = reportEmail(r, day);
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { email: true } });
  const app = (process.env.APP_URL || "").replace(/\/+$/, "");
  for (const a of admins)
    await sendBrandEmail(a.email, `📊 Diyafa — rapport du ${day}`, { locale: "fr", ...c, button: { label: "Ouvrir le tableau de bord", url: `${app}/admin/report` } });
  return admins.length;
}

/** Everything that runs on its own (daily cron + some page loads). */
export async function runAutomations() {
  await expireStaleHolds();
  await completeFinishedStays();
  const declined = await autoDeclineStaleRequests();
  const reminders = await sendArrivalReminders();
  const reviews = await askForReviews();
  return { declined, reminders, reviews };
}

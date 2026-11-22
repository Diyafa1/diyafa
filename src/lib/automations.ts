import "server-only";
import { db } from "./db";
import { respondToRequest, completeFinishedStays, expireStaleHolds } from "./bookings";
import { getNumberSetting } from "./settings";
import { sendEmail } from "./email";
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
    include: { guest: true, listing: { include: { host: true } } },
    take: 200,
  });
  for (const b of list) {
    await sendEmail(b.guest.email, `Diyafa — votre arrivée demain (${b.code})`,
      `${b.listing.title}\n${b.listing.address}\nArrivée à partir de ${b.listing.checkInTime} (heure de La Mecque)\nÀ payer à l'hôte sur place : ${moneyText(b.payOnSite)}\nBon séjour !`);
    await sendEmail(b.listing.host.email, `Diyafa — arrivée demain : ${b.guest.name} (${b.code})`,
      `${b.listing.title}\n${dayKey(b.checkIn)} → ${dayKey(b.checkOut)} · ${b.guests} pers.\nLe voyageur vous paiera sur place : ${moneyText(b.payOnSite)}`);
    await db.booking.update({ where: { id: b.id }, data: { reminderSentAt: new Date() } });
  }
  return list.length;
}

/** After check-out: ask the traveller for a review. */
export async function askForReviews() {
  const list = await db.booking.findMany({
    where: { status: "COMPLETED", reviewAskedAt: null, review: null, checkOut: { gte: addDays(todayUTC(), -7) } },
    include: { guest: true, listing: true },
    take: 200,
  });
  const app = process.env.APP_URL || "http://localhost:3000";
  for (const b of list) {
    await sendEmail(b.guest.email, `Diyafa — comment s'est passé votre séjour ?`, `${b.listing.title}\nLaissez un avis en 1 minute : ${app}/trips/${b.id}\nJazakum Allahu khayran.`);
    await db.booking.update({ where: { id: b.id }, data: { reviewAskedAt: new Date() } });
  }
  return list.length;
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

"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import type { ListingType, Role } from "@prisma/client";
import { requireSection } from "@/lib/auth";
import { PERMISSIONS, type Section } from "@/lib/permissions";
import { setNumberSetting } from "@/lib/settings";
import { db } from "@/lib/db";
import { num, str } from "@/lib/forms";
import { emailSimple } from "@/lib/emails";
import { createPayout } from "@/lib/payouts";
import { parseDay } from "@/lib/dates";
import { normalizeCode } from "@/lib/bookings";
import { moneyText } from "@/lib/money";

const allow = (section: Section) => requireSection(section);
const refresh = () => revalidatePath("/", "layout");

export async function reviewHostAction(fd: FormData) {
  await allow("hosts");
  const p = await db.hostProfile.findUnique({ where: { id: str(fd, "id") }, include: { user: true } });
  if (!p) return;
  const approve = str(fd, "decision") === "approve";
  const reason = str(fd, "reason").slice(0, 500) || null;
  await db.hostProfile.update({
    where: { id: p.id },
    data: approve ? { status: "APPROVED", verifiedAt: new Date(), rejectionReason: null } : { status: "REJECTED", rejectionReason: reason },
  });
  await emailSimple(p.user, approve ? "Diyafa — compte hôte validé ✅" : "Diyafa — demande d'hôte refusée", approve ? "Votre compte hôte est validé ✅" : "Votre demande d'hôte n'a pas été acceptée", approve ? ["Bienvenue parmi les hôtes Diyafa ! Vous pouvez maintenant publier vos annonces."] : [`Raison : ${reason ?? "—"}`, "Vous pouvez corriger votre demande et la renvoyer."], { label: approve ? "Publier une annonce" : "Corriger ma demande", url: `${process.env.APP_URL || ""}${approve ? "/host/listings/new" : "/host/onboarding"}` });
  refresh();
}

export async function reviewListingAction(fd: FormData) {
  await allow("listings");
  const l = await db.listing.findUnique({ where: { id: str(fd, "id") }, include: { host: true } });
  if (!l) return;
  const d = str(fd, "decision");
  const reason = str(fd, "reason").slice(0, 500) || null;
  if (d === "delete") {
    const bookings = await db.booking.count({ where: { listingId: l.id } });
    if (bookings === 0) await db.listing.delete({ where: { id: l.id } });
    else await db.listing.update({ where: { id: l.id }, data: { status: "SUSPENDED", rejectionReason: reason } });
  } else {
    if (d === "approve") {
      const photos = await db.listingPhoto.count({ where: { listingId: l.id } });
      const beds = l.type === "SHARED_BED" ? await db.bed.count({ where: { room: { listingId: l.id }, active: true } }) : 1;
      const priced = l.type === "SHORT_STAY" ? !!l.pricePerNight : l.type === "LONG_TERM" ? !!l.pricePerYear : beds > 0;
      if (!photos || !priced || !beds) redirect(`/admin/listings?incomplete=${l.id}&what=${!photos ? "photos" : !beds ? "beds" : "price"}`);
    }
    const status = d === "approve" ? "APPROVED" : d === "suspend" ? "SUSPENDED" : "REJECTED";
    await db.listing.update({ where: { id: l.id }, data: { status, rejectionReason: status === "APPROVED" ? null : reason } });
    await emailSimple(l.host, `Diyafa — annonce ${status === "APPROVED" ? "publiée ✅" : status === "SUSPENDED" ? "suspendue" : "refusée"}`, status === "APPROVED" ? "Votre annonce est en ligne ✅" : status === "SUSPENDED" ? "Votre annonce est suspendue" : "Votre annonce n'a pas été acceptée", [l.title, ...(reason ? [`Raison : ${reason}`] : [])], { label: status === "APPROVED" ? "Voir mon annonce" : "Modifier mon annonce", url: `${process.env.APP_URL || ""}${status === "APPROVED" ? `/listings/${l.id}` : `/host/listings/${l.id}`}` });
  }
  refresh();
}

export async function userAction(fd: FormData) {
  const me = await allow("users");
  const id = str(fd, "id");
  if (id === me.id) return; // no self-lockout
  const op = str(fd, "op");
  const target = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return;
  if (me.role !== "ADMIN" && (target.role === "ADMIN" || target.role === "STAFF" || op === "role" || op === "delete")) return;
  if (op === "role" && str(fd, "role") === "STAFF") return; // employees are managed on the Staff page
  if (op === "suspend") await db.user.update({ where: { id }, data: { status: "SUSPENDED" } });
  if (op === "activate") await db.user.update({ where: { id }, data: { status: "ACTIVE" } });
  if (op === "role") {
    const role = str(fd, "role") as Role;
    if (["GUEST", "HOST", "ADMIN"].includes(role)) await db.user.update({ where: { id }, data: { role } });
  }
  if (op === "delete") {
    const has = await db.booking.count({ where: { OR: [{ guestId: id }, { listing: { hostId: id } }] } });
    if (has === 0) {
      await db.message.deleteMany({ where: { senderId: id } });
      await db.conversation.deleteMany({ where: { OR: [{ guestId: id }, { hostId: id }] } });
      await db.user.delete({ where: { id } });
    } else await db.user.update({ where: { id }, data: { status: "SUSPENDED" } });
  }
  refresh();
}

export async function saveRatesAction(fd: FormData) {
  await allow("settings");
  for (const type of ["SHORT_STAY", "SHARED_BED", "LONG_TERM"] as ListingType[]) {
    const clamp = (v: number | null, max: number) => (v === null || v < 0 ? 0 : Math.min(v, max));
    const data = {
      hostPercent: clamp(num(fd, `${type}.host`), 50),
      guestFeePercent: clamp(num(fd, `${type}.guest`), 50),
      vatPercent: 0, // no VAT on the site (owner's decision)
    };
    await db.commissionSetting.upsert({ where: { listingType: type }, create: { listingType: type, ...data }, update: data });
  }
  refresh();
}

export async function createPayoutAction(fd: FormData) {
  await allow("payments");
  await createPayout(str(fd, "hostId"));
  refresh();
}

export async function markPayoutPaidAction(fd: FormData) {
  await allow("payments");
  const p = await db.payout.findUnique({ where: { id: str(fd, "id") }, include: { host: true } });
  if (!p || p.status === "PAID") return;
  await db.payout.update({ where: { id: p.id }, data: { status: "PAID", paidAt: new Date(), reference: str(fd, "reference").slice(0, 100) || null } });
  await emailSimple(p.host, "Diyafa — versement effectué", "Versement effectué", [moneyText(p.amount)]);
  refresh();
}

export async function disputeAction(fd: FormData) {
  await allow("disputes");
  const status = str(fd, "status");
  if (!["RESOLVED", "CLOSED", "OPEN"].includes(status)) return;
  const d = await db.dispute.update({
    where: { id: str(fd, "id") },
    data: { status: status as "RESOLVED" | "CLOSED" | "OPEN", resolution: str(fd, "resolution").slice(0, 2000) || null },
    include: { openedBy: true },
  });
  await emailSimple(d.openedBy, "Diyafa — mise à jour de votre signalement", "Mise à jour de votre signalement", [d.resolution ?? status]);
  refresh();
}

export async function moderateAction(fd: FormData) {
  await allow("moderation");
  const kind = str(fd, "kind");
  const id = str(fd, "id");
  const hidden = str(fd, "op") === "hide";
  if (kind === "review") await db.review.update({ where: { id }, data: { hidden } });
  if (kind === "message") await db.message.update({ where: { id }, data: { hidden, reported: hidden ? true : false } });
  refresh();
}

export async function contactHandledAction(fd: FormData) {
  await allow("contact");
  await db.contactMessage.update({ where: { id: str(fd, "id") }, data: { handled: true } });
  refresh();
}

/** Creates a ready-to-book test listing in Madinah (approved demo host), to try bookings and payments. */
export async function createDemoListingAction() {
  await allow("settings");
  const email = "demo-host@diyafa.test";
  let host = await db.user.findUnique({ where: { email } });
  if (!host) {
    host = await db.user.create({
      data: {
        email, name: "Hôte de test", role: "HOST", passwordHash: "!disabled",
        hostProfile: { create: { displayName: "Hôte de test", whatsapp: "+966500000000", idNumber: "TEST", status: "APPROVED", verifiedAt: new Date() } },
      },
    });
  }
  const listing = await db.listing.create({
    data: {
      hostId: host.id, type: "SHORT_STAY", city: "MADINAH", status: "APPROVED",
      title: "Appartement test – Médine (à supprimer)",
      description: "Annonce de test créée depuis l'espace admin pour essayer les réservations et le paiement. À supprimer avant le lancement.",
      address: "Central Area, Madinah", neighborhood: "المنطقة المركزية", distanceToHaramM: 400,
      latitude: 24.4690, longitude: 39.6130, maxGuests: 4, bedrooms: 2, bathrooms: 1,
      amenities: ["wifi", "ac", "elevator", "kitchen", "familyFriendly"],
      pricePerNight: 5000, minNights: 1, instantBook: true, cancellationPolicy: "FLEXIBLE",
      photos: { create: [{ url: "/seed/6.jpg", position: 0 }, { url: "/seed/1.jpg", position: 1 }, { url: "/seed/2.jpg", position: 2 }] },
    },
  });
  redirect(`/listings/${listing.id}`);
}

// ---------- Seasons (automatic price increases) ----------
export async function seasonAction(fd: FormData) {
  await allow("seasons");
  if (str(fd, "op") === "delete") {
    await db.season.delete({ where: { id: str(fd, "id") } }).catch(() => {});
  } else {
    const name = str(fd, "name").slice(0, 60);
    const percent = num(fd, "percent");
    let start: Date, end: Date;
    try {
      start = parseDay(str(fd, "startDate"));
      end = parseDay(str(fd, "endDate"));
    } catch {
      return;
    }
    if (name && percent !== null && percent > 0 && percent <= 300 && end >= start) await db.season.create({ data: { name, startDate: start, endDate: end, percent } });
  }
  refresh();
}

// ---------- Promo codes ----------
export async function promoAction(fd: FormData) {
  await allow("promos");
  const op = str(fd, "op");
  if (op === "toggle") {
    const p = await db.promoCode.findUnique({ where: { id: str(fd, "id") } });
    if (p) await db.promoCode.update({ where: { id: p.id }, data: { active: !p.active } });
  } else {
    const code = normalizeCode(str(fd, "code"));
    const percent = num(fd, "percentOff");
    const maxUses = num(fd, "maxUses");
    const until = str(fd, "validUntil");
    if (/^[A-Z0-9-]{3,20}$/.test(code) && percent !== null && percent > 0 && percent <= 100) {
      await db.promoCode
        .create({ data: { code, percentOff: percent, maxUses: maxUses && maxUses > 0 ? Math.round(maxUses) : null, validUntil: until ? parseDay(until) : null, note: str(fd, "note").slice(0, 100) || null } })
        .catch(() => {});
    }
  }
  refresh();
}

// ---------- Staff (owner only) ----------
export async function staffAction(fd: FormData) {
  const me = await allow("staff");
  const op = str(fd, "op");
  if (op === "add") {
    const email = str(fd, "email").toLowerCase();
    const u = await db.user.findUnique({ where: { email } });
    if (!u) redirect("/admin/staff?error=notfound");
    if (u.id === me.id || u.role === "ADMIN") redirect("/admin/staff");
    await db.user.update({ where: { id: u.id }, data: { role: "STAFF", permissions: [] } });
  } else {
    const u = await db.user.findUnique({ where: { id: str(fd, "id") } });
    if (!u || u.role !== "STAFF") return;
    if (op === "save") {
      const perms = fd.getAll("perm").map(String).filter((p) => (PERMISSIONS as readonly string[]).includes(p));
      await db.user.update({ where: { id: u.id }, data: { permissions: perms } });
    } else if (op === "remove") {
      const isHost = await db.hostProfile.count({ where: { userId: u.id } });
      await db.user.update({ where: { id: u.id }, data: { role: isHost ? "HOST" : "GUEST", permissions: [] } });
    }
  }
  refresh();
}

// ---------- Automation settings (owner only) ----------
export async function automationSettingsAction(fd: FormData) {
  await allow("settings");
  const s = num(fd, "autoSuspendHostCancellations");
  const h = num(fd, "requestAutoDeclineHours");
  if (s !== null && s >= 0 && s <= 50) await setNumberSetting("autoSuspendHostCancellations", Math.round(s));
  if (h !== null && h >= 0 && h <= 240) await setNumberSetting("requestAutoDeclineHours", Math.round(h));
  refresh();
}

// ---------- Reset test data (owner only) ----------
/** Deletes every booking, payment, review, dispute, payout and unmet search: counters and earnings back to zero. */
export async function resetBookingsAction(fd: FormData) {
  await allow("settings");
  if (str(fd, "confirm").toUpperCase() !== "SUPPRIMER") redirect("/admin/reset?error=confirm");
  await db.$transaction([
    db.payment.deleteMany(),
    db.review.deleteMany(),
    db.dispute.deleteMany(),
    db.booking.deleteMany(),
    db.payout.deleteMany(),
    db.searchLog.deleteMany(),
    db.promoCode.updateMany({ data: { uses: 0 } }),
  ]);
  refresh();
  redirect("/admin/reset?done=bookings");
}

/** Deletes the selected listings (or all of them) with their photos, beds, calendar, conversations and bookings. */
export async function deleteListingsAction(fd: FormData) {
  await allow("settings");
  if (str(fd, "confirm").toUpperCase() !== "SUPPRIMER") redirect("/admin/reset?error=confirm");
  const all = fd.get("all") === "on";
  const ids = all ? (await db.listing.findMany({ select: { id: true } })).map((l) => l.id) : fd.getAll("ids").map(String);
  if (!ids.length) redirect("/admin/reset?error=none");
  const bookings = (await db.booking.findMany({ where: { listingId: { in: ids } }, select: { id: true } })).map((b) => b.id);
  await db.$transaction([
    db.payment.deleteMany({ where: { bookingId: { in: bookings } } }),
    db.review.deleteMany({ where: { OR: [{ bookingId: { in: bookings } }, { listingId: { in: ids } }] } }),
    db.dispute.deleteMany({ where: { bookingId: { in: bookings } } }),
    db.booking.deleteMany({ where: { id: { in: bookings } } }),
    db.conversation.deleteMany({ where: { listingId: { in: ids } } }),
    db.listing.deleteMany({ where: { id: { in: ids } } }),
  ]);
  // the built-in demo host is no longer needed once its listings are gone
  await db.user.deleteMany({ where: { email: "demo-host@diyafa.test", listings: { none: {} } } }).catch(() => {});
  refresh();
  redirect(`/admin/reset?done=listings&n=${ids.length}`);
}

export async function sendReportNowAction() {
  await allow("finances");
  const { sendDailyReport } = await import("@/lib/automations");
  await sendDailyReport();
  redirect("/admin/report?sent=1");
}

// ---------- Telegram (owner only) ----------
export async function telegramAction(fd: FormData) {
  await allow("settings");
  const { connectTelegram, sendTelegram } = await import("@/lib/telegram");
  if (str(fd, "op") === "test") {
    const ok = await sendTelegram("🔔 Test Diyafa : les alertes Telegram fonctionnent.");
    redirect(`/admin/settings?telegram=${ok ? "test-ok" : "test-fail"}`);
  }
  const r = await connectTelegram();
  redirect(`/admin/settings?telegram=${r.ok ? "connected" : r.reason}`);
}

/** Admin quick fix of a listing's distance and travel times (e.g. a host typed 4 instead of 4 km). */
export async function fixDistanceAction(fd: FormData) {
  await allow("listings");
  const v = num(fd, "distanceValue");
  const meters = v === null ? null : Math.round(v * (str(fd, "distanceUnit") === "km" ? 1000 : 1));
  const walk = num(fd, "walkMinutes");
  const drive = num(fd, "driveMinutes");
  if (meters === null || meters < 30 || meters > 100000) redirect("/admin/listings?error=distance");
  await db.listing.update({
    where: { id: str(fd, "id") },
    data: { distanceToHaramM: meters, walkMinutes: walk && walk > 0 ? Math.round(walk) : null, driveMinutes: drive && drive > 0 ? Math.round(drive) : null },
  });
  refresh();
}

/** Translates every listing that has no translation yet (or all of them). */
export async function translateAllAction(fd: FormData) {
  await allow("settings");
  const { translateListing } = await import("@/lib/translate");
  const all = str(fd, "scope") === "all";
  const ids = (await db.listing.findMany({ where: all ? {} : { translations: { equals: Prisma.DbNull } }, select: { id: true }, take: 200 })).map((l) => l.id);
  let ok = 0;
  for (const id of ids) if (await translateListing(id)) ok++;
  redirect(`/admin/settings?translated=${ok}&of=${ids.length}`);
}

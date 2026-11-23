"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { City, ListingType, CancellationPolicy, Gender } from "@prisma/client";
import { requireRole, requireUser, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { int, num, str } from "@/lib/forms";
import { savePrivateDoc, savePublicImage, UploadError } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import { notifyOwner } from "@/lib/notify";
import { distanceMeters, HARAM_COORDS } from "@/lib/haram";
import { AMENITIES } from "@/lib/amenities";
import { BookingError, respondToRequest } from "@/lib/bookings";
import { isTime, parseDay } from "@/lib/dates";
import { checkContact } from "@/lib/contact-filter";
import { coordsFromMapsLink } from "@/lib/maps-link";

const t = (type: string) => (type === "LONG_TERM" ? "Location longue durée" : type === "SHARED_BED" ? "Lits" : "Séjour court");
const phoneOk = (p: string | null) => !!p && p.replace(/\D/g, "").length >= 8;
const hasContact = (...texts: (string | null | undefined)[]) => texts.some((x) => x && !checkContact(x).ok);

const file = (fd: FormData, k: string) => {
  const f = fd.get(k);
  return f instanceof File && f.size > 0 ? f : null;
};

// ---------- Host application ----------
export async function hostApplicationAction(formData: FormData) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  const existing = await db.hostProfile.findUnique({ where: { userId: user.id } });
  const schema = z.object({
    displayName: z.string().min(2).max(100),
    whatsapp: z.string().min(8).max(30),
    bio: z.string().max(1000),
    idNumber: z.string().min(5).max(30),
    iban: z.string().max(40),
    bankName: z.string().max(60),
  });
  const p = schema.safeParse({
    displayName: str(formData, "displayName"),
    whatsapp: str(formData, "whatsapp"),
    bio: str(formData, "bio"),
    idNumber: str(formData, "idNumber"),
    iban: str(formData, "iban").replace(/\s/g, "").toUpperCase(),
    bankName: str(formData, "bankName"),
  });
  if (!p.success) redirect("/host/onboarding?error=form");
  if (hasContact(p.data.bio, p.data.displayName)) redirect("/host/onboarding?error=contact");
  let idDocPath = existing?.idDocPath ?? null;
  try {
    const idf = file(formData, "idDoc");
    if (idf) idDocPath = await savePrivateDoc(idf);
  } catch (e) {
    if (e instanceof UploadError) redirect("/host/onboarding?error=upload");
    throw e;
  }
  if (!idDocPath) redirect("/host/onboarding?error=form");
  const data = { ...p.data, bio: p.data.bio || null, iban: p.data.iban || null, bankName: p.data.bankName || null, idDocPath, status: "PENDING" as const, rejectionReason: null };
  await db.hostProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  const updated = await db.user.update({ where: { id: user.id }, data: { role: "HOST" } });
  await startSession(updated); // refresh role in the session cookie
  await notifyOwner("Diyafa — nouvelle demande d'hôte", `${p.data.displayName} (${user.email})`);
  redirect("/host?applied=1");
}

// ---------- Listings ----------
async function ownListing(id: string, hostId: string) {
  const l = await db.listing.findUnique({ where: { id } });
  if (!l || l.hostId !== hostId) redirect("/host/listings");
  return l;
}

async function parseListingForm(fd: FormData) {
  const type = str(fd, "type") as ListingType;
  const city = str(fd, "city") as City;
  let lat = num(fd, "latitude");
  let lng = num(fd, "longitude");
  // a Google Maps link gives the exact position (and therefore the distance)
  const fromLink = str(fd, "mapsLink") ? await coordsFromMapsLink(str(fd, "mapsLink")) : null;
  if (fromLink) ({ lat, lng } = fromLink);
  // distance typed by the host, in metres or kilometres
  const dv = num(fd, "distanceValue");
  let distance = dv === null ? int(fd, "distanceToHaramM") : Math.round(dv * (str(fd, "distanceUnit") === "km" ? 1000 : 1));
  const validCity = ["MAKKAH", "MADINAH"].includes(city);
  if (validCity && lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    // straight-line × 1.3 approximates walking routes
    distance = Math.round(distanceMeters({ lat, lng }, HARAM_COORDS[city]) * 1.3);
  }
  const sar = (k: string) => {
    const v = num(fd, k);
    return v === null || v < 0 ? null : Math.round(v * 100);
  };
  const schema = z.object({
    type: z.enum(["LONG_TERM", "SHORT_STAY", "SHARED_BED"]),
    city: z.enum(["MAKKAH", "MADINAH"]),
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(5000),
    address: z.string().min(3).max(300),
    neighborhood: z.string().max(100).nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    distanceToHaramM: z.number().int().min(30).max(100000),
    driveMinutes: z.number().int().min(1).max(180).nullable(),
    walkMinutes: z.number().int().min(1).max(240).nullable(),
    maxGuests: z.number().int().min(1).max(50),
    bedrooms: z.number().int().min(0).max(50),
    bathrooms: z.number().int().min(0).max(50),
    amenities: z.array(z.enum(AMENITIES)),
    rules: z.string().max(3000).nullable(),
    pricePerNight: z.number().int().nullable(),
    pricePerMonth: z.number().int().nullable(),
    pricePerYear: z.number().int().nullable(),
    allowTwoPayments: z.boolean(),
    ownerPhone: z.string().max(30).nullable(),
    minNights: z.number().int().min(1).max(90),
    minMonths: z.number().int().min(1).max(24),
    instantBook: z.boolean(),
    checkInTime: z.string().refine(isTime),
    checkOutTime: z.string().refine(isTime),
    seasonalPricing: z.boolean(),
    bedGender: z.enum(["MALE", "FEMALE"]).nullable(),
    cancellationPolicy: z.enum(["FLEXIBLE", "MODERATE", "STRICT"]),
  });
  return schema.safeParse({
    type,
    city,
    title: str(fd, "title"),
    description: str(fd, "description"),
    address: str(fd, "address"),
    neighborhood: str(fd, "neighborhood") || null,
    latitude: lat,
    longitude: lng,
    distanceToHaramM: distance ?? -1,
    driveMinutes: int(fd, "driveMinutes"),
    walkMinutes: int(fd, "walkMinutes"),
    maxGuests: int(fd, "maxGuests") ?? 1,
    bedrooms: int(fd, "bedrooms") ?? 1,
    bathrooms: int(fd, "bathrooms") ?? 1,
    amenities: fd.getAll("amenities").map(String).filter((a) => (AMENITIES as readonly string[]).includes(a)),
    rules: str(fd, "rules") || null,
    pricePerNight: sar("pricePerNight"),
    pricePerMonth: null,
    pricePerYear: type === "LONG_TERM" ? sar("pricePerYear") : null,
    allowTwoPayments: type === "LONG_TERM" && fd.get("allowTwoPayments") === "on",
    ownerPhone: type === "LONG_TERM" ? str(fd, "ownerPhone") || null : null,
    minNights: int(fd, "minNights") ?? 1,
    minMonths: int(fd, "minMonths") ?? 1,
    instantBook: fd.get("instantBook") === "on",
    checkInTime: str(fd, "checkInTime") || "15:00",
    checkOutTime: str(fd, "checkOutTime") || "12:00",
    seasonalPricing: fd.get("seasonalPricing") === "on" && type !== "LONG_TERM",
    bedGender: type === "SHARED_BED" && (str(fd, "bedGender") === "MALE" || str(fd, "bedGender") === "FEMALE") ? (str(fd, "bedGender") as Gender) : null,
    cancellationPolicy: (str(fd, "cancellationPolicy") || "MODERATE") as CancellationPolicy,
  });
}

export async function createListingAction(formData: FormData) {
  const user = await requireRole("HOST");
  const p = await parseListingForm(formData);
  if (!p.success) redirect(`/host/listings/new?error=${p.error.issues.some((i) => i.path[0] === "distanceToHaramM") ? "distance" : "form"}`);
  if (p.data.type === "SHARED_BED" && !p.data.bedGender) redirect("/host/listings/new?error=form");
  if ((p.data.type === "SHORT_STAY" && !p.data.pricePerNight) || (p.data.type === "LONG_TERM" && !p.data.pricePerYear)) redirect("/host/listings/new?error=price");
  if (p.data.type === "LONG_TERM" && !phoneOk(p.data.ownerPhone)) redirect("/host/listings/new?error=ownerPhone");
  if (hasContact(p.data.title, p.data.description, p.data.rules, p.data.neighborhood)) redirect("/host/listings/new?error=contact");
  const l = await db.listing.create({ data: { ...p.data, hostId: user.id, status: "DRAFT" } });
  redirect(`/host/listings/${l.id}?saved=1`);
}

export async function updateListingAction(formData: FormData) {
  const user = await requireRole("HOST");
  const l = await ownListing(str(formData, "id"), user.id);
  const p = await parseListingForm(formData);
  if (!p.success) redirect(`/host/listings/${l.id}?error=${p.error.issues.some((i) => i.path[0] === "distanceToHaramM") ? "distance" : "form"}`);
  if (l.type === "SHARED_BED" && !p.data.bedGender) redirect(`/host/listings/${l.id}?error=form`);
  if ((l.type === "SHORT_STAY" && !p.data.pricePerNight) || (l.type === "LONG_TERM" && !p.data.pricePerYear)) redirect(`/host/listings/${l.id}?error=price`);
  if (l.type === "LONG_TERM" && !phoneOk(p.data.ownerPhone)) redirect(`/host/listings/${l.id}?error=ownerPhone`);
  if (l.type === "SHARED_BED" && p.data.bedGender !== l.bedGender) {
    // Switching men ↔ women is only possible when no traveller is booked
    const active = await db.booking.count({ where: { listingId: l.id, status: { in: ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"] } } });
    if (active) redirect(`/host/listings/${l.id}?error=genderLocked`);
    await db.room.updateMany({ where: { listingId: l.id }, data: { gender: p.data.bedGender! } });
  }
  if (hasContact(p.data.title, p.data.description, p.data.rules, p.data.neighborhood)) redirect(`/host/listings/${l.id}?error=contact`);
  // Type cannot change once created (rooms/beds and bookings depend on it)
  const { type: _type, latitude: _lat, longitude: _lng, ...restAll } = p.data;
  void _lat; void _lng;
  const rest = { ...restAll, ...(p.data.latitude !== null ? { latitude: p.data.latitude, longitude: p.data.longitude } : {}) };
  void _type;
  // Significant edits of a published listing go back to review
  const needsReview = l.status === "APPROVED" && (rest.title !== l.title || rest.address !== l.address);
  await db.listing.update({ where: { id: l.id }, data: { ...rest, ...(needsReview ? { status: "PENDING" } : {}) } });
  if (needsReview) await notifyOwner("✏️ Diyafa — annonce modifiée, à revalider", `${rest.title}\nHôte : ${user.name} (${user.email})\n${process.env.APP_URL || ""}/admin/listings?status=PENDING`);
  revalidatePath(`/listings/${l.id}`);
  redirect(`/host/listings/${l.id}?saved=1`);
}

export async function uploadPhotosAction(formData: FormData) {
  const user = await requireRole("HOST");
  const l = await ownListing(str(formData, "id"), user.id);
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 20);
  let pos = await db.listingPhoto.count({ where: { listingId: l.id } });
  try {
    for (const f of files) {
      const url = await savePublicImage(f);
      await db.listingPhoto.create({ data: { listingId: l.id, url, position: pos++ } });
    }
  } catch (e) {
    if (e instanceof UploadError) redirect(`/host/listings/${l.id}?error=upload`);
    console.error("[storage] photo upload failed:", e instanceof Error ? e.message : e);
    redirect(`/host/listings/${l.id}?error=upload`);
  }
  revalidatePath(`/host/listings/${l.id}`);
}

export async function photoAction(formData: FormData) {
  const user = await requireRole("HOST");
  const l = await ownListing(str(formData, "id"), user.id);
  const photo = await db.listingPhoto.findUnique({ where: { id: str(formData, "photoId") } });
  if (!photo || photo.listingId !== l.id) return;
  if (str(formData, "op") === "delete") await db.listingPhoto.delete({ where: { id: photo.id } });
  if (str(formData, "op") === "cover") {
    const all = await db.listingPhoto.findMany({ where: { listingId: l.id }, orderBy: { position: "asc" } });
    const ordered = [photo, ...all.filter((p) => p.id !== photo.id)];
    await db.$transaction(ordered.map((p, i) => db.listingPhoto.update({ where: { id: p.id }, data: { position: i } })));
  }
  revalidatePath(`/host/listings/${l.id}`);
}

export async function roomAction(formData: FormData) {
  const user = await requireRole("HOST");
  const l = await ownListing(str(formData, "id"), user.id);
  if (l.type !== "SHARED_BED") return;
  const op = str(formData, "op");
  if (op === "addRoom") {
    const name = str(formData, "name").slice(0, 60);
    // every room follows the apartment: men only or women only
    if (name && l.bedGender && !hasContact(name)) await db.room.create({ data: { listingId: l.id, name, gender: l.bedGender } });
  } else if (op === "deleteRoom") {
    const room = await db.room.findFirst({ where: { id: str(formData, "roomId"), listingId: l.id }, include: { beds: { include: { _count: { select: { bookings: true } } } } } });
    if (room && room.beds.every((b) => b._count.bookings === 0)) await db.room.delete({ where: { id: room.id } });
    else if (room) await db.bed.updateMany({ where: { roomId: room.id }, data: { active: false } });
  } else if (op === "addBed") {
    const room = await db.room.findFirst({ where: { id: str(formData, "roomId"), listingId: l.id } });
    const price = num(formData, "price");
    const label = str(formData, "label").slice(0, 40);
    if (hasContact(label)) return;
    if (room && label && price !== null && price > 0) await db.bed.create({ data: { roomId: room.id, label, pricePerNight: Math.round(price * 100) } });
  } else if (op === "toggleBed") {
    const bed = await db.bed.findFirst({ where: { id: str(formData, "bedId"), room: { listingId: l.id } } });
    if (bed) await db.bed.update({ where: { id: bed.id }, data: { active: !bed.active } });
  }
  revalidatePath(`/host/listings/${l.id}`);
}

export async function submitListingAction(formData: FormData) {
  const user = await requireRole("HOST");
  const l = await ownListing(str(formData, "id"), user.id);
  const photos = await db.listingPhoto.count({ where: { listingId: l.id } });
  if (!photos) redirect(`/host/listings/${l.id}?error=photos`);
  if (l.type === "SHARED_BED") {
    const beds = await db.bed.count({ where: { room: { listingId: l.id }, active: true } });
    if (!beds) redirect(`/host/listings/${l.id}?error=beds`);
  } else if (l.type === "LONG_TERM" && !phoneOk(l.ownerPhone)) {
    redirect(`/host/listings/${l.id}?error=ownerPhone`);
  } else if ((l.type === "LONG_TERM" && !l.pricePerYear) || (l.type === "SHORT_STAY" && !l.pricePerNight)) {
    redirect(`/host/listings/${l.id}?error=price`);
  }
  if (!["DRAFT", "REJECTED"].includes(l.status)) redirect(`/host/listings/${l.id}`);
  await db.listing.update({ where: { id: l.id }, data: { status: "PENDING", rejectionReason: null } });
  await notifyOwner("🏠 Diyafa — nouvelle annonce à valider", `${l.title}\n${t(l.type)} · ${l.city === "MAKKAH" ? "Makkah" : "Madinah"}\nHôte : ${user.name} (${user.email})\nÀ valider : ${process.env.APP_URL || ""}/admin/listings?status=PENDING`);
  redirect(`/host/listings/${l.id}?submitted=1`);
}

// ---------- Calendar ----------
export async function calendarAction(formData: FormData) {
  const user = await requireRole("HOST");
  const l = await ownListing(str(formData, "id"), user.id);
  const days = str(formData, "days").split(",").filter(Boolean).slice(0, 400);
  const op = str(formData, "op");
  const price = num(formData, "price");
  const dates: Date[] = [];
  for (const d of days) {
    try {
      dates.push(parseDay(d));
    } catch {
      /* ignore */
    }
  }
  for (const date of dates) {
    const where = { listingId_date: { listingId: l.id, date } };
    if (op === "block") await db.calendarDay.upsert({ where, create: { listingId: l.id, date, blocked: true }, update: { blocked: true } });
    if (op === "unblock") await db.calendarDay.updateMany({ where: { listingId: l.id, date }, data: { blocked: false } });
    if (op === "price" && price !== null && price > 0) {
      const p = Math.round(price * 100);
      await db.calendarDay.upsert({ where, create: { listingId: l.id, date, price: p }, update: { price: p } });
    }
    if (op === "resetPrice") await db.calendarDay.updateMany({ where: { listingId: l.id, date }, data: { price: null } });
  }
  await db.calendarDay.deleteMany({ where: { listingId: l.id, blocked: false, price: null } });
  revalidatePath(`/host/listings/${l.id}/calendar`);
}

// ---------- Requests ----------
export async function respondAction(formData: FormData) {
  const user = await requireRole("HOST");
  try {
    await respondToRequest(str(formData, "bookingId"), user.id, str(formData, "decision") === "accept");
  } catch (e) {
    if (!(e instanceof BookingError)) throw e;
  }
  revalidatePath("/host");
  revalidatePath("/host/bookings");
}

/** Pause / resume a listing (hidden from search and not bookable while paused). */
export async function pauseListingAction(formData: FormData) {
  const user = await requireRole("HOST");
  const l = await ownListing(str(formData, "id"), user.id);
  await db.listing.update({ where: { id: l.id }, data: { paused: !l.paused } });
  revalidatePath("/host/listings");
  revalidatePath(`/host/listings/${l.id}`);
  revalidatePath(`/listings/${l.id}`);
}

/** Block or unblock a whole period at once (from … to … included). */
export async function calendarRangeAction(formData: FormData) {
  const user = await requireRole("HOST");
  const l = await ownListing(str(formData, "id"), user.id);
  let from: Date, to: Date;
  try {
    from = parseDay(str(formData, "from"));
    to = parseDay(str(formData, "to"));
  } catch {
    redirect(`/host/listings/${l.id}/calendar?error=dates`);
  }
  if (to < from || (to.getTime() - from.getTime()) / 86400000 > 366) redirect(`/host/listings/${l.id}/calendar?error=dates`);
  const block = str(formData, "op") !== "unblock";
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = new Date(d);
    if (block) await db.calendarDay.upsert({ where: { listingId_date: { listingId: l.id, date } }, create: { listingId: l.id, date, blocked: true }, update: { blocked: true } });
    else await db.calendarDay.updateMany({ where: { listingId: l.id, date }, data: { blocked: false } });
  }
  await db.calendarDay.deleteMany({ where: { listingId: l.id, blocked: false, price: null } });
  revalidatePath(`/host/listings/${l.id}/calendar`);
  redirect(`/host/listings/${l.id}/calendar?m=${str(formData, "from").slice(0, 7)}&saved=${block ? "blocked" : "unblocked"}`);
}

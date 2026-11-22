/* Demo data. Run with: npm run db:seed  (wipes and recreates everything) */
import { PrismaClient, type ListingType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeQuote, DEFAULT_RATES } from "../src/lib/pricing";

const db = new PrismaClient();
const day = (offset: number) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
};

async function main() {
  // wipe (order matters)
  await db.$transaction([
    db.message.deleteMany(), db.conversation.deleteMany(), db.review.deleteMany(), db.dispute.deleteMany(),
    db.payment.deleteMany(), db.booking.deleteMany(), db.payout.deleteMany(), db.favorite.deleteMany(),
    db.calendarDay.deleteMany(), db.bed.deleteMany(), db.room.deleteMany(), db.listingPhoto.deleteMany(),
    db.listing.deleteMany(), db.hostProfile.deleteMany(), db.user.deleteMany(), db.commissionSetting.deleteMany(),
    db.emailLog.deleteMany(), db.contactMessage.deleteMany(), db.season.deleteMany(), db.promoCode.deleteMany(), db.passwordReset.deleteMany(),
  ]);

  for (const [type, r] of Object.entries(DEFAULT_RATES))
    await db.commissionSetting.create({ data: { listingType: type as ListingType, ...r } });

  const pw = (p: string) => bcrypt.hashSync(p, 10);
  await db.user.create({ data: { email: "admin@diyafa.test", name: "مدير ضيافة", passwordHash: pw("Admin12345!"), role: "ADMIN" } });
  const host = await db.user.create({
    data: {
      email: "host@diyafa.test", name: "عبدالله الحربي", phone: "+966500000001", passwordHash: pw("Host12345!"), role: "HOST",
      hostProfile: { create: { displayName: "عبدالله", whatsapp: "+966500000001", licenseNumber: "MT-73100245", idNumber: "1012345678", iban: "SA0380000000608010167519", bankName: "Al Rajhi", status: "APPROVED", verifiedAt: new Date(), bio: "مضيف في مكة والمدينة منذ 10 سنوات." } },
    },
  });
  const host2 = await db.user.create({
    data: {
      email: "host2@diyafa.test", name: "فاطمة الأنصاري", passwordHash: pw("Host12345!"), role: "HOST",
      hostProfile: { create: { displayName: "دار الأنصار", whatsapp: "+966500000002", licenseNumber: "MT-73200981", idNumber: "1098765432", status: "APPROVED", verifiedAt: new Date() } },
    },
  });
  await db.user.create({
    data: {
      email: "pending@diyafa.test", name: "خالد (طلب جديد)", passwordHash: pw("Host12345!"), role: "HOST",
      hostProfile: { create: { displayName: "خالد", whatsapp: "+966500000003", licenseNumber: "MT-00000000", idNumber: "1000000000", status: "PENDING" } },
    },
  });
  await db.user.create({ data: { email: "staff@diyafa.test", name: "Employé démo", passwordHash: pw("Staff12345!"), role: "STAFF", permissions: ["hosts", "listings", "moderation", "bookings"] } });
  const guest = await db.user.create({ data: { email: "guest@diyafa.test", name: "Youssef Benali", passwordHash: pw("Guest12345!"), gender: "MALE", locale: "fr" } });
  const guest2 = await db.user.create({ data: { email: "guest2@diyafa.test", name: "Aisha Rahman", passwordHash: pw("Guest12345!"), gender: "FEMALE", locale: "en" } });

  const base = { amenities: ["wifi", "ac", "elevator", "prayerArea"], status: "APPROVED" as const, cancellationPolicy: "MODERATE" as const };
  const photos = (ids: number[]) => ({ create: ids.map((n, i) => ({ url: `/seed/${n}.jpg`, position: i })) });

  const l1 = await db.listing.create({ data: { ...base, hostId: host.id, type: "SHORT_STAY", city: "MAKKAH", title: "شقة غرفتين في أجياد – إطلالة على الحرم", description: "شقة مفروشة بالكامل على بعد دقائق من المسجد الحرام. غرفتا نوم، صالة، مطبخ صغير.\nFurnished 2-bedroom apartment a few minutes from Masjid al-Haram.", address: "Ajyad St, Makkah", neighborhood: "أجياد", distanceToHaramM: 350, latitude: 21.4195, longitude: 39.8268, maxGuests: 5, bedrooms: 2, bathrooms: 2, licenseNumber: "MT-73100245-01", pricePerNight: 11000, minNights: 2, instantBook: true, seasonalPricing: true, amenities: [...base.amenities, "haramView", "kitchen", "zamzam", "familyFriendly"], photos: photos([6, 1, 2, 5]) } });
  const l2 = await db.listing.create({ data: { ...base, hostId: host.id, type: "SHORT_STAY", city: "MAKKAH", title: "جناح عائلي في العزيزية مع نقل للحرم", description: "جناح واسع للعائلات مع خدمة نقل مجانية إلى الحرم كل ساعة.", address: "Al Aziziyah, Makkah", neighborhood: "العزيزية", distanceToHaramM: 2600, latitude: 21.4060, longitude: 39.8790, maxGuests: 6, bedrooms: 3, bathrooms: 2, licenseNumber: "MT-73100245-02", pricePerNight: 7500, cancellationPolicy: "FLEXIBLE", amenities: [...base.amenities, "shuttle", "parking", "kitchen", "washer"], photos: photos([2, 1, 5]) } });
  const l3 = await db.listing.create({
    data: {
      ...base, hostId: host.id, type: "SHARED_BED", city: "MAKKAH", title: "سكن مشترك للحجاج والمعتمرين – المسفلة", description: "أسرّة في غرف منفصلة للرجال والنساء، خزائن خاصة، تنظيف يومي.", address: "Misfalah, Makkah", neighborhood: "المسفلة", distanceToHaramM: 700, latitude: 21.4160, longitude: 39.8228, maxGuests: 7, bedrooms: 2, bathrooms: 3, licenseNumber: "MT-73100245-03", instantBook: true, cancellationPolicy: "FLEXIBLE", amenities: [...base.amenities, "lockers", "cleaning", "zamzam"], photos: photos([4, 3]),
      rooms: { create: [
        { name: "غرفة الرجال", gender: "MALE", beds: { create: [1, 2, 3, 4].map((n) => ({ label: `سرير ${n}`, pricePerNight: 2000 })) } },
        { name: "غرفة النساء", gender: "FEMALE", beds: { create: [1, 2, 3].map((n) => ({ label: `سرير ${n}`, pricePerNight: 2200 })) } },
      ] },
    },
  });
  await db.listing.create({ data: { ...base, hostId: host2.id, type: "LONG_TERM", city: "MAKKAH", title: "استوديو للإيجار الشهري – العوالي", description: "استوديو هادئ مناسب للموظفين والطلاب. عقد شهري أو سنوي.", address: "Al Awali, Makkah", neighborhood: "العوالي", distanceToHaramM: 6500, latitude: 21.3720, longitude: 39.8600, maxGuests: 2, bedrooms: 1, bathrooms: 1, licenseNumber: "MT-73200981-01", pricePerMonth: 110000, minMonths: 3, amenities: ["wifi", "ac", "kitchen", "washer", "parking"], photos: photos([1, 5]) } });
  const l5 = await db.listing.create({ data: { ...base, hostId: host2.id, type: "SHORT_STAY", city: "MADINAH", title: "شقة قرب المسجد النبوي – المنطقة المركزية", description: "على بعد 250 مترًا من المسجد النبوي، مناسبة للعائلات.", address: "Central Area, Madinah", neighborhood: "المنطقة المركزية", distanceToHaramM: 250, latitude: 24.4685, longitude: 39.6098, maxGuests: 4, bedrooms: 2, bathrooms: 1, licenseNumber: "MT-73200981-02", pricePerNight: 12500, instantBook: false, cancellationPolicy: "STRICT", amenities: [...base.amenities, "haramView", "familyFriendly", "wheelchair"], photos: photos([6, 2, 1]) } });
  await db.listing.create({
    data: {
      ...base, hostId: host2.id, type: "SHARED_BED", city: "MADINAH", title: "أسرّة في شقة مشتركة – طريق قباء", description: "غرف منفصلة للرجال والنساء على طريق قباء.", address: "Quba Rd, Madinah", neighborhood: "قباء", distanceToHaramM: 1800, latitude: 24.4550, longitude: 39.6140, maxGuests: 6, bedrooms: 2, bathrooms: 2, licenseNumber: "MT-73200981-03", instantBook: true, amenities: ["wifi", "ac", "lockers", "shuttle"], photos: photos([3, 4]),
      rooms: { create: [
        { name: "Men room", gender: "MALE", beds: { create: [1, 2, 3].map((n) => ({ label: `Bed ${n}`, pricePerNight: 1500 })) } },
        { name: "Women room", gender: "FEMALE", beds: { create: [1, 2, 3].map((n) => ({ label: `Bed ${n}`, pricePerNight: 1500 })) } },
      ] },
    },
  });
  await db.listing.create({ data: { ...base, hostId: host2.id, type: "LONG_TERM", city: "MADINAH", title: "شقة 3 غرف للإيجار السنوي – العزيزية", description: "شقة عائلية واسعة، عقد سنوي.", address: "Al Aziziyah, Madinah", distanceToHaramM: 4200, maxGuests: 6, bedrooms: 3, bathrooms: 2, licenseNumber: "MT-73200981-04", pricePerMonth: 145000, minMonths: 12, amenities: ["ac", "kitchen", "parking", "washer", "familyFriendly"], photos: photos([5, 1, 2]) } });
  await db.listing.create({ data: { ...base, status: "PENDING", hostId: host.id, type: "SHORT_STAY", city: "MADINAH", title: "شقة جديدة بانتظار الاعتماد", description: "إعلان تجريبي بانتظار مراجعة الإدارة.", address: "Madinah", distanceToHaramM: 900, maxGuests: 3, licenseNumber: "MT-73100245-09", pricePerNight: 8500, photos: photos([2]) } });

  // Some history for the dashboards
  const book = async (listingId: string, guestId: string, offIn: number, nights: number, status: "COMPLETED" | "CONFIRMED" | "REQUESTED", nightly: number, type: ListingType, bedId?: string) => {
    const q = computeQuote(nightly * nights, DEFAULT_RATES[type]);
    const r = DEFAULT_RATES[type];
    const b = await db.booking.create({
      data: {
        code: `DY-DEMO${Math.random().toString(16).slice(2, 6).toUpperCase()}`, guestId, listingId, bedId, unitKey: bedId ?? listingId,
        checkIn: day(offIn), checkOut: day(offIn + nights), nights, guests: 2, status,
        subtotal: q.subtotal, serviceFee: q.serviceFee, vat: q.vat, total: q.total, onlineAmount: q.onlineAmount, payOnSite: q.payOnSite, hostCommission: q.hostCommission, hostPayout: q.hostPayout,
        hostPercent: r.hostPercent, guestFeePercent: r.guestFeePercent, vatPercent: r.vatPercent, cancellationPolicy: "MODERATE",
      },
    });
    await db.payment.create({ data: { bookingId: b.id, provider: "test", providerRef: `test_seed_${b.id}`, amount: b.onlineAmount, status: "PAID" } });
    return b;
  };
  const past = await book(l1.id, guest.id, -20, 4, "COMPLETED", 11000, "SHORT_STAY");
  await db.review.create({ data: { bookingId: past.id, listingId: l1.id, authorId: guest.id, rating: 5, comment: "Très proche du Haram, appartement propre et hôte très réactif. Je recommande !", hostReply: "جزاكم الله خيرًا، أهلًا بكم دائمًا" } });
  const past2 = await book(l5.id, guest2.id, -12, 3, "COMPLETED", 12500, "SHORT_STAY");
  await db.review.create({ data: { bookingId: past2.id, listingId: l5.id, authorId: guest2.id, rating: 4, comment: "Great location, just a short walk to the Prophet's Mosque." } });
  const bedId = (await db.bed.findFirst({ where: { room: { listingId: l3.id, gender: "MALE" } } }))!.id;
  await book(l3.id, guest.id, -5, 3, "COMPLETED", 2000, "SHARED_BED", bedId);
  await book(l1.id, guest2.id, 10, 3, "CONFIRMED", 11000, "SHORT_STAY");
  await book(l5.id, guest.id, 20, 2, "REQUESTED", 12500, "SHORT_STAY");
  await book(l2.id, guest.id, -2, 5, "CONFIRMED", 7500, "SHORT_STAY");

  const convo = await db.conversation.create({ data: { listingId: l1.id, guestId: guest.id, hostId: host.id } });
  await db.message.createMany({ data: [
    { conversationId: convo.id, senderId: guest.id, body: "Assalamu alaykum, est-ce qu'il y a un ascenseur ?" },
    { conversationId: convo.id, senderId: host.id, body: "وعليكم السلام، نعم يوجد مصعد. Yes, there is an elevator." },
  ] });

  await db.season.create({ data: { name: "Ramadan 2027", startDate: new Date("2027-02-08"), endDate: new Date("2027-03-09"), percent: 30 } });
  await db.promoCode.create({ data: { code: "BIENVENUE10", percentOff: 10, note: "Démo" } });
  console.log("✅ Demo data created");
}

main().finally(() => db.$disconnect());

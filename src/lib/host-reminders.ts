import "server-only";
import { db } from "./db";
import { emailSimple } from "./emails";

type Lang = "fr" | "en" | "ar";
const lang = (l?: string | null): Lang => (l === "en" || l === "ar" ? l : "fr");

/** Hosts who signed up but have no listing online or waiting for review (drafts don't count). */
export async function hostsWithoutListing() {
  const users = await db.user.findMany({
    where: { role: "HOST", status: "ACTIVE", listings: { none: { status: { in: ["PENDING", "APPROVED", "SUSPENDED"] } } } },
    include: { hostProfile: true, _count: { select: { listings: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  // Waiting for our approval or refused: nothing to ask them for now
  return users.filter((u) => !u.hostProfile || u.hostProfile.status === "APPROVED");
}

const TEXT: Record<Lang, { subject: string; profile: { title: string; p: string[]; btn: string }; listing: { title: string; p: string[]; btn: string } }> = {
  fr: {
    subject: "Al-Diyafa — votre logement attend les pèlerins 🕋",
    profile: { title: "Il ne manque plus grand-chose", p: ["Vous avez créé votre compte hôte sur Al-Diyafa, merci pour votre confiance.", "Pour recevoir vos premières réservations, terminez votre profil d'hôte : cela prend 3 minutes."], btn: "Terminer mon profil" },
    listing: { title: "Ajoutez votre logement", p: ["Votre compte hôte est validé ✅, mais vous n'avez pas encore publié de logement.", "Des voyageurs cherchent chaque jour un logement à Makkah et à Médine. Ajoutez votre annonce avec quelques photos, le prix et la distance au Haram : notre équipe la vérifie rapidement.", "Besoin d'aide ? Répondez simplement à cet e-mail ou écrivez-nous sur WhatsApp."], btn: "Ajouter mon logement" },
  },
  en: {
    subject: "Al-Diyafa — pilgrims are looking for your place 🕋",
    profile: { title: "Almost there", p: ["You created your host account on Al-Diyafa, thank you for your trust.", "To receive your first bookings, finish your host profile: it takes 3 minutes."], btn: "Finish my profile" },
    listing: { title: "Add your place", p: ["Your host account is approved ✅, but you have not published a place yet.", "Every day, travellers look for a place to stay in Makkah and Madinah. Add your listing with a few photos, the price and the distance to the Haram: our team checks it quickly.", "Need help? Simply reply to this e-mail or message us on WhatsApp."], btn: "Add my place" },
  },
  ar: {
    subject: "الضيافة — الحجاج يبحثون عن سكنك 🕋",
    profile: { title: "لم يتبقَّ الكثير", p: ["أنشأت حساب مضيف على الضيافة، شكرًا لثقتك.", "لتستقبل حجوزاتك الأولى، أكمل ملفك كمضيف: يستغرق ذلك 3 دقائق."], btn: "إكمال ملفي" },
    listing: { title: "أضف سكنك", p: ["تم توثيق حسابك كمضيف ✅، لكنك لم تنشر أي سكن بعد.", "يبحث المسافرون كل يوم عن سكن في مكة والمدينة. أضف إعلانك مع بعض الصور والسعر والمسافة إلى الحرم: يراجعه فريقنا بسرعة.", "تحتاج مساعدة؟ رد على هذه الرسالة أو راسلنا عبر واتساب."], btn: "إضافة سكني" },
  },
};
const SUBJECTS = Object.values(TEXT).map((t) => t.subject);

/** Weekly (Mondays, from the daily cron) — or right now from the admin — nudge hosts who have no listing yet. */
export async function remindHostsWithoutListing({ force = false, now = new Date() } = {}) {
  if (!force && now.getUTCDay() !== 1) return 0;
  const app = (process.env.APP_URL || "").replace(/\/+$/, "");
  let sent = 0;
  for (const u of await hostsWithoutListing()) {
    // Never more than one reminder per week, even if the button is clicked several times
    const recent = await db.emailLog.count({ where: { to: u.email, subject: { in: SUBJECTS }, createdAt: { gte: new Date(now.getTime() - 6 * 86400000) } } });
    if (recent) continue;
    const t = TEXT[lang(u.locale)];
    const c = u.hostProfile ? t.listing : t.profile;
    await emailSimple(u, t.subject, c.title, c.p, { label: c.btn, url: `${app}${u.hostProfile ? "/host/listings/new" : "/host/onboarding"}` });
    sent++;
  }
  return sent;
}

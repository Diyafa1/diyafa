import "server-only";
import type { Booking, Listing, ListingPhoto, User, Bed, Room } from "@prisma/client";
import { sendBrandEmail } from "./email";
import { absoluteUrl, type EmailLocale } from "./email-layout";
import { formatMoney } from "./money";

type FullBooking = Booking & {
  guest: User;
  listing: Listing & { host: User; photos?: ListingPhoto[] };
  bed?: (Bed & { room?: Room }) | null;
};

const loc = (u: { locale?: string | null }): EmailLocale => (u.locale === "ar" || u.locale === "en" ? u.locale : "fr");
const app = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const fmtDate = (d: Date, l: EmailLocale) =>
  new Intl.DateTimeFormat(l === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : l === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
const city = (c: string, l: EmailLocale) => (c === "MAKKAH" ? { fr: "Makkah", en: "Makkah", ar: "مكة المكرمة" } : { fr: "Madinah", en: "Madinah", ar: "المدينة المنورة" })[l];

const T = {
  fr: {
    hello: (n: string) => `Assalamu alaykum ${n},`,
    code: "N° de réservation", arrival: "Arrivée", departure: "Départ", guests: "Voyageurs", bed: "Lit",
    from: (t: string) => `à partir de ${t}`, before: (t: string) => `avant ${t}`,
    paidOnline: "Payé en ligne", payOnSite: "À payer à l'hôte à l'arrivée", total: "Total du séjour", refund: "Remboursement",
    view: "Voir ma réservation", viewHost: "Voir la réservation", answer: "Répondre à la demande", review: "Laisser un avis",
    confirmedS: (c: string) => `Réservation confirmée ✅ ${c}`, confirmedT: "Votre réservation est confirmée",
    confirmedI: "Tout est prêt pour votre séjour, in sha'Allah. Voici votre récapitulatif.",
    requestedS: (c: string) => `Demande envoyée ${c}`, requestedT: "Votre demande a été envoyée à l'hôte",
    requestedI: "Votre acompte est bien reçu. L'hôte a 24 heures pour accepter ; s'il refuse ou ne répond pas, l'acompte vous est remboursé intégralement.",
    acceptedS: (c: string) => `Demande acceptée ✅ ${c}`, acceptedT: "Bonne nouvelle : l'hôte a accepté votre demande",
    declinedS: (c: string) => `Demande non acceptée ${c}`, declinedT: "L'hôte n'a pas pu accepter votre demande",
    declinedI: "Votre acompte vous est remboursé intégralement. D'autres logements vous attendent près du Haram.",
    search: "Voir d'autres logements",
    cancelledS: (c: string) => `Réservation annulée ${c}`, cancelledT: "Votre réservation a été annulée",
    cancelledHostT: "Une réservation a été annulée",
    reminderS: (c: string) => `Votre arrivée demain ${c}`, reminderT: "Votre séjour commence demain 🕋",
    reminderI: "Nous vous souhaitons un excellent séjour. Pensez à prévoir le montant à régler à l'hôte.",
    address: "Adresse",
    reviewS: "Comment s'est passé votre séjour ?", reviewT: "Votre avis compte",
    reviewI: "Votre avis aide d'autres pèlerins à bien choisir. Cela prend une minute. Jazakum Allahu khayran.",
    hostNewS: (c: string) => `Nouvelle réservation ${c}`, hostNewT: "Vous avez une nouvelle réservation",
    hostReqS: (c: string) => `Nouvelle demande à accepter ${c}`, hostReqT: "Nouvelle demande de réservation",
    hostReqI: "Merci d'accepter ou de refuser dans les 24 heures. Sans réponse, la demande est refusée automatiquement.",
    hostPay: "Vous recevrez sur place", hostReminderS: (c: string) => `Arrivée demain ${c}`, hostReminderT: "Un voyageur arrive demain",
    reason: "Raison",
  },
  en: {
    hello: (n: string) => `Assalamu alaykum ${n},`,
    code: "Booking no.", arrival: "Check-in", departure: "Check-out", guests: "Guests", bed: "Bed",
    from: (t: string) => `from ${t}`, before: (t: string) => `before ${t}`,
    paidOnline: "Paid online", payOnSite: "To pay the host on arrival", total: "Total for the stay", refund: "Refund",
    view: "View my booking", viewHost: "View the booking", answer: "Answer the request", review: "Leave a review",
    confirmedS: (c: string) => `Booking confirmed ✅ ${c}`, confirmedT: "Your booking is confirmed",
    confirmedI: "Everything is ready for your stay, in sha'Allah. Here is your summary.",
    requestedS: (c: string) => `Request sent ${c}`, requestedT: "Your request has been sent to the host",
    requestedI: "Your deposit has been received. The host has 24 hours to accept; if they decline or do not answer, your deposit is refunded in full.",
    acceptedS: (c: string) => `Request accepted ✅ ${c}`, acceptedT: "Good news: the host accepted your request",
    declinedS: (c: string) => `Request not accepted ${c}`, declinedT: "The host could not accept your request",
    declinedI: "Your deposit is refunded in full. Other places near the Haram are waiting for you.",
    search: "See other places",
    cancelledS: (c: string) => `Booking cancelled ${c}`, cancelledT: "Your booking has been cancelled",
    cancelledHostT: "A booking has been cancelled",
    reminderS: (c: string) => `Your arrival tomorrow ${c}`, reminderT: "Your stay starts tomorrow 🕋",
    reminderI: "We wish you a wonderful stay. Remember to bring the amount to pay the host.",
    address: "Address",
    reviewS: "How was your stay?", reviewT: "Your review matters",
    reviewI: "Your review helps other pilgrims choose well. It takes one minute. Jazakum Allahu khayran.",
    hostNewS: (c: string) => `New booking ${c}`, hostNewT: "You have a new booking",
    hostReqS: (c: string) => `New request to accept ${c}`, hostReqT: "New booking request",
    hostReqI: "Please accept or decline within 24 hours. Without an answer, the request is declined automatically.",
    hostPay: "You will receive on site", hostReminderS: (c: string) => `Arrival tomorrow ${c}`, hostReminderT: "A traveller arrives tomorrow",
    reason: "Reason",
  },
  ar: {
    hello: (n: string) => `السلام عليكم ${n}،`,
    code: "رقم الحجز", arrival: "الوصول", departure: "المغادرة", guests: "الضيوف", bed: "السرير",
    from: (t: string) => `ابتداءً من ${t}`, before: (t: string) => `قبل ${t}`,
    paidOnline: "المدفوع عبر الإنترنت", payOnSite: "المبلغ المدفوع للمضيف عند الوصول", total: "إجمالي الإقامة", refund: "المبلغ المسترد",
    view: "عرض حجزي", viewHost: "عرض الحجز", answer: "الرد على الطلب", review: "أضف تقييمًا",
    confirmedS: (c: string) => `تم تأكيد الحجز ✅ ${c}`, confirmedT: "تم تأكيد حجزك",
    confirmedI: "كل شيء جاهز لإقامتك إن شاء الله. إليك ملخص الحجز.",
    requestedS: (c: string) => `تم إرسال الطلب ${c}`, requestedT: "تم إرسال طلبك إلى المضيف",
    requestedI: "تم استلام العربون. أمام المضيف 24 ساعة للقبول، وإذا رفض أو لم يرد يُعاد إليك العربون كاملًا.",
    acceptedS: (c: string) => `تم قبول الطلب ✅ ${c}`, acceptedT: "خبر سار: قبل المضيف طلبك",
    declinedS: (c: string) => `لم يُقبل الطلب ${c}`, declinedT: "لم يتمكن المضيف من قبول طلبك",
    declinedI: "يُعاد إليك العربون كاملًا. تنتظرك أماكن أخرى قرب الحرم.",
    search: "عرض أماكن أخرى",
    cancelledS: (c: string) => `تم إلغاء الحجز ${c}`, cancelledT: "تم إلغاء حجزك",
    cancelledHostT: "تم إلغاء حجز",
    reminderS: (c: string) => `وصولك غدًا ${c}`, reminderT: "تبدأ إقامتك غدًا 🕋",
    reminderI: "نتمنى لك إقامة طيبة. لا تنسَ تجهيز المبلغ المستحق للمضيف.",
    address: "العنوان",
    reviewS: "كيف كانت إقامتك؟", reviewT: "رأيك يهمنا",
    reviewI: "تقييمك يساعد الحجاج والمعتمرين على الاختيار. يستغرق دقيقة واحدة. جزاكم الله خيرًا.",
    hostNewS: (c: string) => `حجز جديد ${c}`, hostNewT: "لديك حجز جديد",
    hostReqS: (c: string) => `طلب حجز جديد ${c}`, hostReqT: "طلب حجز جديد",
    hostReqI: "يرجى القبول أو الرفض خلال 24 ساعة، وإلا سيُرفض الطلب تلقائيًا.",
    hostPay: "ستستلم عند الوصول", hostReminderS: (c: string) => `وصول غدًا ${c}`, hostReminderT: "يصل ضيف غدًا",
    reason: "السبب",
  },
};

function summary(b: FullBooking, l: EmailLocale) {
  const t = T[l];
  const rows: [string, string][] = [
    [t.code, b.code],
    [t.arrival, `${fmtDate(b.checkIn, l)} · ${t.from(b.listing.checkInTime)}`],
    [t.departure, `${fmtDate(b.checkOut, l)} · ${t.before(b.listing.checkOutTime)}`],
    [t.guests, String(b.guests)],
  ];
  if (b.bed) rows.push([t.bed, `${b.bed.room?.name ? b.bed.room.name + " · " : ""}${b.bed.label}`]);
  return rows;
}
const card = (b: FullBooking, l: EmailLocale) => ({
  photoUrl: absoluteUrl(b.listing.photos?.[0]?.url),
  cardTitle: b.listing.title,
  cardSubtitle: `${city(b.listing.city, l)}${b.listing.neighborhood ? " · " + b.listing.neighborhood : ""}`,
});

export type GuestEmailKind = "confirmed" | "requested" | "accepted" | "declined" | "cancelled" | "reminder" | "review";

export async function emailGuest(b: FullBooking, kind: GuestEmailKind, extra: { refund?: number; reason?: string } = {}) {
  const l = loc(b.guest);
  const t = T[l];
  const money: [string, string][] = [
    [t.paidOnline, formatMoney(b.onlineAmount, l)],
    [t.payOnSite, formatMoney(b.payOnSite, l)],
    [t.total, formatMoney(b.total, l)],
  ];
  const tripUrl = `${app()}/trips/${b.id}`;
  const base = { locale: l, ...card(b, l) };
  const m = {
    confirmed: { s: t.confirmedS(b.code), c: { ...base, title: t.confirmedT, intro: `${t.hello(b.guest.name.split(" ")[0])} ${t.confirmedI}`, rows: summary(b, l), highlight: money, button: { label: t.view, url: tripUrl } } },
    requested: { s: t.requestedS(b.code), c: { ...base, title: t.requestedT, intro: `${t.hello(b.guest.name.split(" ")[0])} ${t.requestedI}`, rows: summary(b, l), highlight: money, button: { label: t.view, url: tripUrl } } },
    accepted: { s: t.acceptedS(b.code), c: { ...base, title: t.acceptedT, intro: t.confirmedI, rows: summary(b, l), highlight: money, button: { label: t.view, url: tripUrl } } },
    declined: { s: t.declinedS(b.code), c: { ...base, title: t.declinedT, intro: t.declinedI, rows: [[t.code, b.code]] as [string, string][], highlight: [[t.refund, formatMoney(b.onlineAmount, l)]] as [string, string][], button: { label: t.search, url: `${app()}/search` } } },
    cancelled: { s: t.cancelledS(b.code), c: { ...base, title: t.cancelledT, rows: [...summary(b, l), ...(extra.reason ? [[t.reason, extra.reason]] as [string, string][] : [])], highlight: [[t.refund, formatMoney(extra.refund ?? 0, l)]] as [string, string][], button: { label: t.view, url: tripUrl } } },
    reminder: { s: t.reminderS(b.code), c: { ...base, title: t.reminderT, intro: t.reminderI, rows: [...summary(b, l), [t.address, b.listing.address]] as [string, string][], highlight: [[t.payOnSite, formatMoney(b.payOnSite, l)]] as [string, string][], button: { label: t.view, url: tripUrl } } },
    review: { s: t.reviewS, c: { ...base, title: t.reviewT, intro: t.reviewI, button: { label: t.review, url: tripUrl } } },
  }[kind];
  await sendBrandEmail(b.guest.email, `Al-Diyafa — ${m.s}`, m.c);
}

export type HostEmailKind = "new" | "request" | "cancelled" | "reminder";

export async function emailHost(b: FullBooking, kind: HostEmailKind, extra: { reason?: string } = {}) {
  const host = b.listing.host;
  const l = loc(host);
  const t = T[l];
  const url = `${app()}/host/bookings`;
  const rows: [string, string][] = [...summary(b, l), [l === "ar" ? "الضيف" : l === "fr" ? "Voyageur" : "Traveller", b.guest.name]];
  const base = { locale: l, ...card(b, l), rows, highlight: [[t.hostPay, formatMoney(b.payOnSite, l)]] as [string, string][] };
  const m = {
    new: { s: t.hostNewS(b.code), c: { ...base, title: t.hostNewT, button: { label: t.viewHost, url } } },
    request: { s: t.hostReqS(b.code), c: { ...base, title: t.hostReqT, intro: t.hostReqI, button: { label: t.answer, url: `${app()}/host` } } },
    cancelled: { s: t.cancelledS(b.code), c: { ...base, title: t.cancelledHostT, rows: [...rows, ...(extra.reason ? [[t.reason, extra.reason]] as [string, string][] : [])], highlight: undefined, button: { label: t.viewHost, url } } },
    reminder: { s: t.hostReminderS(b.code), c: { ...base, title: t.hostReminderT, button: { label: t.viewHost, url } } },
  }[kind];
  await sendBrandEmail(host.email, `Al-Diyafa — ${m.s}`, m.c);
}

/** Short branded message (account approved, listing published, payout…). */
export async function emailSimple(to: { email: string; locale?: string | null }, subject: string, title: string, paragraphs: string[], button?: { label: string; url: string }) {
  await sendBrandEmail(to.email, subject, { locale: loc(to), title, paragraphs, button });
}

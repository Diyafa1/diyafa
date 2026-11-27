import "server-only";
import { sendEmail } from "./email";

type Lang = "fr" | "en" | "ar";
const lang = (l?: string | null): Lang => (l === "en" || l === "ar" ? l : "fr");
const app = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const first = (name: string) => name.trim().split(/\s+/)[0] || name;

type Mail = { subject: string; title: (n: string) => string; paragraphs: string[]; button: string; path: string };

/** Welcome e-mail for a new traveller (sent at sign-up). */
const GUEST: Record<Lang, Mail> = {
  fr: {
    subject: "Bienvenue sur Al-Diyafa 🤍 Merci pour votre confiance",
    title: (n) => `As-salamu alaykum ${n}`,
    paragraphs: [
      "Merci d'avoir rejoint Al-Diyafa. Nous sommes honorés de vous aider à trouver un logement à Makkah et à Médine, au plus près du Haram, pour votre Omra, votre Hajj ou votre visite.",
      "# Comment ça marche",
      "1. Choisissez votre logement : appartement, chambre ou lit. La distance au Haram et le temps à pied sont indiqués sur chaque annonce.\n2. Réservez en ligne : vous ne payez que les frais de réservation.\n3. Vous recevez un e-mail de confirmation avec l'adresse et les horaires.\n4. À votre arrivée, vous payez le reste directement à l'hôte.",
      "# Nos règles",
      "• Lits partagés : un logement est soit pour les hommes, soit pour les femmes, jamais mixte.\n• Messagerie : il est interdit d'échanger un numéro de téléphone, un e-mail ou un lien. Tout passe par Al-Diyafa, pour votre sécurité.\n• Annulation : les conditions de remboursement sont indiquées sur chaque annonce. Lisez-les avant de réserver.\n• Respectez le logement, les voisins et les horaires d'arrivée et de départ.\n• Craignez Allah dans vos échanges, et comportez-vous comme un invité dont on garde un bon souvenir.",
      "Une question ? Répondez simplement à cet e-mail, ou écrivez-nous sur WhatsApp.",
      "Qu'Allah accepte votre visite.\nL'équipe Al-Diyafa",
    ],
    button: "Trouver un logement",
    path: "/search",
  },
  en: {
    subject: "Welcome to Al-Diyafa 🤍 Thank you for your trust",
    title: (n) => `As-salamu alaykum ${n}`,
    paragraphs: [
      "Thank you for joining Al-Diyafa. We are honoured to help you find a place to stay in Makkah and Madinah, as close as possible to the Haram, for your Umrah, your Hajj or your visit.",
      "# How it works",
      "1. Choose your place: apartment, room or bed. The distance to the Haram and the walking time are shown on every listing.\n2. Book online: you only pay the booking fee.\n3. You receive a confirmation e-mail with the address and times.\n4. When you arrive, you pay the rest directly to the host.",
      "# Our rules",
      "• Shared beds: a home is either for men or for women, never mixed.\n• Messages: sharing a phone number, an e-mail or a link is not allowed. Everything goes through Al-Diyafa, for your safety.\n• Cancellation: refund conditions are shown on each listing. Read them before booking.\n• Respect the home, the neighbours and the check-in and check-out times.\n• Fear Allah in your exchanges, and be a guest who is remembered well.",
      "A question? Simply reply to this e-mail, or message us on WhatsApp.",
      "May Allah accept your visit.\nThe Al-Diyafa team",
    ],
    button: "Find a place",
    path: "/search",
  },
  ar: {
    subject: "مرحبًا بك في الضيافة 🤍 شكرًا لثقتك",
    title: (n) => `السلام عليكم ${n}`,
    paragraphs: [
      "شكرًا لانضمامك إلى الضيافة. يشرفنا أن نساعدك في إيجاد سكن في مكة المكرمة والمدينة المنورة، في أقرب مكان من الحرم، لعمرتك أو حجك أو زيارتك.",
      "# كيف يعمل الموقع",
      "1. اختر سكنك: شقة أو غرفة أو سرير. المسافة إلى الحرم والوقت سيرًا موضحان في كل إعلان.\n2. احجز عبر الإنترنت: تدفع رسوم الحجز فقط.\n3. تصلك رسالة تأكيد فيها العنوان والمواعيد.\n4. عند وصولك، تدفع الباقي للمضيف مباشرة.",
      "# قواعدنا",
      "• الأسرّة المشتركة: السكن إما للرجال وإما للنساء، ولا يكون مختلطًا أبدًا.\n• الرسائل: يُمنع تبادل رقم الهاتف أو البريد الإلكتروني أو الروابط. كل شيء يتم عبر الضيافة حفاظًا على سلامتك.\n• الإلغاء: شروط الاسترداد موضحة في كل إعلان، فاقرأها قبل الحجز.\n• احترم السكن والجيران ومواعيد الوصول والمغادرة.\n• اتقِ الله في تعاملاتك، وكن ضيفًا يُذكر بخير.",
      "لديك سؤال؟ رد على هذه الرسالة، أو راسلنا عبر واتساب.",
      "تقبّل الله زيارتك.\nفريق الضيافة",
    ],
    button: "ابحث عن سكن",
    path: "/search",
  },
};

/** Welcome e-mail for a new host (sent when they send their host application). */
const HOST: Record<Lang, Mail> = {
  fr: {
    subject: "Bienvenue sur Al-Diyafa 🤍 Merci pour votre confiance",
    title: (n) => `As-salamu alaykum wa rahmatullahi wa barakatuh ${n}`,
    paragraphs: [
      "Merci d'avoir rejoint Al-Diyafa. Nous sommes honorés que vous nous fassiez confiance pour accueillir les invités d'Allah à Makkah et à Médine.",
      "Votre profil d'hôte est en cours de vérification par notre équipe. Vous recevrez un e-mail dès qu'il sera validé.",
      "# Comment ça marche",
      "1. Vous publiez votre logement avec des photos, le prix et la distance au Haram.\n2. Notre équipe vérifie l'annonce, puis la met en ligne.\n3. Le voyageur réserve. Vous recevez un e-mail avec les détails.\n4. À son arrivée, le voyageur vous paie directement sur place.",
      "# Notre commission : 20 %",
      "Exemple : vous fixez 100 € la nuit, vous recevez 80 € directement du voyageur à son arrivée. Notre commission est encaissée en ligne au moment de la réservation. Vous n'avez rien à nous verser.",
      "# Nos règles",
      "• Des photos et des informations vraies : prix, distance réelle au Haram, équipements.\n• Lits partagés : un logement est soit pour les hommes, soit pour les femmes, jamais mixte.\n• Répondre sous 24 h aux demandes de réservation. Sans réponse, la demande est annulée automatiquement.\n• Ne pas annuler une réservation acceptée. Après plusieurs annulations, vos annonces sont suspendues automatiquement.\n• Messagerie : il est interdit d'échanger un numéro de téléphone, un e-mail ou un lien. Tout passe par Al-Diyafa, pour votre sécurité et celle des voyageurs.\n• Craignez Allah dans vos échanges, et accueillez chaque invité comme vous aimeriez être accueilli.",
      "Une question ? Répondez simplement à cet e-mail, ou écrivez-nous sur WhatsApp.",
      "Qu'Allah bénisse votre accueil.\nL'équipe Al-Diyafa",
    ],
    button: "Publier mon logement",
    path: "/host/listings/new",
  },
  en: {
    subject: "Welcome to Al-Diyafa 🤍 Thank you for your trust",
    title: (n) => `As-salamu alaykum wa rahmatullahi wa barakatuh ${n}`,
    paragraphs: [
      "Thank you for joining Al-Diyafa. We are honoured that you trust us to welcome the guests of Allah in Makkah and Madinah.",
      "Your host profile is being checked by our team. You will receive an e-mail as soon as it is approved.",
      "# How it works",
      "1. You publish your place with photos, the price and the distance to the Haram.\n2. Our team checks the listing, then puts it online.\n3. A traveller books. You receive an e-mail with the details.\n4. When they arrive, the traveller pays you directly on site.",
      "# Our commission: 20%",
      "Example: you set 100 € per night, you receive 80 € directly from the traveller when they arrive. Our commission is collected online at the time of booking. You have nothing to pay us.",
      "# Our rules",
      "• True photos and information: price, real distance to the Haram, amenities.\n• Shared beds: a home is either for men or for women, never mixed.\n• Answer booking requests within 24 hours. Without an answer, the request is cancelled automatically.\n• Do not cancel an accepted booking. After several cancellations, your listings are suspended automatically.\n• Messages: sharing a phone number, an e-mail or a link is not allowed. Everything goes through Al-Diyafa, for your safety and the travellers'.\n• Fear Allah in your exchanges, and welcome every guest as you would like to be welcomed.",
      "A question? Simply reply to this e-mail, or message us on WhatsApp.",
      "May Allah bless your hospitality.\nThe Al-Diyafa team",
    ],
    button: "Publish my place",
    path: "/host/listings/new",
  },
  ar: {
    subject: "مرحبًا بك في الضيافة 🤍 شكرًا لثقتك",
    title: (n) => `السلام عليكم ورحمة الله وبركاته ${n}`,
    paragraphs: [
      "شكرًا لانضمامك إلى الضيافة. يشرفنا أن تثق بنا لاستقبال ضيوف الرحمن في مكة المكرمة والمدينة المنورة.",
      "يقوم فريقنا بمراجعة ملفك كمضيف، وستصلك رسالة فور توثيقه.",
      "# كيف يعمل الموقع",
      "1. تنشر سكنك مع الصور والسعر والمسافة إلى الحرم.\n2. يراجع فريقنا الإعلان ثم ينشره.\n3. يحجز المسافر، وتصلك رسالة بالتفاصيل.\n4. عند وصوله، يدفع لك المسافر مباشرة في المكان.",
      "# عمولتنا: 20%",
      "مثال: تحدد 100 € لليلة، فتستلم 80 € من المسافر مباشرة عند وصوله. نحصّل عمولتنا عبر الإنترنت عند الحجز، وليس عليك أن تدفع لنا شيئًا.",
      "# قواعدنا",
      "• صور ومعلومات صحيحة: السعر، والمسافة الحقيقية إلى الحرم، والمرافق.\n• الأسرّة المشتركة: السكن إما للرجال وإما للنساء، ولا يكون مختلطًا أبدًا.\n• الرد على طلبات الحجز خلال 24 ساعة، وإلا يُلغى الطلب تلقائيًا.\n• عدم إلغاء حجز مقبول. بعد عدة إلغاءات، تُعلّق إعلاناتك تلقائيًا.\n• الرسائل: يُمنع تبادل رقم الهاتف أو البريد الإلكتروني أو الروابط. كل شيء يتم عبر الضيافة حفاظًا على سلامتك وسلامة المسافرين.\n• اتقِ الله في تعاملاتك، واستقبل كل ضيف كما تحب أن تُستقبل.",
      "لديك سؤال؟ رد على هذه الرسالة، أو راسلنا عبر واتساب.",
      "بارك الله في ضيافتك.\nفريق الضيافة",
    ],
    button: "انشر سكني",
    path: "/host/listings/new",
  },
};

const BRAND = "#7A2E3A";
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Branded welcome e-mail: burgundy header, numbered steps, commission box, rules with burgundy bullets, signature. */
export function renderWelcome(m: Mail, locale: Lang, name: string, url: string): { html: string; text: string } {
  const rtl = locale === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const font = "'Readex Pro','Segoe UI',Tahoma,Arial,sans-serif";
  const title = m.title(name);
  const signature = m.paragraphs[m.paragraphs.length - 1];
  const parts = m.paragraphs.slice(0, -1);

  let html = "";
  let section = "";
  for (const p of parts) {
    if (p.startsWith("# ")) {
      section = p.slice(2);
      html += `<tr><td style="padding:26px 32px 4px;text-align:${align};"><div style="font-size:17px;font-weight:700;color:${BRAND};font-family:${font};">${esc(section)}</div><div style="width:36px;height:3px;background:${BRAND};border-radius:2px;margin-top:8px;${rtl ? "margin-right:0;" : ""}"></div></td></tr>`;
      continue;
    }
    const lines = p.split("\n");
    if (/^\d+\./.test(lines[0])) {
      // numbered steps with burgundy circles
      html += `<tr><td style="padding:10px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lines
        .map((l, i) => {
          const txt = l.replace(/^\d+\.\s*/, "");
          return `<tr><td width="40" valign="top" style="padding:8px 0;"><div style="width:30px;height:30px;border-radius:15px;background:${BRAND};color:#fff;font-size:14px;font-weight:700;line-height:30px;text-align:center;font-family:${font};">${i + 1}</div></td><td valign="middle" style="padding:8px 0;font-size:14px;line-height:1.55;color:#404040;text-align:${align};font-family:${font};">${esc(txt)}</td></tr>`;
        })
        .join("")}</table></td></tr>`;
    } else if (lines[0].startsWith("• ")) {
      // rules: burgundy bullets, the part before ":" in bold
      html += `<tr><td style="padding:10px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lines
        .map((l) => {
          const txt = l.replace(/^•\s*/, "");
          const m2 = txt.match(/^([^:：]{2,40})\s?:\s?(.*)$/);
          const content = m2 ? `<strong style="color:#171717;">${esc(m2[1])}</strong> : ${esc(m2[2])}` : esc(txt);
          return `<tr><td width="22" valign="top" style="padding:7px 0;"><div style="width:8px;height:8px;border-radius:4px;background:${BRAND};margin-top:7px;"></div></td><td style="padding:7px 0;font-size:14px;line-height:1.55;color:#404040;text-align:${align};font-family:${font};">${content}</td></tr>`;
        })
        .join("")}</table></td></tr>`;
    } else if (/20\s?%/.test(section) && /100/.test(p)) {
      // commission: example in a light burgundy box
      html += `<tr><td style="padding:12px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0f2;border-radius:14px;border:1px solid #ecd9dd;"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;color:#404040;text-align:${align};font-family:${font};">${esc(p).replace(/(\d+\s?€)/g, '<strong style="color:' + BRAND + ';font-size:16px;">$1</strong>')}</td></tr></table></td></tr>`;
    } else {
      html += `<tr><td style="padding:12px 32px 0;font-size:15px;line-height:1.65;color:#404040;text-align:${align};font-family:${font};">${esc(p).replace(/\n/g, "<br>")}</td></tr>`;
    }
  }
  const [sig1, sig2] = signature.split("\n");

  const doc = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;600;700&display=swap" rel="stylesheet"><title>${esc(m.subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f1f2;font-family:${font};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(m.paragraphs[0].slice(0, 120))}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f2;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ebe3e5;" dir="${dir}">
  <tr><td style="background:${BRAND};padding:34px 32px 30px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="background:#ffffff;border-radius:16px;width:60px;height:60px;text-align:center;vertical-align:middle;color:${BRAND};font-size:34px;font-weight:700;line-height:60px;font-family:${font};">ض</td></tr></table>
    <div style="margin-top:12px;font-size:15px;letter-spacing:1px;color:#f3dfe3;font-family:${font};">AL-DIYAFA · الضيافة</div>
    <h1 style="margin:16px 0 0;font-size:24px;line-height:1.4;color:#ffffff;font-weight:600;font-family:${font};">${esc(title)}</h1>
    <div style="margin-top:8px;font-size:22px;">🤍</div>
  </td></tr>
  ${html}
  <tr><td style="padding:28px 32px 6px;text-align:center;">
    <a href="${esc(url)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:15px 30px;border-radius:12px;font-family:${font};">${esc(m.button)}</a>
  </td></tr>
  <tr><td style="padding:24px 32px 30px;text-align:center;">
    <div style="font-size:15px;color:#404040;font-style:${rtl ? "normal" : "italic"};font-family:${font};">${esc(sig1)}</div>
    <div style="margin-top:6px;font-size:16px;font-weight:700;color:${BRAND};font-family:${font};">${esc(sig2 ?? "")}</div>
  </td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;"><tr><td style="padding:16px 8px;text-align:center;font-size:12px;color:#8a8a8a;font-family:${font};">
  © ${new Date().getFullYear()} Al-Diyafa · <a href="${esc(app())}" style="color:#8a8a8a;">${esc(app().replace(/^https?:\/\//, ""))}</a>
</td></tr></table>
</td></tr></table>
</body></html>`;
  const text = [title, "", ...m.paragraphs.map((p) => (p.startsWith("# ") ? `\n${p.slice(2).toUpperCase()}` : p)), "", `${m.button} : ${url}`].join("\n");
  return { html: doc, text };
}

async function send(set: Record<Lang, Mail>, u: { email: string; name: string; locale?: string | null }) {
  const l = lang(u.locale);
  const m = set[l];
  const { html, text } = renderWelcome(m, l, first(u.name), `${app()}${m.path}`);
  await sendEmail(u.email, m.subject, text, html).catch((e) => console.error("[welcome]", e));
}

export const sendGuestWelcome = (u: { email: string; name: string; locale?: string | null }) => send(GUEST, u);
export const sendHostWelcome = (u: { email: string; name: string; locale?: string | null }) => send(HOST, u);

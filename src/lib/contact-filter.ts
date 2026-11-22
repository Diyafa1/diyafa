/**
 * Blocks contact details in messages and listings (phone numbers, e-mails, links, WhatsApp/Telegram…),
 * so that hosts and travellers keep talking through Diyafa. Works in Latin, Arabic and Persian digits
 * and catches common tricks ("0 6 1 2…", "zero six…", "name at gmail dot com", "واتساب").
 */
const DIGIT_MAP: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};
const WORD_DIGITS: [RegExp, string][] = [
  [/\b(z[eé]ro|zero|sifr|صفر)\b/gi, "0"], [/\b(un|une|one|wahid|واحد)\b/gi, "1"], [/\b(deux|two|ithnan|اثنان|اثنين)\b/gi, "2"],
  [/\b(trois|three|thalatha|ثلاثة)\b/gi, "3"], [/\b(quatre|four|arba3a|أربعة|اربعة)\b/gi, "4"], [/\b(cinq|five|khamsa|خمسة)\b/gi, "5"],
  [/\b(six|sitta|ستة)\b/gi, "6"], [/\b(sept|seven|sab3a|سبعة)\b/gi, "7"], [/\b(huit|eight|thamaniya|ثمانية)\b/gi, "8"], [/\b(neuf|nine|tis3a|تسعة)\b/gi, "9"],
];

export type ContactCheck = { ok: true } | { ok: false; reason: "phone" | "email" | "link" | "app" };

export function checkContact(text: string): ContactCheck {
  const t = text.replace(/[٠-٩۰-۹]/g, (c) => DIGIT_MAP[c] ?? c);

  // e-mails, including "name at gmail dot com", "arobase", "@" with spaces
  if (/[\w.+-]+\s*(@|\(at\)|\[at\]|\sat\s|arobase|آت)\s*[\w-]+\s*(\.|\sdot\s|\spoint\s|\(dot\))\s*[a-z]{2,}/i.test(t)) return { ok: false, reason: "email" };
  if (/\b(gmail|hotmail|outlook|yahoo|icloud|live\.fr|proton)\b/i.test(t)) return { ok: false, reason: "email" };

  // links and outside apps
  if (/(https?:\/\/|www\.|wa\.me|t\.me|bit\.ly|\b[a-z0-9-]+\.(com|net|org|fr|be|sa|me|io|ly)\b)/i.test(t)) return { ok: false, reason: "link" };
  if (/(whats\s*app|watsap|watsapp|wats\s*app|واتس|واتساب|وتساب|telegram|t[eé]l[eé]gram|تيليجرام|تلغرام|signal|snap\s*chat|instagram|insta\b|facebook|messenger|imo\b|viber|botim)/i.test(t)) return { ok: false, reason: "app" };

  // phone numbers: 7+ digits even with spaces, dots, dashes, brackets or words in between.
  // Dates (12/03/2027) and times (15h30, 15:00) are allowed, so they are removed first.
  const noDates = t
    .replace(/(?<![\d./-])(\d{1,2}[/.-]\d{1,2}[/.-](\d{4}|\d{2})|\d{4}-\d{2}-\d{2})(?![\d./-])/g, " ")
    .replace(/\b\d{1,2}\s*(h|:)\s*\d{0,2}\b/gi, " ");
  let d = noDates;
  for (const [re, v] of WORD_DIGITS) d = d.replace(re, v);
  const runs = d.match(/\+?\d[\d\s.\-()/_]{5,}\d/g) ?? [];
  if (runs.some((r) => r.replace(/\D/g, "").length >= 7)) return { ok: false, reason: "phone" };
  // digits spread across the whole message (e.g. "06 ... 12 ... 34 ... 56")
  if ((noDates.match(/\d/g) ?? []).length >= 9) return { ok: false, reason: "phone" };

  return { ok: true };
}

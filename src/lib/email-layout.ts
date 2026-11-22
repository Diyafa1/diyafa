/**
 * Branded HTML e-mails (Diyafa burgundy, logo, clear summary, button), built with tables and inline styles
 * so they look right in Gmail, Outlook and Apple Mail. Arabic e-mails are right-to-left.
 */
export type EmailLocale = "fr" | "en" | "ar";
export type EmailContent = {
  locale: EmailLocale;
  preheader?: string; // short preview shown by the mail app
  title: string;
  intro?: string;
  photoUrl?: string | null;
  cardTitle?: string; // e.g. listing name
  cardSubtitle?: string;
  rows?: [string, string][]; // summary lines
  highlight?: [string, string][]; // money lines in a coloured box
  button?: { label: string; url: string };
  paragraphs?: string[];
  footerNote?: string;
};

const BRAND = "#7A2E3A";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
export const absoluteUrl = (u: string | null | undefined) => (!u ? null : /^https?:\/\//.test(u) ? u : `${appUrl()}${u.startsWith("/") ? "" : "/"}${u}`);

const FOOTER: Record<EmailLocale, { help: string; rights: string; auto: string }> = {
  fr: { help: "Besoin d'aide ? Répondez via la page Contact du site.", rights: "Tous droits réservés.", auto: "Cet e-mail vous a été envoyé automatiquement par Diyafa." },
  en: { help: "Need help? Use the Contact page on the website.", rights: "All rights reserved.", auto: "This e-mail was sent automatically by Diyafa." },
  ar: { help: "تحتاج مساعدة؟ تواصل معنا عبر صفحة «تواصل معنا» في الموقع.", rights: "جميع الحقوق محفوظة.", auto: "أُرسلت هذه الرسالة تلقائيًا من ضيافة." },
};

export function renderEmail(c: EmailContent): { html: string; text: string } {
  const rtl = c.locale === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const opp = rtl ? "left" : "right";
  const font = "'Readex Pro','Segoe UI',Tahoma,Arial,sans-serif";
  const f = FOOTER[c.locale];
  const rowsHtml = (rows: [string, string][], strongLast = false) =>
    rows
      .map(
        ([k, v], i) => `<tr>
          <td style="padding:8px 0;color:#525252;font-size:14px;text-align:${align};${i ? "border-top:1px solid #eeeeee;" : ""}">${esc(k)}</td>
          <td style="padding:8px 0;color:#171717;font-size:14px;text-align:${opp};font-weight:${strongLast && i === rows.length - 1 ? "700" : "500"};${i ? "border-top:1px solid #eeeeee;" : ""}">${esc(v)}</td>
        </tr>`,
      )
      .join("");

  const html = `<!doctype html>
<html lang="${c.locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(c.title)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:${font};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(c.preheader ?? c.intro ?? c.title)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;" dir="${dir}">
      <!-- logo -->
      <tr><td style="padding:0 4px 16px;text-align:${align};">
        <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;"><tr>
          <td style="background:${BRAND};border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;color:#ffffff;font-size:26px;font-weight:700;line-height:44px;font-family:${font};">ض</td>
          <td style="padding:0 10px;font-size:20px;font-weight:700;color:#171717;font-family:${font};">Diyafa</td>
        </tr></table>
      </td></tr>
      <!-- card -->
      <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;overflow:hidden;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:28px 28px 8px;text-align:${align};">
            <h1 style="margin:0 0 10px;font-size:22px;line-height:1.35;color:#171717;font-family:${font};">${esc(c.title)}</h1>
            ${c.intro ? `<p style="margin:0;font-size:15px;line-height:1.6;color:#404040;">${esc(c.intro)}</p>` : ""}
          </td></tr>
          ${
            c.photoUrl || c.cardTitle
              ? `<tr><td style="padding:16px 28px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:12px;overflow:hidden;">
              ${c.photoUrl ? `<tr><td><img src="${esc(c.photoUrl)}" width="504" alt="" style="display:block;width:100%;max-width:504px;height:auto;max-height:240px;object-fit:cover;border:0;"></td></tr>` : ""}
              ${c.cardTitle ? `<tr><td style="padding:14px 16px;text-align:${align};"><div style="font-size:16px;font-weight:700;color:#171717;">${esc(c.cardTitle)}</div>${c.cardSubtitle ? `<div style="font-size:13px;color:#737373;margin-top:4px;">${esc(c.cardSubtitle)}</div>` : ""}</td></tr>` : ""}
            </table>
          </td></tr>`
              : ""
          }
          ${c.rows?.length ? `<tr><td style="padding:16px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml(c.rows)}</table></td></tr>` : ""}
          ${c.highlight?.length ? `<tr><td style="padding:16px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0f2;border-radius:12px;padding:6px 16px;">${rowsHtml(c.highlight, true)}</table></td></tr>` : ""}
          ${(c.paragraphs ?? []).map((p) => `<tr><td style="padding:16px 28px 0;text-align:${align};font-size:14px;line-height:1.6;color:#404040;">${esc(p)}</td></tr>`).join("")}
          ${
            c.button
              ? `<tr><td style="padding:24px 28px 4px;text-align:${align};">
            <a href="${esc(c.button.url)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 22px;border-radius:12px;font-family:${font};">${esc(c.button.label)}</a>
          </td></tr>`
              : ""
          }
          <tr><td style="padding:24px 28px 28px;text-align:${align};font-size:13px;color:#737373;line-height:1.6;">${esc(c.footerNote ?? f.help)}</td></tr>
        </table>
      </td></tr>
      <!-- footer -->
      <tr><td style="padding:16px 8px;text-align:center;font-size:12px;color:#a3a3a3;line-height:1.6;">
        ${esc(f.auto)}<br>© ${new Date().getFullYear()} Diyafa · ${esc(f.rights)}<br>
        <a href="${appUrl()}" style="color:#a3a3a3;">${appUrl().replace(/^https?:\/\//, "")}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = [
    c.title,
    c.intro,
    c.cardTitle && `\n${c.cardTitle}${c.cardSubtitle ? ` — ${c.cardSubtitle}` : ""}`,
    ...(c.rows ?? []).map(([k, v]) => `${k} : ${v}`),
    ...(c.highlight ?? []).map(([k, v]) => `${k} : ${v}`),
    ...(c.paragraphs ?? []),
    c.button && `\n${c.button.label} : ${c.button.url}`,
    `\n${c.footerNote ?? f.help}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { html, text };
}

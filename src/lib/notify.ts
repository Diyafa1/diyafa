import "server-only";
import { after } from "next/server";
import { db } from "./db";
import { sendBrandEmail } from "./email";
import { sendTelegram } from "./telegram";

/**
 * Alerts for the owner: an e-mail to every admin + a WhatsApp message.
 * WhatsApp uses CallMeBot (free, for personal alerts): set OWNER_WHATSAPP (e.g. +32470123456)
 * and CALLMEBOT_API_KEY in Vercel. Never blocks the site if it fails.
 */
export async function notifyOwner(subject: string, body: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { email: true } });
  const lines = body.split("\n").filter(Boolean);
  const link = lines.find((x) => /https?:\/\//.test(x));
  const url = link?.match(/https?:\/\/\S+/)?.[0] ?? `${process.env.APP_URL || ""}/admin`;
  await Promise.all(
    admins.map((a) =>
      sendBrandEmail(a.email, subject, {
        locale: "fr",
        title: subject.replace(/^.*?Diyafa — /, ""),
        paragraphs: lines.filter((x) => x !== link),
        button: { label: "Ouvrir l'espace admin", url },
      }),
    ),
  );
  await sendOwnerWhatsApp(`${subject}\n${body}`);
  // Telegram can be slow: never make a booking or an admin action wait for it
  const tgText = `${subject}\n\n${body}`;
  try {
    after(() => sendTelegram(tgText));
  } catch {
    void sendTelegram(tgText); // outside a web request (tests, scripts)
  }
}

export async function sendOwnerWhatsApp(text: string) {
  const phone = (process.env.OWNER_WHATSAPP ?? "").replace(/[^\d+]/g, "");
  const key = process.env.CALLMEBOT_API_KEY;
  if (!phone || !key) {
    if (process.env.EMAIL_PROVIDER !== "none") console.log(`\n💬 WhatsApp (non configuré) → ${text.replace(/\n/g, " | ")}\n`);
    return;
  }
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text.slice(0, 1000))}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) console.error("[whatsapp] CallMeBot error", res.status);
  } catch (e) {
    console.error("[whatsapp] failed", e instanceof Error ? e.message : e);
  }
}

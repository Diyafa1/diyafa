import "server-only";
import dns from "node:dns";

// Vercel functions often cannot reach Telegram over IPv6: resolve api.telegram.org to IPv4 first.
dns.setDefaultResultOrder("ipv4first");
import { db } from "./db";

/**
 * Owner alerts on Telegram (free, official Bot API).
 * Setup: create a bot with @BotFather → token in Vercel as TELEGRAM_BOT_TOKEN →
 * send any message to the bot → Admin → Commissions → Telegram → « Connecter ».
 */
/** The token looks like 123456789:AAH…; extracted even if extra words were pasted around it. */
const token = () => {
  const raw = process.env.TELEGRAM_BOT_TOKEN ?? "";
  return (raw.match(/\d{6,}:[A-Za-z0-9_-]{30,}/)?.[0] ?? raw).trim();
};
export const telegramConfigured = () => !!token();

export async function telegramChatId(): Promise<string | null> {
  if (process.env.TELEGRAM_CHAT_ID?.trim()) return process.env.TELEGRAM_CHAT_ID.trim();
  return (await db.appSetting.findUnique({ where: { key: "telegramChatId" } }))?.value ?? null;
}

/** Calls the Telegram API with a generous timeout and one automatic retry (slow networks, rate limits). */
async function tg(method: string, body?: unknown): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // Online, go through the European relay (the Singapore servers often cannot reach Telegram)
      const relay = process.env.VERCEL && process.env.APP_URL && process.env.CRON_SECRET && attempt === 0;
      const res = relay
        ? await fetch(`${process.env.APP_URL!.replace(/\/+$/, "")}/api/telegram-relay`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET!.trim()}` },
            body: JSON.stringify({ method, body }),
            signal: AbortSignal.timeout(15000),
          })
        : await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
            method: body ? "POST" : "GET",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(12000),
          });
      if (res.status === 429 && attempt === 0) {
        const wait = Number((await res.clone().json().catch(() => ({})))?.parameters?.retry_after ?? 3);
        await new Promise((r) => setTimeout(r, Math.min(wait, 15) * 1000));
        continue;
      }
      return res;
    } catch (e) {
      console.error(`[telegram] ${method} network error (try ${attempt + 1}):`, e instanceof Error ? `${e.name} ${e.message}` : e);
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}

export async function sendTelegram(text: string, chatId?: string | null): Promise<boolean> {
  const t = token();
  const chat = chatId ?? (await telegramChatId());
  if (!t || !chat) return false;
  const res = await tg("sendMessage", { chat_id: chat, text: text.slice(0, 4000), disable_web_page_preview: true });
  if (!res?.ok) console.error("[telegram] sendMessage error", res ? `${res.status} ${(await res.text()).slice(0, 200)}` : "network error");
  return !!res?.ok;
}

export async function connectTelegram(): Promise<{ ok: boolean; name?: string; reason?: string }> {
  const t = token();
  if (!t) return { ok: false, reason: "token" };
  const res = await tg("getUpdates");
  if (!res?.ok) {
    console.error("[telegram] getUpdates refused:", res ? `${res.status} ${(await res.text()).slice(0, 200)}` : "network error");
    return { ok: false, reason: "token" };
  }
  const data = (await res.json()) as { result?: { message?: { chat: { id: number; first_name?: string; username?: string } } }[] };
  const last = [...(data.result ?? [])].reverse().find((u) => u.message?.chat?.id);
  if (!last?.message) return { ok: false, reason: "nomessage" };
  const chat = last.message.chat;
  await db.appSetting.upsert({ where: { key: "telegramChatId" }, create: { key: "telegramChatId", value: String(chat.id) }, update: { value: String(chat.id) } });
  await sendTelegram("✅ Diyafa est connecté : vous recevrez ici les alertes et le rapport du matin.", String(chat.id));
  return { ok: true, name: chat.first_name ?? chat.username };
}

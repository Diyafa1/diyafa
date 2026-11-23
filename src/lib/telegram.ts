import "server-only";
import { db } from "./db";

/**
 * Owner alerts on Telegram (free, official Bot API).
 * Setup: create a bot with @BotFather → token in Vercel as TELEGRAM_BOT_TOKEN →
 * send any message to the bot → Admin → Commissions → Telegram → « Connecter ».
 */
const token = () => (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
export const telegramConfigured = () => !!token();

export async function telegramChatId(): Promise<string | null> {
  if (process.env.TELEGRAM_CHAT_ID?.trim()) return process.env.TELEGRAM_CHAT_ID.trim();
  return (await db.appSetting.findUnique({ where: { key: "telegramChatId" } }))?.value ?? null;
}

export async function sendTelegram(text: string, chatId?: string | null): Promise<boolean> {
  const t = token();
  const chat = chatId ?? (await telegramChatId());
  if (!t || !chat) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: text.slice(0, 4000), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[telegram] error", res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error("[telegram] failed", e instanceof Error ? e.message : e);
    return false;
  }
}

/** Finds the chat of the person who last wrote to the bot, and remembers it. */
export async function connectTelegram(): Promise<{ ok: boolean; name?: string; reason?: string }> {
  const t = token();
  if (!t) return { ok: false, reason: "token" };
  const res = await fetch(`https://api.telegram.org/bot${t}/getUpdates`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!res?.ok) return { ok: false, reason: "token" };
  const data = (await res.json()) as { result?: { message?: { chat: { id: number; first_name?: string; username?: string } } }[] };
  const last = [...(data.result ?? [])].reverse().find((u) => u.message?.chat?.id);
  if (!last?.message) return { ok: false, reason: "nomessage" };
  const chat = last.message.chat;
  await db.appSetting.upsert({ where: { key: "telegramChatId" }, create: { key: "telegramChatId", value: String(chat.id) }, update: { value: String(chat.id) } });
  await sendTelegram("✅ Diyafa est connecté : vous recevrez ici les alertes et le rapport du matin.", String(chat.id));
  return { ok: true, name: chat.first_name ?? chat.username };
}

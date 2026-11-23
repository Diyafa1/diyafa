import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { connectTelegram, sendTelegram } from "@/lib/telegram";

afterEach(() => { vi.unstubAllGlobals(); delete process.env.TELEGRAM_BOT_TOKEN; });

describe("Telegram alerts", () => {
  it("does nothing when not configured", async () => {
    expect(await sendTelegram("hello")).toBe(false);
  });
  it("connects to the last person who wrote to the bot, then sends messages there", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    const sent: { url: string; body?: string }[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      sent.push({ url, body: init?.body as string | undefined });
      if (url.endsWith("/getUpdates")) return new Response(JSON.stringify({ result: [{ message: { chat: { id: 4242, first_name: "Redouane" } } }] }));
      return new Response(JSON.stringify({ ok: true }));
    });
    expect(await connectTelegram()).toEqual({ ok: true, name: "Redouane" });
    expect((await db.appSetting.findUnique({ where: { key: "telegramChatId" } }))?.value).toBe("4242");
    expect(await sendTelegram("🟢 Nouvelle réservation")).toBe(true);
    expect(JSON.parse(sent.at(-1)!.body!).chat_id).toBe("4242");
  });
});

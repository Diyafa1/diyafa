import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { db } from "@/lib/db";
import { sendGuestWelcome, sendHostWelcome } from "@/lib/welcome";

describe("welcome e-mails", () => {
  it("traveller and host get their own welcome, in their language, signed by the team", async () => {
    await sendGuestWelcome({ email: "w-guest@t", name: "Amina Benali", locale: "fr" });
    await sendHostWelcome({ email: "w-host@t", name: "Youssef", locale: "ar" });
    const g = await db.emailLog.findFirst({ where: { to: "w-guest@t" } });
    const h = await db.emailLog.findFirst({ where: { to: "w-host@t" } });
    expect(g?.subject).toContain("Bienvenue sur Al-Diyafa");
    expect(g?.body).toContain("As-salamu alaykum Amina");
    expect(g?.body).toContain("L'équipe Al-Diyafa");
    expect(g?.body).not.toContain("20 %");
    expect(h?.subject).toContain("مرحبًا بك في الضيافة");
    expect(h?.body).toContain("20%");
    expect(h?.body).toContain("فريق الضيافة");
  });
});

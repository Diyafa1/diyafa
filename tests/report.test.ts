import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { buildReport, reportEmail } from "@/lib/report";

describe("daily report", () => {
  it("counts sign-ups and builds a readable e-mail", async () => {
    const from = new Date(Date.now() - 3600000);
    const to = new Date(Date.now() + 3600000);
    await db.user.create({ data: { email: `report-${Date.now()}@t`, name: "R", passwordHash: "x" } });
    const r = await buildReport(from, to);
    expect(r.newGuests).toBeGreaterThanOrEqual(1);
    const c = reportEmail(r, "lundi 23 novembre");
    expect(c.title).toBe("Rapport du lundi 23 novembre");
    expect(c.rows.find(([k]) => k === "Nouveaux clients inscrits")?.[1]).toBe(String(r.newGuests));
  });
});

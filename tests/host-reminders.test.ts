import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { hostsWithoutListing, remindHostsWithoutListing } from "@/lib/host-reminders";

const MONDAY = new Date("2026-11-30T05:00:00Z");
const TUESDAY = new Date("2026-12-01T05:00:00Z");

describe("weekly reminder to hosts without a listing", () => {
  beforeAll(async () => {
    const mk = (email: string, extra = {}) => db.user.create({ data: { email, name: email, passwordHash: "x", role: "HOST", ...extra } });
    const profile = (status: "APPROVED" | "PENDING") => ({ hostProfile: { create: { displayName: "H", whatsapp: "1", idNumber: "I", status } } });
    await mk("rem-noprofile@t");
    await mk("rem-approved@t", profile("APPROVED"));
    await mk("rem-pending@t", profile("PENDING"));
    const withListing = await mk("rem-listed@t", profile("APPROVED"));
    await db.listing.create({ data: { hostId: withListing.id, city: "MAKKAH", title: "T", description: "D", address: "A", distanceToHaramM: 300, status: "APPROVED", type: "SHORT_STAY", pricePerNight: 5000, maxGuests: 2 } });
    const draftOnly = await mk("rem-draft@t", profile("APPROVED"));
    await db.listing.create({ data: { hostId: draftOnly.id, city: "MAKKAH", title: "T", description: "D", address: "A", distanceToHaramM: 300, status: "DRAFT", type: "SHORT_STAY", pricePerNight: 5000, maxGuests: 2 } });
  });

  it("targets hosts with no published listing (drafts count as none), not those waiting for approval", async () => {
    const emails = (await hostsWithoutListing()).map((u) => u.email).filter((e) => e.startsWith("rem-")).sort();
    expect(emails).toEqual(["rem-approved@t", "rem-draft@t", "rem-noprofile@t"]);
  });

  it("only runs on Mondays, and never twice in the same week", async () => {
    const mine = () => db.emailLog.count({ where: { to: { startsWith: "rem-" } } });
    expect(await remindHostsWithoutListing({ now: TUESDAY })).toBe(0);
    await remindHostsWithoutListing({ now: MONDAY });
    expect(await mine()).toBe(3);
    await remindHostsWithoutListing({ force: true });
    expect(await mine()).toBe(3);
  });
});

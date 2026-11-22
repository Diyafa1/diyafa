import { describe, expect, it } from "vitest";
import { computeQuote, nightlySubtotal, seasonPercent } from "@/lib/pricing";
import { computeCancellation, guestRefundShare } from "@/lib/cancellation";
import { addMonths, checkInInstant, eachNight, parseDay } from "@/lib/dates";
import { checkAccess } from "@/lib/access";
import { distanceMeters, HARAM_COORDS, walkMinutes } from "@/lib/haram";

describe("prices, commissions and VAT", () => {
  it("1,000 € stay with 20% host + 10% guest: Diyafa's share online, the rest on site", () => {
    const q = computeQuote(100000, { hostPercent: 20, guestFeePercent: 10, vatPercent: 0 });
    expect(q.serviceFee).toBe(10000); // 100 € paid by the guest
    expect(q.hostCommission).toBe(20000); // 200 € taken from the host's price
    expect(q.onlineAmount).toBe(30000); // 300 € paid online by card
    expect(q.payOnSite).toBe(80000); // 800 € paid to the host on arrival
    expect(q.total).toBe(110000); // the guest pays 1,100 € in total
    expect(q.platformRevenue).toBe(30000); // Diyafa keeps 300 €
    expect(q.hostPayout).toBe(0); // Diyafa owes nothing to the host
  });
  it("VAT applies only to Diyafa's share", () => {
    const q = computeQuote(100000, { hostPercent: 20, guestFeePercent: 10, vatPercent: 15 });
    expect(q.vat).toBe(4500); // 15% of 300 €
    expect(q.onlineAmount).toBe(34500);
    expect(q.payOnSite).toBe(80000);
    expect(q.total).toBe(q.onlineAmount + q.payOnSite);
  });
  it("handles zero rates", () => {
    const q = computeQuote(5000, { hostPercent: 0, guestFeePercent: 0, vatPercent: 0 });
    expect(q.total).toBe(5000);
    expect(q.onlineAmount).toBe(0);
    expect(q.payOnSite).toBe(5000);
  });
  it("rejects invalid amounts", () => {
    expect(() => computeQuote(-1, { hostPercent: 0, guestFeePercent: 0, vatPercent: 0 })).toThrow();
  });
  it("uses special day prices from the calendar", () => {
    const nights = eachNight(parseDay("2026-03-01"), parseDay("2026-03-04"));
    expect(nightlySubtotal(nights, 10000, new Map([["2026-03-02", 25000]]))).toBe(45000);
  });
});

describe("cancellation policies", () => {
  const now = new Date("2026-03-01T12:00:00Z");
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000);
  it("flexible", () => {
    expect(guestRefundShare("FLEXIBLE", inDays(2), now)).toBe(1);
    expect(guestRefundShare("FLEXIBLE", inDays(0.5), now)).toBe(0.5);
  });
  it("moderate", () => {
    expect(guestRefundShare("MODERATE", inDays(6), now)).toBe(1);
    expect(guestRefundShare("MODERATE", inDays(3), now)).toBe(0.5);
    expect(guestRefundShare("MODERATE", inDays(0.5), now)).toBe(0);
  });
  it("strict", () => {
    expect(guestRefundShare("STRICT", inDays(15), now)).toBe(1);
    expect(guestRefundShare("STRICT", inDays(8), now)).toBe(0.5);
    expect(guestRefundShare("STRICT", inDays(3), now)).toBe(0);
  });
  const b = { onlineAmount: 30000, status: "CONFIRMED", checkIn: inDays(3), cancellationPolicy: "MODERATE" as const };
  it("only the online part can be refunded, following the policy", () => {
    expect(computeCancellation(b, "guest", now).refundAmount).toBe(15000);
  });
  it("host or admin cancellation refunds the whole online part", () => {
    expect(computeCancellation(b, "host", now).refundAmount).toBe(30000);
    expect(computeCancellation(b, "admin", now).refundAmount).toBe(30000);
    expect(computeCancellation(b, "admin", now, 0.3).refundAmount).toBe(9000);
  });
  it("a request not yet accepted is fully refunded", () => {
    expect(computeCancellation({ ...b, status: "REQUESTED" }, "guest", now).refundAmount).toBe(30000);
  });
});

describe("access to the three spaces", () => {
  it("visitors are sent to login", () => {
    for (const p of ["/admin", "/host", "/trips", "/messages/x", "/account"]) expect(checkAccess(p, null)).toBe("login");
  });
  it("public pages are open", () => {
    for (const p of ["/", "/search", "/listings/abc", "/help", "/login"]) expect(checkAccess(p, null)).toBe("allow");
  });
  it("guests cannot open host or admin spaces", () => {
    expect(checkAccess("/admin", "GUEST")).toBe("forbidden");
    expect(checkAccess("/admin/settings", "GUEST")).toBe("forbidden");
    expect(checkAccess("/host", "GUEST")).toBe("forbidden");
    expect(checkAccess("/host/listings", "GUEST")).toBe("forbidden");
    expect(checkAccess("/host/onboarding", "GUEST")).toBe("allow");
  });
  it("hosts cannot open the admin space", () => {
    expect(checkAccess("/admin", "HOST")).toBe("forbidden");
    expect(checkAccess("/host/listings", "HOST")).toBe("allow");
  });
  it("admins can open the admin space", () => {
    expect(checkAccess("/admin/payouts", "ADMIN")).toBe("allow");
  });
  it("prefix tricks do not bypass rules", () => {
    expect(checkAccess("/administrator", null)).toBe("allow"); // not /admin
    expect(checkAccess("/admin/../admin", "GUEST")).toBe("forbidden");
  });
});

describe("dates and distances", () => {
  it("adds months safely at month end", () => {
    expect(addMonths(parseDay("2026-01-31"), 1).toISOString().slice(0, 10)).toBe("2026-02-28");
    expect(addMonths(parseDay("2026-01-15"), 12).toISOString().slice(0, 10)).toBe("2027-01-15");
  });
  it("computes distance to the Haram", () => {
    const d = distanceMeters({ lat: 21.4195, lng: 39.8262 }, HARAM_COORDS.MAKKAH);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(400);
    expect(walkMinutes(750)).toBe(10);
  });
});

describe("seasons, promo codes, check-in time", () => {
  const ramadan = { startDate: parseDay("2027-02-08"), endDate: parseDay("2027-03-09"), percent: 30 };
  it("raises the nightly price during the season, but the host's special price wins", () => {
    const nights = eachNight(parseDay("2027-02-07"), parseDay("2027-02-10")); // 7, 8, 9 Feb
    expect(seasonPercent(parseDay("2027-02-07"), [ramadan])).toBe(0);
    expect(nightlySubtotal(nights, 10000, new Map(), [ramadan])).toBe(10000 + 13000 + 13000);
    expect(nightlySubtotal(nights, 10000, new Map([["2027-02-09", 20000]]), [ramadan])).toBe(10000 + 13000 + 20000);
  });
  it("a promo discount comes out of Diyafa's share, never the host's", () => {
    const q = computeQuote(100000, { hostPercent: 20, guestFeePercent: 10, vatPercent: 0 }, 10);
    expect(q.discount).toBe(10000);
    expect(q.onlineAmount).toBe(20000); // 300 € - 100 €
    expect(q.payOnSite).toBe(80000); // host still gets 800 €
    expect(q.total).toBe(100000);
    // a discount can never exceed Diyafa's share
    expect(computeQuote(100000, { hostPercent: 20, guestFeePercent: 10, vatPercent: 0 }, 100).onlineAmount).toBe(0);
  });
  it("check-in time is Makkah time (UTC+3)", () => {
    expect(checkInInstant(parseDay("2027-03-01"), "15:00").toISOString()).toBe("2027-03-01T12:00:00.000Z");
    expect(checkInInstant(parseDay("2027-03-01"), "02:00").toISOString()).toBe("2027-02-28T23:00:00.000Z");
  });
});

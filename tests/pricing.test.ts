import { describe, expect, it } from "vitest";
import { computeQuote, nightlySubtotal } from "@/lib/pricing";
import { computeCancellation, guestRefundShare } from "@/lib/cancellation";
import { addMonths, eachNight, parseDay } from "@/lib/dates";
import { checkAccess } from "@/lib/access";
import { distanceMeters, HARAM_COORDS, walkMinutes } from "@/lib/haram";

describe("prices, commissions and VAT", () => {
  it("splits 1,000 € correctly (10% host, 5% guest fee, 15% VAT)", () => {
    const q = computeQuote(100000, { hostPercent: 10, guestFeePercent: 5, vatPercent: 15 });
    expect(q.serviceFee).toBe(5000); // 50 €
    expect(q.vat).toBe(15750); // 15% of 1,050 €
    expect(q.total).toBe(120750); // 1,207.50 €
    expect(q.hostCommission).toBe(10000);
    expect(q.hostPayout).toBe(90000);
    expect(q.platformRevenue).toBe(15000);
    // guest pays = host gets + Diyafa keeps + VAT
    expect(q.total).toBe(q.hostPayout + q.platformRevenue + q.vat);
  });
  it("handles zero rates", () => {
    const q = computeQuote(5000, { hostPercent: 0, guestFeePercent: 0, vatPercent: 0 });
    expect(q.total).toBe(5000);
    expect(q.hostPayout).toBe(5000);
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
  const b = { total: 120750, subtotal: 100000, hostPercent: 10, status: "CONFIRMED", checkIn: inDays(3), cancellationPolicy: "MODERATE" as const };
  it("partial refund keeps the host's share of the kept part", () => {
    const o = computeCancellation(b, "guest", now);
    expect(o.refundAmount).toBe(60375);
    expect(o.newHostPayout).toBe(45000);
    expect(o.newHostCommission).toBe(5000);
  });
  it("host or admin cancellation refunds everything", () => {
    expect(computeCancellation(b, "host", now)).toEqual({ refundAmount: 120750, newHostPayout: 0, newHostCommission: 0 });
    expect(computeCancellation(b, "admin", now).refundAmount).toBe(120750);
    expect(computeCancellation(b, "admin", now, 0.3).refundAmount).toBe(36225);
  });
  it("a request not yet accepted is fully refunded", () => {
    expect(computeCancellation({ ...b, status: "REQUESTED" }, "guest", now).refundAmount).toBe(120750);
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

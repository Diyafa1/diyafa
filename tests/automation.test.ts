import { beforeAll, describe, expect, it } from "vitest";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { cancelBooking, createBooking, markPaymentPaid } from "@/lib/bookings";
import { autoDeclineStaleRequests } from "@/lib/automations";
import { setNumberSetting } from "@/lib/settings";
import { addDays, todayUTC } from "@/lib/dates";

const d = (n: number) => addDays(todayUTC(), n);

describe("employee permissions", () => {
  const staff = { role: "STAFF" as const, permissions: ["hosts", "moderation"] };
  it("employees only get what the owner ticked, never money or staff management", () => {
    expect(can(staff, "hosts")).toBe(true);
    expect(can(staff, "moderation")).toBe(true);
    expect(can(staff, "refunds")).toBe(false);
    expect(can(staff, "finances")).toBe(false);
    expect(can(staff, "settings")).toBe(false);
    expect(can(staff, "staff")).toBe(false);
    expect(can(staff, "payments")).toBe(false);
  });
  it("the owner can do everything, travellers and hosts nothing", () => {
    expect(can({ role: "ADMIN", permissions: [] }, "finances")).toBe(true);
    expect(can({ role: "HOST", permissions: ["hosts"] }, "hosts")).toBe(false);
  });
});

describe("automations", () => {
  let host: User, guest: User, staffUser: User;
  let flat: string, other: string;
  beforeAll(async () => {
    const mk = (email: string, extra = {}) => db.user.create({ data: { email, name: email, passwordHash: "x", ...extra } });
    host = await mk("auto-h@t", { role: "HOST", hostProfile: { create: { displayName: "H", whatsapp: "1", idNumber: "I", status: "APPROVED" } } });
    guest = await mk("auto-g@t", { gender: "MALE" });
    staffUser = await mk("auto-s@t", { role: "STAFF", permissions: ["bookings"] });
    const common = { hostId: host.id, city: "MADINAH" as const, title: "T", description: "D", address: "A", distanceToHaramM: 500, status: "APPROVED" as const, type: "SHORT_STAY" as const, pricePerNight: 10000, maxGuests: 4, instantBook: true };
    flat = (await db.listing.create({ data: common })).id;
    other = (await db.listing.create({ data: common })).id;
  });

  const paidBooking = async (listingId: string, offset: number) => {
    const { booking } = await createBooking(guest, { listingId, checkIn: d(offset), checkOut: d(offset + 1), guests: 1 });
    await markPaymentPaid((await db.payment.findFirstOrThrow({ where: { bookingId: booking.id } })).id);
    return booking;
  };

  it("records who cancelled, when and why; an employee without the refund right cannot cancel", async () => {
    const b = await paidBooking(flat, 100);
    await expect(cancelBooking(b.id, staffUser, "x")).rejects.toThrow();
    await cancelBooking(b.id, host, "Appartement en travaux");
    const after = await db.booking.findUniqueOrThrow({ where: { id: b.id } });
    expect(after.cancelledBy).toBe("host");
    expect(after.cancelReason).toBe("Appartement en travaux");
    expect(after.cancelledAt).not.toBeNull();
  });

  it("a host who cancels too often has all their listings hidden automatically", async () => {
    await setNumberSetting("autoSuspendHostCancellations", 3);
    for (const off of [110, 120]) await cancelBooking((await paidBooking(flat, off)).id, host, "Indisponible");
    const listings = await db.listing.findMany({ where: { hostId: host.id } });
    expect(listings.every((l) => l.status === "SUSPENDED")).toBe(true); // 3rd cancellation → both listings hidden
    expect(listings[0].rejectionReason).toMatch(/automatiquement/);
    await db.listing.updateMany({ where: { hostId: host.id }, data: { status: "APPROVED", rejectionReason: null } });
  });

  it("a request not answered in time is declined and refunded automatically", async () => {
    await setNumberSetting("requestAutoDeclineHours", 24);
    await db.listing.update({ where: { id: other }, data: { instantBook: false } });
    const b = await paidBooking(other, 130);
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("REQUESTED");
    expect(await autoDeclineStaleRequests()).toBe(0); // too early
    await db.booking.update({ where: { id: b.id }, data: { requestedAt: new Date(Date.now() - 25 * 3600000) } });
    expect(await autoDeclineStaleRequests()).toBe(1);
    const after = await db.booking.findUniqueOrThrow({ where: { id: b.id } });
    expect(after.status).toBe("DECLINED");
    expect(after.cancelledBy).toBe("auto");
    expect(after.refundedAmount).toBe(after.onlineAmount);
  });
});

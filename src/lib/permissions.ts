import type { User } from "@prisma/client";

/**
 * What an employee (STAFF) can be allowed to do. The owner (ADMIN) can always do everything.
 * Money (turnover, commissions, payments, rates) and staff management are owner-only and never listed here.
 */
export const PERMISSIONS = [
  "hosts", // validate / refuse hosts, see ID documents
  "listings", // validate / refuse / suspend listings
  "bookings", // see bookings (without Diyafa's revenue)
  "refunds", // cancel bookings and refund
  "cancellations", // see who cancels and why
  "users", // suspend / reactivate travellers and hosts
  "moderation", // reviews and reported messages
  "disputes", // handle problems reported by travellers / hosts
  "contact", // contact form messages
  "promos", // promo codes
  "seasons", // seasonal price increases
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const OWNER_ONLY = ["finances", "payments", "settings", "staff"] as const;
export type Section = Permission | (typeof OWNER_ONLY)[number] | "dashboard";

export function can(user: Pick<User, "role" | "permissions"> | null, section: Section): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "STAFF") return false;
  if (section === "dashboard") return true;
  return (user.permissions as string[]).includes(section);
}

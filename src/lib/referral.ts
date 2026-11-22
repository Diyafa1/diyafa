import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const REF_COOKIE = "diyafa_ref";

/** Returns the user's personal invitation code, creating it the first time. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (u?.referralCode) return u.referralCode;
  for (;;) {
    const code = crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
    try {
      await db.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      /* rare collision: try again */
    }
  }
}

/** At sign-up: id of the friend whose invitation link was used, if any. */
export async function referrerFromCookie(): Promise<string | null> {
  const code = (await cookies()).get(REF_COOKIE)?.value;
  if (!code) return null;
  const u = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  return u?.id ?? null;
}

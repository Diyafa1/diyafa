import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { startSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { GOOGLE_STATE_COOKIE, googleEnabled, googleProfileFromCode } from "@/lib/google";

/** Step 2: Google sends the visitor back here. We check everything server-side, then log in or create the account. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (code = "google") => NextResponse.redirect(new URL(`/login?error=${code}`, req.url));
  if (!googleEnabled()) return fail();
  const jar = await cookies();
  let saved: { state: string; next: string; intent: string };
  try {
    saved = JSON.parse(jar.get(GOOGLE_STATE_COOKIE)?.value ?? "");
  } catch {
    return fail();
  }
  jar.delete(GOOGLE_STATE_COOKIE);
  const code = url.searchParams.get("code");
  if (!code || url.searchParams.get("state") !== saved.state) return fail();

  const profile = await googleProfileFromCode(code);
  if (!profile) return fail();

  let user = await db.user.findUnique({ where: { email: profile.email } });
  if (user?.status === "SUSPENDED") return fail("suspended");
  let isNew = false;
  if (!user) {
    const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    user = await db.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        passwordHash: "!google", // no password: this account signs in with Google
        role: admins.includes(profile.email) ? "ADMIN" : "GUEST",
        locale: await getLocale(),
      },
    });
    isNew = true;
  }
  await startSession(user);
  const dest =
    user.role === "ADMIN" ? "/admin"
    : isNew && saved.intent === "host" ? "/host/onboarding"
    : saved.next || (user.role === "HOST" ? "/host" : "/");
  return NextResponse.redirect(new URL(dest, req.url));
}

"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { safeNext, str } from "@/lib/forms";
import { referrerFromCookie } from "@/lib/referral";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200).transform((s) => s.toLowerCase()),
  phone: z.string().max(30).optional(),
  password: z.string().min(8).max(200),
  intent: z.enum(["guest", "host"]),
});

export async function registerAction(formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email"),
    phone: str(formData, "phone") || undefined,
    password: String(formData.get("password") ?? ""),
    intent: str(formData, "intent") || "guest",
  });
  if (!parsed.success) redirect("/register?error=form");
  const d = parsed.data;
  if (await db.user.findUnique({ where: { email: d.email } })) redirect("/register?error=exists");
  // E-mails listed in ADMIN_EMAILS become administrators when they sign up
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const user = await db.user.create({
    data: { referredById: await referrerFromCookie(), role: admins.includes(d.email) ? "ADMIN" : "GUEST", name: d.name, email: d.email, phone: d.phone, passwordHash: await hashPassword(d.password), locale: await getLocale() },
  });
  await startSession(user);
  redirect(user.role === "ADMIN" ? "/admin" : d.intent === "host" ? "/host/onboarding" : safeNext(str(formData, "next")));
}

export async function loginAction(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(str(formData, "next"), "");
  const user = await db.user.findUnique({ where: { email } });
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) redirect(`/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  if (user.status === "SUSPENDED") redirect("/login?error=suspended");
  await startSession(user);
  redirect(next || (user.role === "ADMIN" || user.role === "STAFF" ? "/admin" : user.role === "HOST" ? "/host" : "/"));
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

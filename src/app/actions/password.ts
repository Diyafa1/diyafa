"use server";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword, startSession } from "@/lib/auth";
import { emailSimple } from "@/lib/emails";
import { str } from "@/lib/forms";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

/** Always answers the same way, so nobody can find out which e-mails have an account. */
export async function forgotPasswordAction(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (user && user.status === "ACTIVE") {
    const recent = await db.passwordReset.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 10 * 60000) } } });
    if (recent < 3) {
      const token = crypto.randomBytes(32).toString("hex");
      await db.passwordReset.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60000) } });
      const link = `${process.env.APP_URL || "http://localhost:3000"}/reset?token=${token}`;
      await emailSimple(user, user.locale === "ar" ? "الضيافة — كلمة مرور جديدة" : user.locale === "en" ? "Al-Diyafa — new password" : "Al-Diyafa — nouveau mot de passe", user.locale === "ar" ? "اختر كلمة مرور جديدة" : user.locale === "en" ? "Choose a new password" : "Choisissez un nouveau mot de passe", [user.locale === "ar" ? "الرابط صالح لمدة ساعة. إذا لم تطلب ذلك فتجاهل هذه الرسالة." : user.locale === "en" ? "This link is valid for 1 hour. If you did not ask for it, ignore this e-mail." : "Ce lien est valable 1 heure. Si vous n'avez rien demandé, ignorez cet e-mail."], { label: user.locale === "ar" ? "اختيار كلمة مرور" : user.locale === "en" ? "Choose a password" : "Choisir un mot de passe", url: link });
    }
  }
  redirect("/forgot?sent=1");
}

export async function resetPasswordAction(fd: FormData) {
  const token = str(fd, "token");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) redirect(`/reset?token=${encodeURIComponent(token)}&error=short`);
  const r = await db.passwordReset.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!r || r.usedAt || r.expiresAt < new Date() || r.user.status !== "ACTIVE") redirect("/reset?error=invalid");
  const user = await db.user.update({ where: { id: r.userId }, data: { passwordHash: await hashPassword(password) } });
  await db.passwordReset.updateMany({ where: { userId: r.userId, usedAt: null }, data: { usedAt: new Date() } });
  await startSession(user);
  redirect("/account?saved=1");
}

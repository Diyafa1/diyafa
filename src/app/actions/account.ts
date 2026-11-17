"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { hashPassword, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { str } from "@/lib/forms";
import { isLocale } from "@/lib/i18n";

export async function updateAccountAction(formData: FormData) {
  const user = await requireUser();
  const schema = z.object({
    name: z.string().min(2).max(100),
    phone: z.string().max(30),
    gender: z.enum(["MALE", "FEMALE", ""]),
    locale: z.string(),
    password: z.string().max(200),
  });
  const p = schema.safeParse({
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    gender: str(formData, "gender"),
    locale: str(formData, "locale"),
    password: String(formData.get("password") ?? ""),
  });
  if (!p.success || (p.data.password && p.data.password.length < 8)) redirect("/account?error=form");
  const d = p.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      name: d.name,
      phone: d.phone || null,
      gender: d.gender || null,
      locale: isLocale(d.locale) ? d.locale : user.locale,
      ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
    },
  });
  if (isLocale(d.locale)) (await cookies()).set("locale", d.locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  redirect("/account?saved=1");
}

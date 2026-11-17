"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/lib/i18n";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function setLocaleAction(formData: FormData) {
  const l = formData.get("locale");
  if (!isLocale(l)) return;
  (await cookies()).set("locale", l, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const u = await getUser();
  if (u) await db.user.update({ where: { id: u.id }, data: { locale: l } });
  revalidatePath("/", "layout");
}

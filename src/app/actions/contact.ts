"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { str } from "@/lib/forms";
import { sendEmail } from "@/lib/email";
import { notifyOwner } from "@/lib/notify";

export async function contactAction(fd: FormData) {
  if (str(fd, "website")) redirect("/contact?sent=1"); // honeypot against bots
  const p = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(200),
    subject: z.string().min(2).max(200),
    body: z.string().min(5).max(5000),
  }).safeParse({ name: str(fd, "name"), email: str(fd, "email"), subject: str(fd, "subject"), body: str(fd, "body") });
  if (!p.success) redirect("/contact?error=1");
  await db.contactMessage.create({ data: p.data });
  await notifyOwner(`Diyafa — contact : ${p.data.subject}`, `${p.data.name} <${p.data.email}>\n\n${p.data.body}`);
  redirect("/contact?sent=1");
}

"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { str } from "@/lib/forms";
import { emailSimple } from "@/lib/emails";
import { PUBLIC_LISTING } from "@/lib/listings";
import { checkContact } from "@/lib/contact-filter";

export async function startConversationAction(formData: FormData) {
  const user = await requireUser();
  const listingId = str(formData, "listingId");
  const listing = await db.listing.findFirst({ where: { id: listingId, ...PUBLIC_LISTING } });
  if (!listing || listing.hostId === user.id || listing.type === "LONG_TERM") redirect(listing ? `/listings/${listing.id}` : "/messages");
  const c = await db.conversation.upsert({
    where: { listingId_guestId: { listingId, guestId: user.id } },
    create: { listingId, guestId: user.id, hostId: listing.hostId },
    update: {},
  });
  redirect(`/messages/${c.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const user = await requireUser();
  const id = str(formData, "conversationId");
  const body = str(formData, "body").slice(0, 4000);
  const c = await db.conversation.findUnique({ where: { id }, include: { guest: true, host: true, listing: true } });
  if (!c || (c.guestId !== user.id && c.hostId !== user.id)) redirect("/messages");
  if (!body) return;
  if (!checkContact(body).ok) {
    // Not delivered: kept hidden and flagged so the admin can see repeated attempts.
    await db.message.create({ data: { conversationId: id, senderId: user.id, body, hidden: true, reported: true } });
    redirect(`/messages/${id}?blocked=1`);
  }
  await db.message.create({ data: { conversationId: id, senderId: user.id, body } });
  await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  const other = c.guestId === user.id ? c.host : c.guest;
  await emailSimple(other, `Dar Diyafa — nouveau message de ${user.name}`, `Nouveau message de ${user.name}`, [c.listing.title, `« ${body.slice(0, 300)} »`], { label: "Répondre", url: `${process.env.APP_URL || ""}/messages/${id}` });
  revalidatePath(`/messages/${id}`);
}

export async function reportMessageAction(formData: FormData) {
  const user = await requireUser();
  const m = await db.message.findUnique({ where: { id: str(formData, "messageId") }, include: { conversation: true } });
  if (!m || m.senderId === user.id || (m.conversation.guestId !== user.id && m.conversation.hostId !== user.id)) return;
  await db.message.update({ where: { id: m.id }, data: { reported: true } });
  revalidatePath(`/messages/${m.conversationId}`);
}

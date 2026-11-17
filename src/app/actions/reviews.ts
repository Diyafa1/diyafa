"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { int, str } from "@/lib/forms";
import { sendEmail } from "@/lib/email";

export async function createReviewAction(formData: FormData) {
  const user = await requireUser();
  const bookingId = str(formData, "bookingId");
  const rating = int(formData, "rating") ?? 0;
  const comment = str(formData, "comment").slice(0, 2000);
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { review: true } });
  if (!b || b.guestId !== user.id || b.status !== "COMPLETED" || b.review || rating < 1 || rating > 5 || comment.length < 2)
    redirect(`/trips/${bookingId}`);
  await db.review.create({ data: { bookingId, listingId: b.listingId, authorId: user.id, rating, comment } });
  revalidatePath(`/listings/${b.listingId}`);
  redirect(`/trips/${bookingId}?review=thanks`);
}

export async function replyReviewAction(formData: FormData) {
  const user = await requireUser();
  const r = await db.review.findUnique({ where: { id: str(formData, "reviewId") }, include: { listing: true } });
  if (!r || r.listing.hostId !== user.id) return;
  await db.review.update({ where: { id: r.id }, data: { hostReply: str(formData, "reply").slice(0, 2000) || null } });
  revalidatePath("/host/reviews");
  revalidatePath(`/listings/${r.listingId}`);
}

export async function openDisputeAction(formData: FormData) {
  const user = await requireUser();
  const bookingId = str(formData, "bookingId");
  const reason = str(formData, "reason").slice(0, 4000);
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { listing: true } });
  if (!b || (b.guestId !== user.id && b.listing.hostId !== user.id) || reason.length < 5) return;
  await db.dispute.create({ data: { bookingId, openedById: user.id, reason } });
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  for (const a of admins) await sendEmail(a.email, `Diyafa — nouveau litige ${b.code}`, reason.slice(0, 500));
  revalidatePath(`/trips/${bookingId}`);
  revalidatePath("/host/bookings");
}

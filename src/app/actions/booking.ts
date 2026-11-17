"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser, requireUser } from "@/lib/auth";
import { BookingError, cancelBooking, createBooking, markPaymentFailed, markPaymentPaid } from "@/lib/bookings";
import { parseBookingInput } from "@/lib/booking-input";
import { db } from "@/lib/db";
import { str } from "@/lib/forms";

export type ActionState = { error?: string; ok?: boolean } | null;

export async function bookAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) redirect(`/login?next=/listings/${str(formData, "listingId")}`);
  let url: string;
  try {
    const input = parseBookingInput(Object.fromEntries(formData));
    const r = await createBooking(user, input);
    url = r.redirectUrl;
  } catch (e) {
    if (e instanceof BookingError) return { error: e.code };
    if (e instanceof Error && e.message === "dates") return { error: "dates" };
    console.error(e);
    return { error: "generic" };
  }
  redirect(url);
}

/** Test gateway only: confirms or fails a payment. Disabled when a real provider is configured. */
export async function testPayAction(formData: FormData) {
  if ((process.env.PAYMENT_PROVIDER ?? "test") !== "test") throw new Error("disabled");
  const user = await requireUser();
  const pid = str(formData, "pid");
  const payment = await db.payment.findUnique({ where: { id: pid }, include: { booking: true } });
  if (!payment || payment.booking.guestId !== user.id) redirect("/trips");
  if (str(formData, "outcome") === "fail") {
    await markPaymentFailed(pid);
    redirect(`/trips/${payment.bookingId}?pay=failed`);
  }
  try {
    await markPaymentPaid(pid);
  } catch (e) {
    if (e instanceof BookingError) redirect(`/trips/${payment.bookingId}?pay=${e.code}`);
    throw e;
  }
  redirect(`/trips/${payment.bookingId}?pay=success`);
}

export async function cancelBookingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = str(formData, "bookingId");
  try {
    const share = formData.get("refundPercent");
    await cancelBooking(id, user, str(formData, "reason"), user.role === "ADMIN" && share !== null && share !== "" ? Number(share) / 100 : undefined);
  } catch (e) {
    if (e instanceof BookingError) return { error: e.code };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleFavoriteAction(formData: FormData) {
  const user = await getUser();
  const listingId = str(formData, "listingId");
  if (!user) redirect(`/login?next=/listings/${listingId}`);
  const where = { userId_listingId: { userId: user.id, listingId } };
  const existing = await db.favorite.findUnique({ where });
  if (existing) await db.favorite.delete({ where });
  else if (await db.listing.findUnique({ where: { id: listingId }, select: { id: true } }))
    await db.favorite.create({ data: { userId: user.id, listingId } });
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/favorites");
}

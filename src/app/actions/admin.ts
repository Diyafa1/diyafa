"use server";
import { revalidatePath } from "next/cache";
import type { ListingType, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { num, str } from "@/lib/forms";
import { sendEmail } from "@/lib/email";
import { createPayout } from "@/lib/payouts";

const admin = () => requireRole("ADMIN");
const refresh = () => revalidatePath("/", "layout");

export async function reviewHostAction(fd: FormData) {
  await admin();
  const p = await db.hostProfile.findUnique({ where: { id: str(fd, "id") }, include: { user: true } });
  if (!p) return;
  const approve = str(fd, "decision") === "approve";
  const reason = str(fd, "reason").slice(0, 500) || null;
  await db.hostProfile.update({
    where: { id: p.id },
    data: approve ? { status: "APPROVED", verifiedAt: new Date(), rejectionReason: null } : { status: "REJECTED", rejectionReason: reason },
  });
  await sendEmail(p.user.email, approve ? "Diyafa — compte hôte validé" : "Diyafa — demande d'hôte refusée", approve ? "Vous pouvez publier vos annonces." : `Raison : ${reason ?? "-"}`);
  refresh();
}

export async function reviewListingAction(fd: FormData) {
  await admin();
  const l = await db.listing.findUnique({ where: { id: str(fd, "id") }, include: { host: true } });
  if (!l) return;
  const d = str(fd, "decision");
  const reason = str(fd, "reason").slice(0, 500) || null;
  if (d === "delete") {
    const bookings = await db.booking.count({ where: { listingId: l.id } });
    if (bookings === 0) await db.listing.delete({ where: { id: l.id } });
    else await db.listing.update({ where: { id: l.id }, data: { status: "SUSPENDED", rejectionReason: reason } });
  } else {
    const status = d === "approve" ? "APPROVED" : d === "suspend" ? "SUSPENDED" : "REJECTED";
    await db.listing.update({ where: { id: l.id }, data: { status, rejectionReason: status === "APPROVED" ? null : reason } });
    await sendEmail(l.host.email, `Diyafa — annonce ${status === "APPROVED" ? "publiée" : status === "SUSPENDED" ? "suspendue" : "refusée"}`, `${l.title}${reason ? `\n${reason}` : ""}`);
  }
  refresh();
}

export async function userAction(fd: FormData) {
  const me = await admin();
  const id = str(fd, "id");
  if (id === me.id) return; // no self-lockout
  const op = str(fd, "op");
  if (op === "suspend") await db.user.update({ where: { id }, data: { status: "SUSPENDED" } });
  if (op === "activate") await db.user.update({ where: { id }, data: { status: "ACTIVE" } });
  if (op === "role") {
    const role = str(fd, "role") as Role;
    if (["GUEST", "HOST", "ADMIN"].includes(role)) await db.user.update({ where: { id }, data: { role } });
  }
  if (op === "delete") {
    const has = await db.booking.count({ where: { OR: [{ guestId: id }, { listing: { hostId: id } }] } });
    if (has === 0) {
      await db.message.deleteMany({ where: { senderId: id } });
      await db.conversation.deleteMany({ where: { OR: [{ guestId: id }, { hostId: id }] } });
      await db.user.delete({ where: { id } });
    } else await db.user.update({ where: { id }, data: { status: "SUSPENDED" } });
  }
  refresh();
}

export async function saveRatesAction(fd: FormData) {
  await admin();
  for (const type of ["SHORT_STAY", "SHARED_BED", "LONG_TERM"] as ListingType[]) {
    const clamp = (v: number | null, max: number) => (v === null || v < 0 ? 0 : Math.min(v, max));
    const data = {
      hostPercent: clamp(num(fd, `${type}.host`), 50),
      guestFeePercent: clamp(num(fd, `${type}.guest`), 50),
      vatPercent: clamp(num(fd, `${type}.vat`), 30),
    };
    await db.commissionSetting.upsert({ where: { listingType: type }, create: { listingType: type, ...data }, update: data });
  }
  refresh();
}

export async function createPayoutAction(fd: FormData) {
  await admin();
  await createPayout(str(fd, "hostId"));
  refresh();
}

export async function markPayoutPaidAction(fd: FormData) {
  await admin();
  const p = await db.payout.findUnique({ where: { id: str(fd, "id") }, include: { host: true } });
  if (!p || p.status === "PAID") return;
  await db.payout.update({ where: { id: p.id }, data: { status: "PAID", paidAt: new Date(), reference: str(fd, "reference").slice(0, 100) || null } });
  await sendEmail(p.host.email, "Diyafa — versement effectué", `${(p.amount / 100).toFixed(2)} SAR`);
  refresh();
}

export async function disputeAction(fd: FormData) {
  await admin();
  const status = str(fd, "status");
  if (!["RESOLVED", "CLOSED", "OPEN"].includes(status)) return;
  const d = await db.dispute.update({
    where: { id: str(fd, "id") },
    data: { status: status as "RESOLVED" | "CLOSED" | "OPEN", resolution: str(fd, "resolution").slice(0, 2000) || null },
    include: { openedBy: true },
  });
  await sendEmail(d.openedBy.email, "Diyafa — mise à jour de votre signalement", d.resolution ?? status);
  refresh();
}

export async function moderateAction(fd: FormData) {
  await admin();
  const kind = str(fd, "kind");
  const id = str(fd, "id");
  const hidden = str(fd, "op") === "hide";
  if (kind === "review") await db.review.update({ where: { id }, data: { hidden } });
  if (kind === "message") await db.message.update({ where: { id }, data: { hidden, reported: hidden ? true : false } });
  refresh();
}

export async function contactHandledAction(fd: FormData) {
  await admin();
  await db.contactMessage.update({ where: { id: str(fd, "id") }, data: { handled: true } });
  refresh();
}

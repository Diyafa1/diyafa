import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { computeCancellation } from "@/lib/cancellation";
import { formatMoney } from "@/lib/money";
import { checkInInstant, todayUTC } from "@/lib/dates";
import { CancelForm } from "@/components/CancelForm";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { Notice, StatusBadge } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";
import { createReviewAction, openDisputeAction } from "@/app/actions/reviews";
import { startConversationAction } from "@/app/actions/messages";
import type { TKey } from "@/lib/i18n";

export default async function TripPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pay?: string; review?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const { t, locale } = await getT();
  const b = await db.booking.findUnique({
    where: { id },
    include: {
      listing: { include: { photos: { orderBy: { position: "asc" }, take: 1 }, host: { include: { hostProfile: true } } } },
      bed: { include: { room: true } },
      review: true,
      disputes: true,
      payments: { where: { kind: "CHARGE", status: "INITIATED" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!b || b.guestId !== user.id) notFound();
  const canCancel = ["REQUESTED", "CONFIRMED"].includes(b.status) && b.checkIn > todayUTC() && !b.payoutId;
  const preview = canCancel ? computeCancellation({ ...b, checkIn: checkInInstant(b.checkIn, b.listing.checkInTime) }, "guest", new Date()) : null;
  const wa = b.listing.host.hostProfile?.whatsapp?.replace(/[^\d]/g, "");
  const payMsg: Record<string, TKey> = { success: "pay.success", failed: "pay.failed", not_available: "book.err.not_available" };

  return (
    <div className="container-page max-w-3xl space-y-6 py-6">
      <Link href="/trips" className="text-sm text-neutral-500">← {t("trips.title")}</Link>
      {sp.pay && payMsg[sp.pay] && <Notice kind="brand">{t(payMsg[sp.pay])}</Notice>}
      {sp.review && <Notice kind="brand">{sp.review === "contact" ? t("lf.err.contact") : t("review.thanks")}</Notice>}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">{b.listing.title}</h1>
          <div className="text-sm text-neutral-500">{t("trips.code")}: <span dir="ltr">{b.code}</span></div>
        </div>
        <StatusBadge status={b.status} label={t(`status.${b.status}`)} />
      </div>

      <div className="card grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <div><span className="text-neutral-500">{t("search.checkIn")}:</span> {fmtDay(b.checkIn, locale)} · {t("listing.checkInFrom", { time: b.listing.checkInTime })}</div>
          <div><span className="text-neutral-500">{t("search.checkOut")}:</span> {fmtDay(b.checkOut, locale)} · {t("listing.checkOutBefore", { time: b.listing.checkOutTime })}</div>
          <div><span className="text-neutral-500">{t("search.guests")}:</span> {b.guests}</div>
          {b.bed && <div>{b.bed.room.name} · {b.bed.label} ({t(`gender.${b.bed.room.gender}`)})</div>}
          <div><span className="text-neutral-500">{t("listing.cancellation")}:</span> {t(`policy.${b.cancellationPolicy}`)}</div>
        </div>
        <PriceBreakdown b={b} t={t} locale={locale} />
      </div>

      {b.status === "PENDING_PAYMENT" && b.payments[0] && (process.env.PAYMENT_PROVIDER ?? "test") === "test" && (
        <Link href={`/pay/test/${b.payments[0].id}`} className="btn-primary no-underline">{t("trips.payNow")}</Link>
      )}

      <div className="flex flex-wrap gap-2">
        {wa && ["CONFIRMED", "COMPLETED"].includes(b.status) && (
          <a href={`https://wa.me/${wa}?text=${encodeURIComponent(b.code)}`} target="_blank" rel="noopener noreferrer" className="btn-primary no-underline">{t("listing.whatsapp")}</a>
        )}
        <form action={startConversationAction}>
          <input type="hidden" name="listingId" value={b.listingId} />
          <button className="btn-secondary">{t("listing.message")}</button>
        </form>
        <Link href={`/listings/${b.listingId}`} className="btn-ghost no-underline">{t("host.view")}</Link>
      </div>

      {canCancel && preview && (
        <section>
          <CancelForm bookingId={b.id} label={t("trips.cancel")} preview={t("trips.refundPreview", { amount: formatMoney(preview.refundAmount, locale) })} />
          <p className="mt-2 text-xs text-neutral-500">{t(`policy.${b.cancellationPolicy}.desc`)}</p>
        </section>
      )}

      {b.status === "COMPLETED" && !b.review && (
        <section className="card p-4">
          <h2 className="mb-3 text-lg">{t("trips.review")}</h2>
          <form action={createReviewAction} className="space-y-3">
            <input type="hidden" name="bookingId" value={b.id} />
            <fieldset className="flex gap-2">
              <legend className="label">{t("review.rating")}</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer rounded-[12px] border border-neutral-300 px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white">
                  <input type="radio" name="rating" value={n} required className="sr-only" />{n} ★
                </label>
              ))}
            </fieldset>
            <textarea name="comment" required minLength={2} maxLength={2000} rows={3} placeholder={t("review.comment")} className="input" />
            <button className="btn-primary">{t("review.submit")}</button>
          </form>
        </section>
      )}
      {b.review && (
        <section className="card p-4 text-sm">
          <div className="text-brand">{"★".repeat(b.review.rating)}</div>
          <p className="mt-1">{b.review.comment}</p>
          {b.review.hostReply && <p className="mt-2 text-neutral-600"><strong>{t("review.hostReply")}:</strong> {b.review.hostReply}</p>}
        </section>
      )}

      {["CONFIRMED", "COMPLETED", "CANCELLED"].includes(b.status) && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-medium">{t("trips.dispute")}</summary>
          {b.disputes.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {b.disputes.map((d) => (
                <li key={d.id} className="alert">
                  <div className="font-medium">{d.status}</div>
                  <div>{d.reason}</div>
                  {d.resolution && <div className="mt-1 text-brand">{d.resolution}</div>}
                </li>
              ))}
            </ul>
          ) : null}
          <form action={openDisputeAction} className="mt-3 space-y-2">
            <input type="hidden" name="bookingId" value={b.id} />
            <textarea name="reason" required minLength={5} rows={3} placeholder={t("trips.disputeReason")} className="input" />
            <button className="btn-secondary">{t("common.send")}</button>
          </form>
        </details>
      )}
    </div>
  );
}

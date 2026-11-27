import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { PhotoUploader } from "@/components/PhotoUploader";
import { thumbUrl } from "@/lib/photo-url";
import { Choice } from "@/components/Choice";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { pauseListingAction, photoAction, roomAction, submitListingAction, updateListingAction } from "@/app/actions/host";
import { ListingForm } from "../listing-form";
import { Notice, StatusBadge } from "@/components/ui";
import type { TKey } from "@/lib/i18n";

export default async function EditListing({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string; submitted?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireRole("HOST");
  const { t, locale } = await getT();
  const l = await db.listing.findUnique({
    where: { id },
    include: { photos: { orderBy: { position: "asc" } }, rooms: { include: { beds: { orderBy: { label: "asc" } } }, orderBy: { name: "asc" } } },
  });
  if (!l || l.hostId !== user.id) notFound();
  const profile = await db.hostProfile.findUnique({ where: { userId: user.id } });
  const errKey: Record<string, TKey> = { distance: "lf.err.distance", ownerPhone: "lf.err.ownerPhone", genderLocked: "lf.err.genderLocked", contact: "lf.err.contact", photos: "lf.err.photos", beds: "lf.err.beds", price: "lf.err.price", upload: "lf.err.upload", form: "auth.err.form" };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">{l.title}</h1>
        <StatusBadge status={l.status} label={t(`lstatus.${l.status}`)} />
      </div>
      {l.paused && <Notice kind="brand">⏸️ {t("cal.pausedNotice")}</Notice>}
      {sp.saved && <Notice kind="brand">{t("lf.saved")}</Notice>}
      {sp.submitted && <Notice kind="brand">{t("host.submitted")}</Notice>}
      {sp.error && errKey[sp.error] && <Notice kind="brand">{t(errKey[sp.error])}</Notice>}
      {l.status === "REJECTED" && l.rejectionReason && <Notice kind="brand">{t("lstatus.REJECTED")}: {l.rejectionReason}</Notice>}
      {profile?.status !== "APPROVED" && <Notice>{t("host.needApproval")}</Notice>}

      {["DRAFT", "REJECTED"].includes(l.status) && (
        <form action={submitListingAction} className="card flex flex-wrap items-center justify-between gap-3 border-brand bg-brand-50 p-4">
          <input type="hidden" name="id" value={l.id} />
          <p className="text-sm font-medium text-brand-dark">{t("host.draftReminder")}</p>
          <SubmitButton className="btn-primary">{t("host.submitReview")}</SubmitButton>
        </form>
      )}
      <div className="flex flex-wrap gap-2">
        {l.type !== "LONG_TERM" && <Link href={`/host/listings/${l.id}/calendar`} className="btn-primary no-underline">📅 {t("cal.availability")}</Link>}
        {l.status === "APPROVED" && <form action={pauseListingAction}><input type="hidden" name="id" value={l.id} /><button className="btn-secondary">{l.paused ? `▶️ ${t("cal.resume")}` : `⏸️ ${t("cal.pause")}`}</button></form>}
        <Link href={`/listings/${l.id}`} className="btn-ghost no-underline">{t("host.view")}</Link>
      </div>

      <section className="card space-y-3 p-4">
        <h2 className="text-lg">{t("lf.photos")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {l.photos.map((p, i) => (
            <div key={p.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(p.url)} alt="" loading="lazy" className={`aspect-[4/3] w-full rounded-[12px] object-cover ${i === 0 ? "ring-2 ring-brand" : ""}`} />
              <form action={photoAction} className="flex gap-1">
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="photoId" value={p.id} />
                {i > 0 && <Choice name="op" value="cover" className="btn-ghost btn-sm">{t("lf.makeCover")}</Choice>}
                <Choice name="op" value="delete" className="btn-ghost btn-sm">{t("lf.delete")}</Choice>
              </form>
            </div>
          ))}
        </div>
        <PhotoUploader listingId={l.id} />
        <p className="text-xs text-neutral-500">{t("lf.photosHint")}</p>
      </section>

      {l.type === "SHARED_BED" && (
        <section className="card space-y-4 p-4">
          <h2 className="text-lg">{t("lf.rooms")} {l.bedGender && <span className="badge-brand ms-2">{t(`beds.for.${l.bedGender}`)}</span>}</h2>
          {l.rooms.map((r) => (
            <div key={r.id} className="rounded-[12px] border border-neutral-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium">{r.name} <span className="badge-brand ms-1">{t(`gender.${r.gender}`)}</span></div>
                <form action={roomAction}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="roomId" value={r.id} /><Choice name="op" value="deleteRoom" className="btn-ghost btn-sm">{t("lf.delete")}</Choice></form>
              </div>
              <ul className="mb-2 space-y-1 text-sm">
                {r.beds.map((b) => (
                  <li key={b.id} className={`flex items-center justify-between ${b.active ? "" : "opacity-50"}`}>
                    <span>{b.label} · {formatMoney(b.pricePerNight, locale)}</span>
                    <form action={roomAction}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="bedId" value={b.id} /><Choice name="op" value="toggleBed" className="btn-ghost btn-sm">{b.active ? t("admin.hide") : t("admin.show")}</Choice></form>
                  </li>
                ))}
              </ul>
              <form action={roomAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="roomId" value={r.id} />
                <input name="label" required placeholder={t("lf.bedLabel")} className="input w-32" />
                <input name="price" type="number" step="0.01" min={1} required placeholder={t("lf.bedPrice")} className="input w-36" />
                <Choice name="op" value="addBed" className="btn-secondary btn-sm">+ {t("lf.addBed")}</Choice>
              </form>
            </div>
          ))}
          <form action={roomAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={l.id} />
            <input name="name" required placeholder={t("lf.roomName")} className="input w-40" />
            <Choice name="op" value="addRoom" className="btn-secondary">+ {t("lf.addRoom")}</Choice>
          </form>
        </section>
      )}

      <ListingForm t={t} l={l} action={updateListingAction} />
    </div>
  );
}

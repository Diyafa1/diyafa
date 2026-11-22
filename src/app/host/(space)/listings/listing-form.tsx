import type { Listing } from "@prisma/client";
import type { T, TKey } from "@/lib/i18n";
import { AMENITIES } from "@/lib/amenities";
import { Field } from "@/components/ui";

export function ListingForm({ t, l, action }: { t: T; l?: Listing; action: (fd: FormData) => Promise<void> }) {
  const sar = (v: number | null | undefined) => (v ? String(v / 100) : "");
  return (
    <form action={action} className="space-y-6">
      {l && <input type="hidden" name="id" value={l.id} />}
      <section className="card space-y-4 p-4">
        <h2 className="text-lg">{t("lf.basics")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("search.type")}>
            <select name="type" className="input" defaultValue={l?.type ?? "SHORT_STAY"} disabled={!!l}>
              {(["SHORT_STAY", "SHARED_BED", "LONG_TERM"] as const).map((ty) => <option key={ty} value={ty}>{t(`type.${ty}`)}</option>)}
            </select>
            {l && <input type="hidden" name="type" value={l.type} />}
          </Field>
          {(!l || l.type === "SHARED_BED") && (
            <Field label={t("lf.bedGender")} hint={!l ? t("lf.bedGenderHint") : undefined}>
              <select name="bedGender" className="input" defaultValue={l?.bedGender ?? ""}>
                <option value="">—</option>
                <option value="MALE">{t("gender.MALE")}</option>
                <option value="FEMALE">{t("gender.FEMALE")}</option>
              </select>
            </Field>
          )}
          <Field label={t("search.city")}>
            <select name="city" className="input" defaultValue={l?.city ?? "MAKKAH"}>
              <option value="MAKKAH">{t("city.MAKKAH")}</option>
              <option value="MADINAH">{t("city.MADINAH")}</option>
            </select>
          </Field>
        </div>
        <Field label={t("lf.title")}><input name="title" className="input" required minLength={3} maxLength={120} defaultValue={l?.title} /></Field>
        <Field label={t("lf.description")}><textarea name="description" className="input" rows={5} required minLength={10} defaultValue={l?.description} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("lf.address")}><input name="address" className="input" required defaultValue={l?.address} /></Field>
          <Field label={`${t("lf.neighborhood")} (${t("common.optional")})`}><input name="neighborhood" className="input" defaultValue={l?.neighborhood ?? ""} /></Field>
          <Field label={t("lf.distance")}><input name="distanceToHaramM" type="number" min={0} className="input" required defaultValue={l?.distanceToHaramM} /></Field>
        </div>
        <fieldset>
          <legend className="label">{t("lf.coords")}</legend>
          <div className="grid grid-cols-2 gap-2">
            <input name="latitude" type="number" step="any" placeholder={t("lf.lat")} className="input" dir="ltr" defaultValue={l?.latitude ?? ""} />
            <input name="longitude" type="number" step="any" placeholder={t("lf.lng")} className="input" dir="ltr" defaultValue={l?.longitude ?? ""} />
          </div>
          <p className="mt-1 text-xs text-neutral-500">{t("lf.coordsHint")}</p>
        </fieldset>
        <div className="grid grid-cols-3 gap-2">
          <Field label={t("lf.maxGuests")}><input name="maxGuests" type="number" min={1} className="input" defaultValue={l?.maxGuests ?? 2} /></Field>
          <Field label={t("lf.bedrooms")}><input name="bedrooms" type="number" min={0} className="input" defaultValue={l?.bedrooms ?? 1} /></Field>
          <Field label={t("lf.bathrooms")}><input name="bathrooms" type="number" min={0} className="input" defaultValue={l?.bathrooms ?? 1} /></Field>
        </div>
        <fieldset>
          <legend className="label">{t("lf.amenities")}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AMENITIES.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="amenities" value={a} defaultChecked={l?.amenities.includes(a)} className="accent-[#7A2E3A]" />
                {t(`amenity.${a}` as TKey)}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={`${t("lf.rules")} (${t("common.optional")})`}><textarea name="rules" className="input" rows={3} defaultValue={l?.rules ?? ""} /></Field>
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="text-lg">{t("lf.pricing")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(!l || l.type === "SHORT_STAY") && <Field label={t("lf.pricePerNight")} hint={!l ? t("type.SHORT_STAY") : undefined}><input name="pricePerNight" type="number" min={0} step="0.01" className="input" defaultValue={sar(l?.pricePerNight)} /></Field>}
          {(!l || l.type === "LONG_TERM") && <Field label={t("lf.ownerPhone")} hint={t("lf.ownerPhoneHint")}><input name="ownerPhone" type="tel" dir="ltr" placeholder="+966 5x xxx xxxx" className="input" defaultValue={l?.ownerPhone ?? ""} /></Field>}
          {(!l || l.type === "LONG_TERM") && <Field label={t("lf.pricePerYear")} hint={!l ? t("type.LONG_TERM") : undefined}><input name="pricePerYear" type="number" min={0} step="1" className="input" defaultValue={sar(l?.pricePerYear)} /></Field>}
          {(!l || l.type !== "LONG_TERM") && <Field label={t("lf.minNights")}><input name="minNights" type="number" min={1} className="input" defaultValue={l?.minNights ?? 1} /></Field>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("lf.checkInTime")}><input name="checkInTime" type="time" className="input" defaultValue={l?.checkInTime ?? "15:00"} required /></Field>
          <Field label={t("lf.checkOutTime")}><input name="checkOutTime" type="time" className="input" defaultValue={l?.checkOutTime ?? "12:00"} required /></Field>
        </div>
        {(!l || l.type === "LONG_TERM") && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="allowTwoPayments" defaultChecked={l?.allowTwoPayments} className="mt-1 accent-[#7A2E3A]" />
            <span>{t("lf.twoPayments")}{!l && <span className="block text-xs text-neutral-500">{t("type.LONG_TERM")}</span>}</span>
          </label>
        )}
        {(!l || l.type !== "LONG_TERM") && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="seasonalPricing" defaultChecked={l?.seasonalPricing} className="mt-1 accent-[#7A2E3A]" />
            <span>{t("lf.seasonal")}<span className="block text-xs text-neutral-500">{t("lf.seasonalHint")}</span></span>
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="instantBook" defaultChecked={l?.instantBook} className="accent-[#7A2E3A]" />
          {t("lf.instantBook")}
        </label>
        <fieldset>
          <legend className="label">{t("lf.policy")}</legend>
          <div className="space-y-2">
            {(["FLEXIBLE", "MODERATE", "STRICT"] as const).map((p) => (
              <label key={p} className="card flex cursor-pointer gap-2 p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-50">
                <input type="radio" name="cancellationPolicy" value={p} defaultChecked={(l?.cancellationPolicy ?? "MODERATE") === p} className="accent-[#7A2E3A]" />
                <span><strong>{t(`policy.${p}`)}</strong> — {t(`policy.${p}.desc`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>
      <button className="btn-primary w-full sm:w-auto">{t("lf.save")}</button>
    </form>
  );
}

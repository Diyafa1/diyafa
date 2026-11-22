"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { formatMoney } from "@/lib/money";
import { bookAction } from "@/app/actions/booking";
import type { TKey } from "@/lib/i18n";

type Bed = { id: string; label: string; pricePerNight: number; roomName: string; gender: "MALE" | "FEMALE" };
type Quote = { subtotal: number; serviceFee: number; vat: number; total: number; onlineAmount: number; payOnSite: number; discount: number };

export function BookingWidget(props: {
  listingId: string;
  type: "LONG_TERM" | "SHORT_STAY" | "SHARED_BED";
  priceLabel: string;
  instantBook: boolean;
  minNights: number;
  minMonths: number;
  maxGuests: number;
  beds: Bed[];
  loggedIn: boolean;
  userGender: "MALE" | "FEMALE" | null;
  initial: { checkIn?: string; checkOut?: string; guests?: string; months?: string };
}) {
  const { t, locale } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const [checkIn, setCheckIn] = useState(props.initial.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(props.initial.checkOut ?? "");
  const [months, setMonths] = useState(props.initial.months ?? String(props.minMonths));
  const [guests, setGuests] = useState(props.initial.guests ?? "1");
  const [bedId, setBedId] = useState("");
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">(props.userGender ?? "");
  const [quote, setQuote] = useState<{ q: Quote; nights: number; months: number | null; vatPercent: number } | null>(null);
  const [qError, setQError] = useState<string | null>(null);
  const [takenBeds, setTakenBeds] = useState<string[]>([]);
  const [state, action, pending] = useActionState(bookAction, null);

  const isLong = props.type === "LONG_TERM";
  const isBed = props.type === "SHARED_BED";
  const ready = checkIn && (isLong ? months : checkOut) && (!isBed || (bedId && gender));

  useEffect(() => {
    setQuote(null);
    setQError(null);
    if (!checkIn || (!isLong && !checkOut)) return;
    const ctrl = new AbortController();
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: props.listingId, checkIn, checkOut: isLong ? undefined : checkOut, months: isLong ? months : undefined, guests, bedId: isBed ? bedId || undefined : undefined, promoCode: promoApplied || undefined }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        setTakenBeds(d.takenBeds ?? []);
        if (d.error && !(isBed && !bedId && d.error === "bed")) setQError(d.error);
        else if (d.quote) setQuote({ q: d.quote, nights: d.nights, months: d.months, vatPercent: d.vatPercent });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [checkIn, checkOut, months, guests, bedId, isLong, isBed, props.listingId, promoApplied]);

  const err = state?.error ?? qError;

  return (
    <form action={action} className="card space-y-3 p-4 shadow-sm">
      <div className="text-lg font-semibold">{props.priceLabel}</div>
      <div className="text-xs text-neutral-500">{props.instantBook ? t("listing.instant") : t("listing.request")}</div>
      <input type="hidden" name="listingId" value={props.listingId} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="label">{t("search.checkIn")}</span>
          <input type="date" name="checkIn" required min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="input" />
        </label>
        {isLong ? (
          <label className="block">
            <span className="label">{t("search.months")}</span>
            <input type="number" name="months" min={props.minMonths} max={24} required value={months} onChange={(e) => setMonths(e.target.value)} className="input" />
          </label>
        ) : (
          <label className="block">
            <span className="label">{t("search.checkOut")}</span>
            <input type="date" name="checkOut" required min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="input" />
          </label>
        )}
      </div>
      {!isBed && (
        <label className="block">
          <span className="label">{t("search.guests")}</span>
          <input type="number" name="guests" min={1} max={props.maxGuests} value={guests} onChange={(e) => setGuests(e.target.value)} className="input" />
        </label>
      )}
      {isBed && (
        <fieldset>
          <input type="hidden" name="guests" value="1" />
          <input type="hidden" name="gender" value={gender} />
          <div className="label">{t("book.chooseGender")}</div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {(["MALE", "FEMALE"] as const).map((g) => {
              const has = props.beds.some((b) => b.gender === g);
              const locked = !!props.userGender && props.userGender !== g;
              return (
                <button
                  key={g} type="button" disabled={!has || locked}
                  onClick={() => { setGender(g); if (bedId && props.beds.find((b) => b.id === bedId)?.gender !== g) setBedId(""); }}
                  className={`${gender === g ? "btn-primary" : "btn-secondary"} w-full`}
                >
                  {t(`gender.${g}`)}
                </button>
              );
            })}
          </div>
          <div className="label">{t("listing.chooseBed")}</div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {props.beds.filter((b) => !gender || b.gender === gender).map((b) => {
              const taken = takenBeds.includes(b.id);
              return (
                <label key={b.id} className={`flex items-center justify-between gap-2 rounded-[12px] border px-3 py-2 text-sm ${bedId === b.id ? "border-brand bg-brand-50" : "border-neutral-200"} ${taken ? "opacity-50" : "cursor-pointer"}`}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="bedId" value={b.id} disabled={taken} checked={bedId === b.id} onChange={() => setBedId(b.id)} className="accent-[#7A2E3A]" />
                    <span>{b.roomName} · {b.label} <span className="text-neutral-500">({t(`gender.${b.gender}`)})</span></span>
                  </span>
                  <span className="text-neutral-700">{taken ? t("listing.bedTaken") : formatMoney(b.pricePerNight, locale)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      <p className="text-xs text-neutral-500">{isLong ? t("listing.minMonths", { n: props.minMonths }) : t("listing.minNights", { n: props.minNights })}</p>

      <input type="hidden" name="promoCode" value={promoApplied} />
      <div className="flex gap-2">
        <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder={t("promo.code")} className="input py-2" dir="ltr" aria-label={t("promo.code")} />
        <button type="button" className="btn-secondary btn-sm" onClick={() => setPromoApplied(promo.trim())}>{t("promo.apply")}</button>
      </div>
      {quote && !err && (
        <dl className="space-y-1 border-t border-neutral-100 pt-3 text-sm">
          <div className="flex justify-between"><dt>{t("book.subtotal", { n: quote.months ? t("book.months", { n: quote.months }) : t("book.nights", { n: quote.nights }) })}</dt><dd>{formatMoney(quote.q.subtotal, locale)}</dd></div>
          <div className="flex justify-between"><dt>{t("book.serviceFee")}</dt><dd>{formatMoney(quote.q.serviceFee, locale)}</dd></div>
          {quote.q.discount > 0 && <div className="flex justify-between text-brand"><dt>{t("book.discount")}</dt><dd>−{formatMoney(quote.q.discount, locale)}</dd></div>}
          <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold"><dt>{t("book.totalStay")}</dt><dd>{formatMoney(quote.q.total, locale)}</dd></div>
          <div className="mt-2 space-y-1 rounded-[12px] bg-brand-50 p-3">
            <div className="flex justify-between font-semibold text-brand-dark"><dt>{t("book.online")}</dt><dd>{formatMoney(quote.q.onlineAmount, locale)}</dd></div>
            <div className="flex justify-between text-neutral-700"><dt>{t("book.onSite")}</dt><dd>{formatMoney(quote.q.payOnSite, locale)}</dd></div>
          </div>
        </dl>
      )}
      {!quote && !err && <p className="text-sm text-neutral-500">{t("book.selectDates")}</p>}
      {err && <p className="alert-brand">{t(`book.err.${err}` as TKey) === `book.err.${err}` ? t("book.err.generic") : t(`book.err.${err}` as TKey)}</p>}

      {props.loggedIn ? (
        <button className="btn-primary w-full" disabled={!ready || pending || !!qError || !quote}>
          {pending ? t("common.loading") : props.instantBook ? t("book.reserve") : t("book.request")}
        </button>
      ) : (
        <Link href={`/login?next=/listings/${props.listingId}`} className="btn-primary w-full no-underline">{t("book.loginToBook")}</Link>
      )}
      <p className="text-center text-xs text-neutral-500">{t("book.onlineNote")} {props.instantBook ? "" : t("book.requestNote")}</p>
    </form>
  );
}

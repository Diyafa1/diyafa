"use client";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { calendarAction } from "@/app/actions/host";

type Day = { blocked: boolean; price: number | null };

export function CalendarEditor(props: {
  listingId: string; start: string; today: string; basePrice: number | null; bedCount: number | null;
  days: Record<string, Day>; booked: Record<string, number>;
}) {
  const { t, locale } = useI18n();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState("");
  const [pending, start] = useTransition();
  const loc = locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : locale;

  const months = [0, 1].map((offset) => {
    const s = new Date(props.start + "T00:00:00Z");
    const first = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + offset, 1));
    const daysIn = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const lead = first.getUTCDay(); // 0 = Sunday (Saudi week starts Sunday)
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysIn; d++) cells.push(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), d)).toISOString().slice(0, 10));
    return { label: new Intl.DateTimeFormat(loc, { month: "long", year: "numeric", timeZone: "UTC" }).format(first), cells };
  });
  const weekdays = [...Array(7)].map((_, i) => new Intl.DateTimeFormat(loc, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + i))));

  const toggle = (d: string) => setSel((s) => { const n = new Set(s); if (n.has(d)) n.delete(d); else n.add(d); return n; });
  const run = (op: string) => {
    const fd = new FormData();
    fd.set("id", props.listingId);
    fd.set("op", op);
    fd.set("days", [...sel].join(","));
    fd.set("price", price);
    start(async () => { await calendarAction(fd); setSel(new Set()); });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-6 md:grid-cols-2">
        {months.map((m) => (
          <div key={m.label} className="card p-3">
            <div className="mb-2 text-center font-medium">{m.label}</div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-neutral-500">{weekdays.map((w, i) => <div key={i}>{w}</div>)}</div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {m.cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const info = props.days[d];
                const nBooked = props.booked[d] ?? 0;
                const full = props.bedCount === null ? nBooked > 0 : nBooked >= props.bedCount && props.bedCount > 0;
                const past = d < props.today;
                const isSel = sel.has(d);
                const p = info?.price ?? props.basePrice;
                return (
                  <button
                    key={d} type="button" disabled={past} onClick={() => toggle(d)}
                    className={`flex aspect-square flex-col items-center justify-center rounded-[8px] border text-xs transition-colors
                      ${isSel ? "border-brand bg-brand text-white" : full ? "border-neutral-800 bg-neutral-800 text-white" : info?.blocked ? "border-neutral-300 bg-neutral-200 text-neutral-500 line-through" : "border-neutral-200 hover:border-brand"}
                      ${past ? "opacity-30" : ""}`}
                  >
                    <span className="font-medium">{Number(d.slice(8))}</span>
                    {props.bedCount !== null ? <span className="text-[9px]">{nBooked}/{props.bedCount}</span>
                      : p ? <span className={`text-[9px] ${info?.price ? "font-semibold" : ""}`}>{Math.round(p / 100)}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-neutral-800" />{t("cal.booked")}</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-neutral-200" />{t("cal.blocked")}</span>
      </div>
      <div className="card sticky bottom-20 flex flex-wrap items-center gap-2 p-3 md:bottom-4">
        <span className="text-sm">{t("cal.selected", { n: sel.size })}</span>
        <button className="btn-primary btn-sm" disabled={!sel.size || pending} onClick={() => run("block")}>{t("cal.block")}</button>
        <button className="btn-secondary btn-sm" disabled={!sel.size || pending} onClick={() => run("unblock")}>{t("cal.unblock")}</button>
        {props.basePrice !== null && props.bedCount === null && (
          <>
            <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("lf.pricePerNight")} className="input w-40 py-1.5" />
            <button className="btn-secondary btn-sm" disabled={!sel.size || !price || pending} onClick={() => run("price")}>{t("cal.setPrice")}</button>
            <button className="btn-ghost btn-sm" disabled={!sel.size || pending} onClick={() => run("resetPrice")}>{t("cal.resetPrice")}</button>
          </>
        )}
      </div>
    </div>
  );
}

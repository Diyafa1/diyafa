import type { T } from "@/lib/i18n";

/** Long-term rentals: no online payment. The traveller contacts Diyafa on WhatsApp to arrange a visit. */
export function LongTermContact({ t, priceLabel, minMonths, waNumber, message, refCode }: {
  t: T; priceLabel: string; minMonths: number; waNumber: string; message: string; refCode: string;
}) {
  return (
    <div className="card space-y-3 p-4 shadow-sm">
      <div className="text-lg font-semibold">{priceLabel}</div>
      <div className="text-xs text-neutral-500">{t("listing.minMonths", { n: minMonths })} · {t("lt.ref")} <span dir="ltr" className="font-medium">{refCode}</span></div>
      <p className="rounded-[12px] bg-brand-50 p-3 text-sm text-brand-dark">{t("lt.explain")}</p>
      <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="btn-primary w-full no-underline">
        {t("lt.visit")}
      </a>
      <p className="text-center text-xs text-neutral-500">{t("lt.note")}</p>
    </div>
  );
}

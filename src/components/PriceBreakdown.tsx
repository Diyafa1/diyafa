import type { Booking } from "@prisma/client";
import type { Locale, T } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

export function PriceBreakdown({ b, t, locale }: { b: Booking; t: T; locale: Locale }) {
  const span = b.months ? t("book.months", { n: b.months }) : t("book.nights", { n: b.nights });
  const cancelled = b.status === "CANCELLED" || b.status === "DECLINED";
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between"><dt>{t("book.subtotal", { n: span })}</dt><dd>{formatMoney(b.subtotal, locale)}</dd></div>
      <div className="flex justify-between"><dt>{t("book.serviceFee")}</dt><dd>{formatMoney(b.serviceFee, locale)}</dd></div>
      {b.discount > 0 && <div className="flex justify-between text-brand"><dt>{t("book.discount")}{b.promoCode ? ` (${b.promoCode})` : ""}</dt><dd>−{formatMoney(b.discount, locale)}</dd></div>}
      <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold"><dt>{t("book.totalStay")}</dt><dd>{formatMoney(b.total, locale)}</dd></div>
      <div className="mt-2 space-y-1 rounded-[12px] bg-brand-50 p-3">
        <div className="flex justify-between font-semibold text-brand-dark"><dt>{t("book.online")}</dt><dd>{formatMoney(b.onlineAmount, locale)}</dd></div>
        {!cancelled && b.payOnSite > 0 && <div className="flex justify-between text-neutral-700"><dt>{t("book.onSite")}</dt><dd>{formatMoney(b.payOnSite, locale)}</dd></div>}
      </div>
      {b.refundedAmount > 0 && <div className="flex justify-between text-brand"><dt>{t("admin.refundsTotal")}</dt><dd>−{formatMoney(b.refundedAmount, locale)}</dd></div>}
    </dl>
  );
}

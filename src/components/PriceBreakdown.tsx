import type { Booking } from "@prisma/client";
import type { Locale, T } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

export function PriceBreakdown({ b, t, locale }: { b: Booking; t: T; locale: Locale }) {
  const span = b.months ? t("book.months", { n: b.months }) : t("book.nights", { n: b.nights });
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between"><dt>{t("book.subtotal", { n: span })}</dt><dd>{formatMoney(b.subtotal, locale)}</dd></div>
      <div className="flex justify-between"><dt>{t("book.serviceFee")}</dt><dd>{formatMoney(b.serviceFee, locale)}</dd></div>
      <div className="flex justify-between"><dt>{t("book.vat", { p: b.vatPercent })}</dt><dd>{formatMoney(b.vat, locale)}</dd></div>
      <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold"><dt>{t("book.total")}</dt><dd>{formatMoney(b.total, locale)}</dd></div>
      {b.refundedAmount > 0 && <div className="flex justify-between text-brand"><dt>{t("admin.refundsTotal")}</dt><dd>−{formatMoney(b.refundedAmount, locale)}</dd></div>}
    </dl>
  );
}

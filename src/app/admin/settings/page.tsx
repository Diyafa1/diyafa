import { getT } from "@/lib/i18n/server";
import { getAllRates } from "@/lib/settings";
import { saveRatesAction } from "@/app/actions/admin";
import { computeQuote } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";
import { Notice } from "@/components/ui";

export default async function AdminSettings() {
  const { t, locale } = await getT();
  const rates = await getAllRates();
  return (
    <form action={saveRatesAction} className="max-w-3xl space-y-4">
      <Notice>{t("admin.ratesNote")}</Notice>
      {(["SHORT_STAY", "SHARED_BED", "LONG_TERM"] as const).map((type) => {
        const r = rates[type];
        const ex = computeQuote(100000, r);
        return (
          <section key={type} className="card space-y-3 p-4">
            <h2 className="text-lg">{t(`type.${type}`)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="label">{t("admin.hostPercent")}</span><input name={`${type}.host`} type="number" step="0.1" min={0} max={50} defaultValue={r.hostPercent} className="input" /></label>
              <label className="block"><span className="label">{t("admin.guestFee")}</span><input name={`${type}.guest`} type="number" step="0.1" min={0} max={50} defaultValue={r.guestFeePercent} className="input" /></label>
            </div>
            <p className="text-xs text-neutral-500">
              {formatMoney(100000, locale)} → {t("book.online")} {formatMoney(ex.onlineAmount, locale)} · {t("book.onSite")} {formatMoney(ex.payOnSite, locale)} · {t("admin.commissions")} {formatMoney(ex.platformRevenue, locale)}
            </p>
          </section>
        );
      })}
      <button className="btn-primary">{t("common.save")}</button>
    </form>
  );
}

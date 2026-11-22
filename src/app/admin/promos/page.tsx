import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { promoAction } from "@/app/actions/admin";
import { Choice } from "@/components/Choice";
import { Empty, Notice } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";

export default async function AdminPromos() {
  const { t, locale } = await getT();
  const codes = await db.promoCode.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <div className="max-w-4xl space-y-6">
      <Notice>{t("promo.intro")}</Notice>
      <form action={promoAction} className="card grid gap-3 p-4 sm:grid-cols-5">
        <label className="block"><span className="label">{t("promo.code")}</span><input name="code" required placeholder="OMRA10" className="input uppercase" dir="ltr" /></label>
        <label className="block"><span className="label">{t("promo.percent")}</span><input name="percentOff" type="number" min={1} max={100} required placeholder="10" className="input" /></label>
        <label className="block"><span className="label">{t("promo.maxUses")}</span><input name="maxUses" type="number" min={1} className="input" /></label>
        <label className="block"><span className="label">{t("promo.until")}</span><input name="validUntil" type="date" className="input" /></label>
        <label className="block"><span className="label">{t("promo.note")}</span><input name="note" className="input" /></label>
        <div className="sm:col-span-5"><button className="btn-primary">{t("promo.add")}</button></div>
      </form>
      {codes.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>{t("promo.code")}</th><th>%</th><th>{t("promo.used")}</th><th>{t("promo.until")}</th><th>{t("promo.note")}</th><th></th></tr></thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                  <td className="font-medium" dir="ltr">{c.code}</td>
                  <td>−{c.percentOff} %</td>
                  <td>{c.uses}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                  <td>{c.validUntil ? fmtDay(c.validUntil, locale) : "—"}</td>
                  <td>{c.note ?? ""}</td>
                  <td><form action={promoAction}><input type="hidden" name="id" value={c.id} /><Choice name="op" value="toggle" className="btn-ghost btn-sm">{c.active ? t("promo.disable") : t("promo.enable")}</Choice></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

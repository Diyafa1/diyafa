import { requireSection } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { seasonAction } from "@/app/actions/admin";
import { Choice } from "@/components/Choice";
import { Empty, Notice } from "@/components/ui";
import { fmtDay } from "@/components/TripCard";

export default async function AdminSeasons() {
  await requireSection("seasons");
  const { t, locale } = await getT();
  const seasons = await db.season.findMany({ orderBy: { startDate: "asc" } });
  const optedIn = await db.listing.count({ where: { seasonalPricing: true, status: "APPROVED" } });
  return (
    <div className="max-w-3xl space-y-6">
      <Notice>{t("season.intro", { n: optedIn })}</Notice>
      {seasons.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>{t("season.name")}</th><th>{t("common.from")}</th><th>{t("common.to")}</th><th>%</th><th></th></tr></thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td>{fmtDay(s.startDate, locale)}</td>
                  <td>{fmtDay(s.endDate, locale)}</td>
                  <td>+{s.percent} %</td>
                  <td><form action={seasonAction}><input type="hidden" name="id" value={s.id} /><Choice name="op" value="delete" className="btn-ghost btn-sm">{t("admin.delete")}</Choice></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form action={seasonAction} className="card grid gap-3 p-4 sm:grid-cols-5">
        <label className="block sm:col-span-2"><span className="label">{t("season.name")}</span><input name="name" required placeholder="Ramadan 2027" className="input" /></label>
        <label className="block"><span className="label">{t("common.from")}</span><input name="startDate" type="date" required className="input" /></label>
        <label className="block"><span className="label">{t("common.to")}</span><input name="endDate" type="date" required className="input" /></label>
        <label className="block"><span className="label">{t("season.percent")}</span><input name="percent" type="number" min={1} max={300} required placeholder="30" className="input" /></label>
        <div className="sm:col-span-5"><button className="btn-primary">{t("season.add")}</button></div>
      </form>
    </div>
  );
}

import { requireSection } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { PERMISSIONS } from "@/lib/permissions";
import { staffAction } from "@/app/actions/admin";
import { Choice } from "@/components/Choice";
import { Empty, Notice } from "@/components/ui";
import type { TKey } from "@/lib/i18n";

export default async function AdminStaff({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireSection("staff");
  const { t } = await getT();
  const sp = await searchParams;
  const staff = await db.user.findMany({ where: { role: "STAFF" }, orderBy: { name: "asc" } });
  return (
    <div className="max-w-4xl space-y-6">
      <Notice>{t("staff.intro")}</Notice>
      <form action={staffAction} className="card flex flex-wrap items-end gap-2 p-4">
        <input type="hidden" name="op" value="add" />
        <label className="block flex-1"><span className="label">{t("auth.email")}</span><input name="email" type="email" required className="input" dir="ltr" /></label>
        <button className="btn-primary">{t("staff.add")}</button>
        <p className="w-full text-xs text-neutral-500">{t("staff.emailHint")}</p>
        {sp.error && <p className="alert-brand w-full">{t("staff.notFound")}</p>}
      </form>
      {staff.length === 0 ? <Empty>{t("staff.none")}</Empty> : staff.map((u) => (
        <form key={u.id} action={staffAction} className="card space-y-3 p-4">
          <input type="hidden" name="id" value={u.id} />
          <div><div className="font-medium">{u.name}</div><div className="text-xs text-neutral-500" dir="ltr">{u.email}</div></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PERMISSIONS.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="perm" value={p} defaultChecked={u.permissions.includes(p)} className="accent-[#7A2E3A]" />
                {t(`perm.${p}` as TKey)}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Choice name="op" value="save" className="btn-primary btn-sm">{t("common.save")}</Choice>
            <Choice name="op" value="remove" className="btn-ghost btn-sm">{t("staff.remove")}</Choice>
          </div>
        </form>
      ))}
    </div>
  );
}

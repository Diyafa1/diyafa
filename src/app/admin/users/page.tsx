import { requireSection } from "@/lib/auth";
import { db } from "@/lib/db";
import { Choice } from "@/components/Choice";
import { getT } from "@/lib/i18n/server";
import { userAction } from "@/app/actions/admin";
import { StatusBadge } from "@/components/ui";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const me = await requireSection("users");
  const { t } = await getT();
  const sp = await searchParams;
  const role = ["GUEST", "HOST", "ADMIN"].includes(sp.role ?? "") ? (sp.role as "GUEST") : undefined;
  const rows = await db.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(sp.q ? { OR: [{ email: { contains: sp.q, mode: "insensitive" } }, { name: { contains: sp.q, mode: "insensitive" } }, { phone: { contains: sp.q } }] } : {}),
    },
    include: { _count: { select: { bookings: true, listings: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder={t("admin.search")} className="input max-w-xs" />
        <select name="role" defaultValue={sp.role ?? ""} className="input max-w-[160px]">
          <option value="">{t("common.all")}</option>
          {["GUEST", "HOST", "ADMIN"].map((r) => <option key={r} value={r}>{t(`role.${r}` as never)}</option>)}
        </select>
        <button className="btn-secondary">{t("search.apply")}</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>{t("auth.name")}</th><th>{t("admin.role")}</th><th>{t("common.status")}</th><th>{t("admin.bookings")}</th><th>{t("common.actions")}</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td><div className="font-medium">{u.name}</div><div className="text-xs text-neutral-500" dir="ltr">{u.email} {u.phone}</div></td>
                <td>{t(`role.${u.role}`)}</td>
                <td><StatusBadge status={u.status} label={t(`ustatus.${u.status}`)} /></td>
                <td>{u._count.bookings} / {u._count.listings}</td>
                <td>
                  {u.id !== me.id && (me.role === "ADMIN" || (u.role !== "ADMIN" && u.role !== "STAFF")) && (
                    <form action={userAction} className="flex flex-wrap gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      {u.status === "ACTIVE"
                        ? <Choice name="op" value="suspend" className="btn-secondary btn-sm">{t("admin.suspend")}</Choice>
                        : <Choice name="op" value="activate" className="btn-primary btn-sm">{t("admin.activate")}</Choice>}
                      {me.role === "ADMIN" && u.role !== "STAFF" && <>
                      <select name="role" defaultValue={u.role} className="rounded-[12px] border border-neutral-300 px-2 text-xs">
                        {["GUEST", "HOST", "ADMIN"].map((r) => <option key={r} value={r}>{t(`role.${r}` as never)}</option>)}
                      </select>
                      <Choice name="op" value="role" className="btn-ghost btn-sm">{t("common.save")}</Choice>
                      <Choice name="op" value="delete" className="btn-ghost btn-sm">{t("admin.delete")}</Choice>
                      </>}
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

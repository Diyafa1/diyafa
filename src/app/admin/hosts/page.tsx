import { db } from "@/lib/db";
import { Choice } from "@/components/Choice";
import { getT } from "@/lib/i18n/server";
import { reviewHostAction } from "@/app/actions/admin";
import { Empty, StatusBadge } from "@/components/ui";

export default async function AdminHosts({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { t } = await getT();
  const sp = await searchParams;
  const status = ["PENDING", "APPROVED", "REJECTED"].includes(sp.status ?? "") ? (sp.status as "PENDING") : undefined;
  const rows = await db.hostProfile.findMany({ where: status ? { status } : {}, include: { user: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <a key={s} href={s ? `?status=${s}` : "?"} className={`${(sp.status ?? "") === s ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>{s ? t(`rstatus.${s}` as never) : t("common.all")}</a>
        ))}
      </div>
      {rows.length === 0 ? <Empty>{t("admin.none")}</Empty> : rows.map((p) => (
        <div key={p.id} className="card space-y-3 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-medium">{p.displayName} <span className="text-neutral-500">({p.user.name})</span></div>
              <div className="text-neutral-600" dir="ltr">{p.user.email} · {p.whatsapp}</div>
            </div>
            <StatusBadge status={p.status} label={t(`rstatus.${p.status}`)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>{t("host.idNumber")}: <strong dir="ltr">{p.idNumber}</strong> {p.idDocPath && <a className="link ms-2" href={`/api/files/${p.idDocPath}`} target="_blank">{t("admin.viewDoc")}</a>}</div>
            {p.rejectionReason && <div className="text-brand">{p.rejectionReason}</div>}
          </div>
          <form action={reviewHostAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={p.id} />
            <input name="reason" placeholder={t("admin.reason")} className="input max-w-xs" />
            <Choice name="decision" value="approve" className="btn-primary btn-sm">{t("admin.approve")}</Choice>
            <Choice name="decision" value="reject" className="btn-secondary btn-sm">{t("admin.reject")}</Choice>
          </form>
        </div>
      ))}
    </div>
  );
}

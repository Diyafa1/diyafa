import { requireSection } from "@/lib/auth";
import { db } from "@/lib/db";
import { Choice } from "@/components/Choice";
import { getT } from "@/lib/i18n/server";
import { remindHostsNowAction, reviewHostAction } from "@/app/actions/admin";
import { hostsWithoutListing } from "@/lib/host-reminders";
import { Empty, StatusBadge } from "@/components/ui";
import { DecisionNotice, ReviewTrace } from "@/components/DecisionNotice";

export default async function AdminHosts({ searchParams }: { searchParams: Promise<{ status?: string; done?: string; who?: string; mail?: string; reminded?: string }> }) {
  await requireSection("hosts");
  const { t } = await getT();
  const sp = await searchParams;
  const status = ["PENDING", "APPROVED", "REJECTED"].includes(sp.status ?? "") ? (sp.status as "PENDING") : undefined;
  if (sp.status === "NOLISTING") return <NoListing reminded={sp.reminded} t={t} />;
  const rows = await db.hostProfile.findMany({ where: status ? { status } : {}, include: { user: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <div className="space-y-4">
      <DecisionNotice done={sp.done} who={sp.who} mail={sp.mail} />
      <div className="flex flex-wrap gap-2 text-sm">
        {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <a key={s} href={s ? `?status=${s}` : "?"} className={`${(sp.status ?? "") === s ? "btn-primary" : "btn-secondary"} btn-sm no-underline`}>{s ? t(`rstatus.${s}` as never) : t("common.all")}</a>
        ))}
        <a href="?status=NOLISTING" className="btn-secondary btn-sm no-underline">Sans annonce</a>
      </div>
      {rows.length === 0 ? <Empty>{t("admin.none")}</Empty> : rows.map((p) => (
        <div key={p.id} className="card space-y-3 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-medium">{p.displayName} <span className="text-neutral-500">({p.user.name})</span></div>
              <div className="text-neutral-600" dir="ltr">{p.user.email} · {p.whatsapp}</div>
            </div>
            <div className="text-end">
              <StatusBadge status={p.status} label={t(`rstatus.${p.status}`)} />
              <ReviewTrace by={p.reviewedBy} at={p.reviewedAt} status={p.status} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>{t("host.idNumber")}: <strong dir="ltr">{p.idNumber}</strong> {p.idDocPath && <a className="link ms-2" href={`/api/files/${p.idDocPath}`} target="_blank">{t("admin.viewDoc")}</a>}</div>
            {p.rejectionReason && <div className="text-brand">{p.rejectionReason}</div>}
          </div>
          <form action={reviewHostAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={p.id} />
            <input name="reason" placeholder={t("admin.reason")} className="input max-w-xs" />
            {p.status !== "APPROVED" && <Choice name="decision" value="approve" className="btn-primary btn-sm">{t("admin.approve")}</Choice>}
            {p.status !== "REJECTED" && <Choice name="decision" value="reject" className="btn-secondary btn-sm">{t("admin.reject")}</Choice>}
          </form>
        </div>
      ))}
    </div>
  );
}

async function NoListing({ reminded, t }: { reminded?: string; t: Awaited<ReturnType<typeof getT>>["t"] }) {
  const hosts = await hostsWithoutListing();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <a href="?" className="btn-secondary btn-sm no-underline">{t("common.all")}</a>
        <a href="?status=NOLISTING" className="btn-primary btn-sm no-underline">Sans annonce</a>
      </div>
      {reminded !== undefined && <div className="alert-brand">📧 {reminded} relance(s) envoyée(s). Les hôtes déjà relancés cette semaine ne reçoivent rien de plus.</div>}
      <div className="card space-y-3 p-4 text-sm">
        <p><strong>{hosts.length}</strong> hôte(s) inscrit(s) sans annonce publiée. Ils sont relancés automatiquement <strong>chaque lundi</strong> par e-mail (une fois par semaine maximum).</p>
        <form action={remindHostsNowAction}><button className="btn-primary btn-sm">Relancer maintenant</button></form>
      </div>
      {hosts.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
        <div className="card divide-y divide-neutral-100 text-sm">
          {hosts.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div>
                <div className="font-medium">{u.hostProfile?.displayName ?? u.name}</div>
                <div className="text-neutral-600" dir="ltr">{u.email}{u.hostProfile?.whatsapp ? ` · ${u.hostProfile.whatsapp}` : ""}</div>
              </div>
              <div className="text-xs text-neutral-500">
                {u.hostProfile ? "Profil validé, aucune annonce" : "Profil d'hôte pas terminé"}
                {u._count.listings > 0 ? ` · ${u._count.listings} brouillon(s)` : ""}
                {" · inscrit le "}{new Intl.DateTimeFormat("fr", { day: "numeric", month: "short" }).format(u.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

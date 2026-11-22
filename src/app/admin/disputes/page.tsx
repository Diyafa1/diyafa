import { requireSection } from "@/lib/auth";
import Link from "next/link";
import { Choice } from "@/components/Choice";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { disputeAction } from "@/app/actions/admin";
import { Empty, StatusBadge } from "@/components/ui";

export default async function AdminDisputes() {
  await requireSection("disputes");
  const { t, locale } = await getT();
  const rows = await db.dispute.findMany({ include: { openedBy: true, booking: { include: { listing: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  if (!rows.length) return <Empty>{t("admin.none")}</Empty>;
  return (
    <ul className="space-y-3">
      {rows.map((d) => (
        <li key={d.id} className="card space-y-2 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-medium"><Link href={`/admin/bookings?q=${d.booking.code}`} className="link" dir="ltr">{d.booking.code}</Link> · {d.booking.listing.title}</div>
              <div className="text-neutral-500">{d.openedBy.name} ({t(`role.${d.openedBy.role}`)}) · {formatMoney(d.booking.total, locale)}</div>
            </div>
            <StatusBadge status={d.status} label={d.status} />
          </div>
          <p className="whitespace-pre-line">{d.reason}</p>
          <form action={disputeAction} className="space-y-2">
            <input type="hidden" name="id" value={d.id} />
            <textarea name="resolution" defaultValue={d.resolution ?? ""} rows={2} placeholder={t("admin.resolution")} className="input" />
            <div className="flex gap-2">
              <Choice name="status" value="RESOLVED" className="btn-primary btn-sm">{t("admin.resolve")}</Choice>
              <Choice name="status" value="CLOSED" className="btn-secondary btn-sm">{t("admin.close")}</Choice>
            </div>
          </form>
        </li>
      ))}
    </ul>
  );
}

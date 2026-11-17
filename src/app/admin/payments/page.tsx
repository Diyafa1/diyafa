import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/ui";

export default async function AdminPayments() {
  const { t, locale } = await getT();
  const rows = await db.payment.findMany({ include: { booking: { select: { code: true } } }, orderBy: { createdAt: "desc" }, take: 300 });
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : locale, { dateStyle: "short", timeStyle: "short" });
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead><tr><th>{t("common.date")}</th><th>{t("trips.code")}</th><th>Type</th><th>{t("common.amount")}</th><th>Provider</th><th>{t("common.status")}</th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{fmt.format(p.createdAt)}</td>
              <td dir="ltr">{p.booking.code}</td>
              <td>{p.kind === "REFUND" ? t("admin.refundsTotal") : t("pay.amount")}</td>
              <td className={p.kind === "REFUND" ? "text-brand" : ""}>{p.kind === "REFUND" ? "−" : ""}{formatMoney(p.amount, locale)}</td>
              <td dir="ltr">{p.provider}<div className="text-xs text-neutral-400">{p.providerRef}</div></td>
              <td><StatusBadge status={p.status} label={p.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

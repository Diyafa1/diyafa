import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { contactHandledAction } from "@/app/actions/admin";
import { Empty } from "@/components/ui";

export default async function AdminContact() {
  const { t } = await getT();
  const rows = await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 200 });
  if (!rows.length) return <Empty>{t("admin.none")}</Empty>;
  return (
    <ul className="space-y-3">
      {rows.map((m) => (
        <li key={m.id} className={`card space-y-1 p-4 text-sm ${m.handled ? "opacity-60" : ""}`}>
          <div className="flex justify-between gap-2"><span className="font-medium">{m.subject}</span><a href={`mailto:${m.email}`} className="link" dir="ltr">{m.email}</a></div>
          <div className="text-neutral-500">{m.name} · {m.createdAt.toISOString().slice(0, 10)}</div>
          <p className="whitespace-pre-line">{m.body}</p>
          {!m.handled && <form action={contactHandledAction}><input type="hidden" name="id" value={m.id} /><button className="btn-secondary btn-sm">{t("admin.markHandled")}</button></form>}
        </li>
      ))}
    </ul>
  );
}

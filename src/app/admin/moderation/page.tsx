import { db } from "@/lib/db";
import { Choice } from "@/components/Choice";
import { getT } from "@/lib/i18n/server";
import { moderateAction } from "@/app/actions/admin";
import { Empty } from "@/components/ui";

export default async function AdminModeration() {
  const { t } = await getT();
  const [messages, reviews] = await Promise.all([
    db.message.findMany({ where: { reported: true }, include: { sender: true, conversation: { include: { listing: { select: { title: true } } } } }, orderBy: { createdAt: "desc" } }),
    db.review.findMany({ include: { author: true, listing: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg">{t("admin.reportedMessages")}</h2>
        {messages.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className="card flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
                <div><div className="text-xs text-neutral-500">{m.sender.name} · {m.conversation.listing.title}</div><p className={m.hidden ? "line-through opacity-60" : ""}>{m.body}</p></div>
                <form action={moderateAction}>
                  <input type="hidden" name="kind" value="message" /><input type="hidden" name="id" value={m.id} />
                  {m.hidden ? <Choice name="op" value="show" className="btn-secondary btn-sm">{t("admin.show")}</Choice> : <Choice name="op" value="hide" className="btn-primary btn-sm">{t("admin.hide")}</Choice>}
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-lg">{t("admin.allReviews")}</h2>
        {reviews.length === 0 ? <Empty>{t("admin.none")}</Empty> : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="card flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
                <div>
                  <div className="text-xs text-neutral-500">{r.author.name} · {r.listing.title} · <span className="text-brand">{"★".repeat(r.rating)}</span></div>
                  <p className={r.hidden ? "line-through opacity-60" : ""}>{r.comment}</p>
                  {r.hostReply && <p className="text-xs text-neutral-500">↳ {r.hostReply}</p>}
                </div>
                <form action={moderateAction}>
                  <input type="hidden" name="kind" value="review" /><input type="hidden" name="id" value={r.id} />
                  {r.hidden ? <Choice name="op" value="show" className="btn-secondary btn-sm">{t("admin.show")}</Choice> : <Choice name="op" value="hide" className="btn-secondary btn-sm">{t("admin.hide")}</Choice>}
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

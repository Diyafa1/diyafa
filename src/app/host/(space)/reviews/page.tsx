import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { replyReviewAction } from "@/app/actions/reviews";
import { Empty } from "@/components/ui";

export default async function HostReviews() {
  const user = await requireRole("HOST");
  const { t } = await getT();
  const rows = await db.review.findMany({ where: { listing: { hostId: user.id } }, include: { listing: { select: { title: true } }, author: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  if (!rows.length) return <Empty>{t("listing.noReviews")}</Empty>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="card space-y-2 p-4 text-sm">
          <div className="flex justify-between"><span className="font-medium">{r.author.name} · {r.listing.title}</span><span className="text-brand">{"★".repeat(r.rating)}</span></div>
          <p>{r.comment}</p>
          {r.hidden && <span className="badge">{t("admin.hide")}</span>}
          <form action={replyReviewAction} className="flex gap-2">
            <input type="hidden" name="reviewId" value={r.id} />
            <input name="reply" defaultValue={r.hostReply ?? ""} placeholder={t("review.reply")} className="input" maxLength={2000} />
            <button className="btn-secondary btn-sm">{t("review.reply")}</button>
          </form>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { Empty, PageTitle } from "@/components/ui";

export default async function MessagesPage() {
  const user = await requireUser();
  const { t } = await getT();
  const convos = await db.conversation.findMany({
    where: { OR: [{ guestId: user.id }, { hostId: user.id }] },
    include: {
      listing: { select: { title: true } },
      guest: { select: { name: true } },
      host: { select: { name: true, hostProfile: { select: { displayName: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  const unread = await db.message.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: convos.map((c) => c.id) }, senderId: { not: user.id }, readAt: null },
    _count: true,
  });
  return (
    <div className="container-page max-w-2xl py-6">
      <PageTitle>{t("msg.title")}</PageTitle>
      {convos.length === 0 ? <Empty>{t("msg.empty")}</Empty> : (
        <ul className="card divide-y divide-neutral-100">
          {convos.map((c) => {
            const other = c.guestId === user.id ? (c.host.hostProfile?.displayName ?? c.host.name) : c.guest.name;
            const n = unread.find((u) => u.conversationId === c.id)?._count ?? 0;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center justify-between gap-3 p-4 text-neutral-900 no-underline hover:bg-neutral-50">
                  <div className="min-w-0">
                    <div className="font-medium">{other}</div>
                    <div className="truncate text-xs text-neutral-500">{c.listing.title}</div>
                    <div className="truncate text-sm text-neutral-600">{c.messages[0]?.body}</div>
                  </div>
                  {n > 0 && <span className="badge bg-brand text-white">{n}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

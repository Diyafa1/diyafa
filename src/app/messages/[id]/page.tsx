import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { reportMessageAction, sendMessageAction } from "@/app/actions/messages";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { t, locale } = await getT();
  const c = await db.conversation.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true } },
      guest: { select: { name: true } },
      host: { select: { name: true, hostProfile: { select: { displayName: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!c || (c.guestId !== user.id && c.hostId !== user.id)) notFound();
  await db.message.updateMany({ where: { conversationId: id, senderId: { not: user.id }, readAt: null }, data: { readAt: new Date() } });
  const other = c.guestId === user.id ? (c.host.hostProfile?.displayName ?? c.host.name) : c.guest.name;
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : locale, { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="container-page flex max-w-2xl flex-col py-6">
      <AutoRefresh />
      <Link href="/messages" className="mb-2 text-sm text-neutral-500">← {t("common.back")}</Link>
      <h1 className="text-xl">{other}</h1>
      <Link href={`/listings/${c.listing.id}`} className="mb-4 text-sm text-brand">{t("msg.about", { title: c.listing.title })}</Link>
      <div className="card mb-4 flex min-h-[40vh] flex-col gap-3 p-4">
        {c.messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] whitespace-pre-line rounded-[12px] px-3 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-neutral-100 text-neutral-900"}`}>
                {m.hidden ? <em className="opacity-70">{t("msg.hidden")}</em> : m.body}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-400">
                {fmt.format(m.createdAt)}
                {!mine && !m.hidden && (
                  m.reported ? <span>{t("msg.reported")}</span> : (
                    <form action={reportMessageAction}>
                      <input type="hidden" name="messageId" value={m.id} />
                      <button className="underline">{t("msg.report")}</button>
                    </form>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form action={sendMessageAction} className="sticky bottom-20 flex gap-2 md:bottom-4">
        <input type="hidden" name="conversationId" value={c.id} />
        <textarea name="body" required rows={2} maxLength={4000} placeholder={t("msg.placeholder")} className="input flex-1 resize-none" />
        <button className="btn-primary self-end">{t("msg.send")}</button>
      </form>
    </div>
  );
}

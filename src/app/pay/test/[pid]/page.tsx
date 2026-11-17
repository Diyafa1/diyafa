import { notFound, redirect } from "next/navigation";
import { Choice } from "@/components/Choice";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { testPayAction } from "@/app/actions/booking";
import { LogoMark } from "@/components/Logo";

export default async function TestPayPage({ params }: { params: Promise<{ pid: string }> }) {
  if ((process.env.PAYMENT_PROVIDER ?? "test") !== "test") notFound();
  const { pid } = await params;
  const user = await requireUser();
  const { t, locale } = await getT();
  const p = await db.payment.findUnique({ where: { id: pid }, include: { booking: { include: { listing: true } } } });
  if (!p || p.booking.guestId !== user.id) notFound();
  if (p.status !== "INITIATED") redirect(`/trips/${p.bookingId}`);
  return (
    <div className="container-page max-w-md py-10">
      <div className="card space-y-4 p-6">
        <div className="flex items-center gap-3"><LogoMark /><h1 className="text-xl">{t("pay.testTitle")}</h1></div>
        <p className="alert">{t("pay.testNote")}</p>
        <div className="text-sm text-neutral-600">{p.booking.listing.title} · {p.booking.code}</div>
        <div className="flex justify-between text-lg"><span>{t("pay.amount")}</span><strong>{formatMoney(p.amount, locale)}</strong></div>
        <p className="text-xs text-neutral-500">{t("pay.timer")}</p>
        <form action={testPayAction} className="grid gap-2">
          <input type="hidden" name="pid" value={p.id} />
          <Choice name="outcome" value="success" className="btn-primary">{t("pay.payNow")}</Choice>
          <Choice name="outcome" value="fail" className="btn-secondary">{t("pay.fail")}</Choice>
        </form>
      </div>
    </div>
  );
}

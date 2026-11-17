import { respondAction } from "@/app/actions/host";
import { Choice } from "@/components/Choice";
import { getT } from "@/lib/i18n/server";

export async function RequestActions({ bookingId }: { bookingId: string }) {
  const { t } = await getT();
  return (
    <form action={respondAction} className="flex gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Choice name="decision" value="accept" className="btn-primary btn-sm">{t("host.accept")}</Choice>
      <Choice name="decision" value="decline" className="btn-secondary btn-sm">{t("host.decline")}</Choice>
    </form>
  );
}

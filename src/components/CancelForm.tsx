"use client";
import { useActionState, useState } from "react";
import { useI18n } from "./I18nProvider";
import { cancelBookingAction } from "@/app/actions/booking";
import type { TKey } from "@/lib/i18n";

export function CancelForm({ bookingId, preview, label, admin }: { bookingId: string; preview?: string; label: string; admin?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(cancelBookingAction, null);
  if (state?.ok) return null;
  if (!open) return <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>{label}</button>;
  return (
    <form action={action} className="card space-y-3 p-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      {preview && <p className="text-sm text-neutral-700">{preview}</p>}
      {admin && (
        <label className="block">
          <span className="label">{t("admin.refund")}</span>
          <input name="refundPercent" type="number" min={0} max={100} defaultValue={100} className="input" />
        </label>
      )}
      <label className="block">
        <span className="label">{t("trips.cancelReason")}</span>
        <textarea name="reason" rows={2} maxLength={500} className="input" />
      </label>
      {state?.error && <p className="alert-brand">{t(`trips.err.${state.error}` as TKey)}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={pending}>{t("trips.cancelConfirm")}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t("common.back")}</button>
      </div>
    </form>
  );
}

import { requireSection } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { getAllRates } from "@/lib/settings";
import { automationSettingsAction, saveRatesAction, telegramAction } from "@/app/actions/admin";
import { telegramChatId, telegramConfigured } from "@/lib/telegram";
import { Choice } from "@/components/Choice";
import { getNumberSetting } from "@/lib/settings";
import { computeQuote } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";
import { Notice } from "@/components/ui";

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ telegram?: string }> }) {
  const sp = await searchParams;
  const tgToken = telegramConfigured();
  const tgChat = await telegramChatId();
  await requireSection("settings");
  const { t, locale } = await getT();
  const rates = await getAllRates();
  const [suspendAfter, declineAfter] = await Promise.all([getNumberSetting("autoSuspendHostCancellations"), getNumberSetting("requestAutoDeclineHours")]);
  return (
    <div className="max-w-3xl space-y-8">
    <form action={saveRatesAction} className="space-y-4">
      <Notice>{t("admin.ratesNote")}</Notice>
      {(["SHORT_STAY", "SHARED_BED", "LONG_TERM"] as const).map((type) => {
        const r = rates[type];
        const ex = computeQuote(100000, r);
        return (
          <section key={type} className="card space-y-3 p-4">
            <h2 className="text-lg">{t(`type.${type}`)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="label">{t("admin.hostPercent")}</span><input name={`${type}.host`} type="number" step="0.1" min={0} max={50} defaultValue={r.hostPercent} className="input" /></label>
              <label className="block"><span className="label">{t("admin.guestFee")}</span><input name={`${type}.guest`} type="number" step="0.1" min={0} max={50} defaultValue={r.guestFeePercent} className="input" /></label>
            </div>
            <p className="text-xs text-neutral-500">
              {formatMoney(100000, locale)} → {t("book.online")} {formatMoney(ex.onlineAmount, locale)} · {t("book.onSite")} {formatMoney(ex.payOnSite, locale)} · {t("admin.commissions")} {formatMoney(ex.platformRevenue, locale)}
            </p>
          </section>
        );
      })}
      <button className="btn-primary">{t("common.save")}</button>
    </form>
      <form action={telegramAction} className="card space-y-3 p-4">
        <h2 className="text-lg">Telegram</h2>
        {sp.telegram === "connected" && <p className="alert-brand">✅ Telegram connecté. Un message de confirmation vous a été envoyé.</p>}
        {sp.telegram === "test-ok" && <p className="alert-brand">✅ Message de test envoyé sur Telegram.</p>}
        {sp.telegram === "test-fail" && <p className="alert-brand">❌ Échec de l&apos;envoi. Reconnectez Telegram.</p>}
        {sp.telegram === "nomessage" && <p className="alert-brand">Envoyez d&apos;abord un message (par exemple « Bonjour ») à votre bot sur Telegram, puis recliquez sur « Connecter ».</p>}
        {sp.telegram === "token" && <p className="alert-brand">❌ TELEGRAM_BOT_TOKEN absent ou incorrect dans Vercel.</p>}
        <p className="text-sm text-neutral-700">
          {!tgToken ? "❌ Pas encore configuré : ajoutez TELEGRAM_BOT_TOKEN dans Vercel (voir les étapes avec Claude)." : tgChat ? "✅ Connecté : vous recevez les alertes et le rapport du matin sur Telegram." : "⚠️ Bot configuré, mais pas encore connecté à votre compte Telegram."}
        </p>
        {tgToken && (
          <div className="flex flex-wrap gap-2">
            <Choice name="op" value="connect" className="btn-primary btn-sm">{tgChat ? "Reconnecter" : "Connecter"}</Choice>
            {tgChat && <Choice name="op" value="test" className="btn-secondary btn-sm">Envoyer un test</Choice>}
          </div>
        )}
      </form>
      <form action={automationSettingsAction} className="card space-y-4 p-4">
        <h2 className="text-lg">{t("auto.title")}</h2>
        <label className="block"><span className="label">{t("auto.suspend")}</span><input name="autoSuspendHostCancellations" type="number" min={0} max={50} defaultValue={suspendAfter} className="input max-w-[140px]" /></label>
        <label className="block"><span className="label">{t("auto.decline")}</span><input name="requestAutoDeclineHours" type="number" min={0} max={240} defaultValue={declineAfter} className="input max-w-[140px]" /></label>
        <p className="text-xs text-neutral-500">{t("auto.list")}</p>
        <button className="btn-primary">{t("common.save")}</button>
      </form>
    </div>
  );
}

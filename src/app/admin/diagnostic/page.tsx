import { requireSection } from "@/lib/auth";
import { paymentProviderName } from "@/lib/payments/provider-name";
import { googleEnabled } from "@/lib/google";

/** Owner-only: what the live site actually reads from its settings (secrets are never shown, only their first letters). */
export default async function Diagnostic() {
  await requireSection("settings");
  const env = process.env;
  // Never print anything that looks like a secret key, even if it was pasted in the wrong setting
  const looksSecret = (v: string) => /^(sk|rk|pk|re|sb|mk|whsec)_/i.test(v.trim()) || v.trim().length > 60;
  const raw = (v?: string) =>
    v === undefined ? "❌ absente" : v === "" ? "⚠️ vide" : looksSecret(v) ? `⚠️ contient une CLÉ SECRÈTE (« ${v.trim().slice(0, 8)}… ») — mauvaise case !` : `"${v}"`;
  const secret = (v?: string) => {
    const s = (v ?? "").trim();
    return !v ? "❌ absente" : `✅ présente — commence par « ${s.slice(0, 8)}… » (${s.length} caractères)${v !== s ? " ⚠️ espaces autour" : ""}`;
  };
  const provider = paymentProviderName();
  const stripeKey = (env.STRIPE_SECRET_KEY ?? "").trim();
  const rows: [string, string, string][] = [
    ["Version en ligne", env.VERCEL_GIT_COMMIT_SHA ? env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : "locale", ""],
    ["APP_URL", raw(env.APP_URL), "Doit être l'adresse exacte du site, sans / à la fin"],
    ["PAYMENT_PROVIDER", raw(env.PAYMENT_PROVIDER), `Le site utilise : ${provider === "stripe" ? "✅ Stripe" : provider === "moyasar" ? "Moyasar" : "⚠️ page de TEST (pas de vrai paiement)"}`],
    ["STRIPE_SECRET_KEY", secret(env.STRIPE_SECRET_KEY), stripeKey.startsWith("sk_test_") ? "✅ clé de test" : stripeKey.startsWith("sk_live_") ? "✅ clé réelle (vrais paiements)" : stripeKey ? "❌ doit commencer par sk_test_ ou sk_live_" : ""],
    ["STRIPE_WEBHOOK_SECRET", secret(env.STRIPE_WEBHOOK_SECRET), (env.STRIPE_WEBHOOK_SECRET ?? "").trim().startsWith("whsec_") ? "✅ Stripe prévient le site de chaque paiement" : "⚠️ recommandé (voir NOTES)"],
    ["EMAIL_PROVIDER", raw(env.EMAIL_PROVIDER), env.EMAIL_PROVIDER?.trim() === "resend" ? "✅ e-mails réels" : "⚠️ e-mails non envoyés"],
    ["RESEND_API_KEY", secret(env.RESEND_API_KEY), ""],
    ["EMAIL_FROM", raw(env.EMAIL_FROM), "Vide = Diyafa <onboarding@resend.dev>"],
    ["STORAGE_PROVIDER", raw(env.STORAGE_PROVIDER), env.STORAGE_PROVIDER?.trim() === "supabase" ? "✅ photos sur Supabase" : "❌ doit être supabase"],
    ["SUPABASE_URL", raw(env.SUPABASE_URL), ""],
    ["SUPABASE_SERVICE_ROLE_KEY", secret(env.SUPABASE_SERVICE_ROLE_KEY), ""],
    ["Connexion Google", googleEnabled() ? "✅ active" : "— pas encore configurée", ""],
    ["GOOGLE_TRANSLATE_API_KEY", secret(env.GOOGLE_TRANSLATE_API_KEY), "Traduction automatique des annonces"],
    ["TELEGRAM_BOT_TOKEN", secret(env.TELEGRAM_BOT_TOKEN), /^\d{6,}:[A-Za-z0-9_-]{30,}$/.test((env.TELEGRAM_BOT_TOKEN ?? "").trim()) ? "✅ format correct" : env.TELEGRAM_BOT_TOKEN ? "⚠️ format inattendu (texte en plus ?)" : ""],
    ["Alertes WhatsApp (CallMeBot)", env.OWNER_WHATSAPP && env.CALLMEBOT_API_KEY ? "✅ actives" : "— pas encore configurées", ""],
    ["Aide WhatsApp visiteurs", raw(env.SUPPORT_WHATSAPP), ""],
    ["ADMIN_EMAILS", raw(env.ADMIN_EMAILS), ""],
  ];
  return (
    <div className="max-w-4xl space-y-4">
      <p className="alert text-sm">Cette page montre ce que le site en ligne lit vraiment dans Vercel. Les clés secrètes ne sont jamais affichées en entier. Après chaque changement dans Vercel, il faut faire « Redeploy ».</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Réglage</th><th>Valeur lue</th><th>Verdict</th></tr></thead>
          <tbody>
            {rows.map(([k, v, verdict]) => (
              <tr key={k}><td className="font-medium" dir="ltr">{k}</td><td dir="ltr" className="break-all">{v}</td><td>{verdict}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

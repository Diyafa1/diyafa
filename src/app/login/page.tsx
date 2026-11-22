import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { loginAction } from "@/app/actions/auth";
import { Field, Notice } from "@/components/ui";
import type { TKey } from "@/lib/i18n";
import { GoogleButton } from "@/components/GoogleButton";
import { googleEnabled } from "@/lib/google";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { t } = await getT();
  const sp = await searchParams;
  return (
    <div className="container-page max-w-md py-10">
      <h1 className="mb-6 text-2xl">{t("auth.loginTitle")}</h1>
      {sp.error && <div className="mb-4"><Notice kind="brand">{t(`auth.err.${sp.error}` as TKey)}</Notice></div>}
      {googleEnabled() && <GoogleButton t={t} next={sp.next} />}
      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <Field label={t("auth.email")}><input className="input" name="email" type="email" required autoComplete="email" /></Field>
        <Field label={t("auth.password")}><input className="input" name="password" type="password" required autoComplete="current-password" /></Field>
        <div className="text-end text-sm"><Link href="/forgot" className="link">{t("pw.forgotLink")}</Link></div>
        <button className="btn-primary w-full">{t("nav.login")}</button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-600">
        {t("auth.noAccount")} <Link href={`/register${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ""}`} className="link">{t("nav.register")}</Link>
      </p>
    </div>
  );
}

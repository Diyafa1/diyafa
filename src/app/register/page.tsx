import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { getT } from "@/lib/i18n/server";
import { registerAction } from "@/app/actions/auth";
import { Field, Notice } from "@/components/ui";
import type { TKey } from "@/lib/i18n";
import { GoogleButton } from "@/components/GoogleButton";
import { googleEnabled } from "@/lib/google";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";
import { SEO } from "@/lib/seo-content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { ...pageMeta({ path: "/register", locale, ...SEO.register[locale] }) };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; as?: string }> }) {
  const { t } = await getT();
  const sp = await searchParams;
  return (
    <div className="container-page max-w-md py-10">
      <h1 className="mb-6 text-2xl">{t("auth.registerTitle")}</h1>
      {sp.error && <div className="mb-4"><Notice kind="brand">{t(`auth.err.${sp.error}` as TKey)}</Notice></div>}
      {googleEnabled() && <GoogleButton t={t} next={sp.next} intent={sp.as === "host" ? "host" : "guest"} />}
      <form action={registerAction} className="space-y-4">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <fieldset>
          <legend className="label">{t("auth.iAm")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["guest", "host"] as const).map((v) => (
              <label key={v} className="card flex cursor-pointer items-center gap-2 p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-50">
                <input type="radio" name="intent" value={v} defaultChecked={(sp.as ?? "guest") === v} className="accent-[#7A2E3A]" />
                {t(v === "guest" ? "auth.asGuest" : "auth.asHost")}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={t("auth.name")}><input className="input" name="name" required minLength={2} autoComplete="name" /></Field>
        <Field label={t("auth.email")}><input className="input" name="email" type="email" required autoComplete="email" /></Field>
        <Field label={t("auth.phone")}><input className="input" name="phone" type="tel" dir="ltr" autoComplete="tel" placeholder="+966 5x xxx xxxx" /></Field>
        <Field label={t("auth.password")} hint={t("auth.passwordHint")}><input className="input" name="password" type="password" required minLength={8} autoComplete="new-password" /></Field>
        <SubmitButton className="btn-primary w-full">{t("nav.register")}</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-600">
        {t("auth.haveAccount")} <Link href="/login" className="link">{t("nav.login")}</Link>
      </p>
    </div>
  );
}

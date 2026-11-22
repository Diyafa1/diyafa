import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { resetPasswordAction } from "@/app/actions/password";
import { Field, Notice } from "@/components/ui";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { t } = await getT();
  const sp = await searchParams;
  if (sp.error === "invalid" || !sp.token)
    return (
      <div className="container-page max-w-md py-10">
        <Notice kind="brand">{t("pw.invalid")}</Notice>
        <p className="mt-6 text-center"><Link href="/forgot" className="btn-primary no-underline">{t("pw.forgotTitle")}</Link></p>
      </div>
    );
  return (
    <div className="container-page max-w-md py-10">
      <h1 className="mb-6 text-2xl">{t("pw.newTitle")}</h1>
      {sp.error === "short" && <div className="mb-4"><Notice kind="brand">{t("auth.passwordHint")}</Notice></div>}
      <form action={resetPasswordAction} className="space-y-4">
        <input type="hidden" name="token" value={sp.token} />
        <Field label={t("auth.password")} hint={t("auth.passwordHint")}><input className="input" name="password" type="password" required minLength={8} autoComplete="new-password" /></Field>
        <button className="btn-primary w-full">{t("common.save")}</button>
      </form>
    </div>
  );
}

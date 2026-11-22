import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { forgotPasswordAction } from "@/app/actions/password";
import { Field, Notice } from "@/components/ui";

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { t } = await getT();
  const sp = await searchParams;
  return (
    <div className="container-page max-w-md py-10">
      <h1 className="mb-2 text-2xl">{t("pw.forgotTitle")}</h1>
      <p className="mb-6 text-sm text-neutral-600">{t("pw.forgotIntro")}</p>
      {sp.sent ? <Notice kind="brand">{t("pw.sent")}</Notice> : (
        <form action={forgotPasswordAction} className="space-y-4">
          <Field label={t("auth.email")}><input className="input" name="email" type="email" required autoComplete="email" /></Field>
          <button className="btn-primary w-full">{t("pw.sendLink")}</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="link">{t("nav.login")}</Link></p>
    </div>
  );
}

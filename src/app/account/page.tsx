import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { updateAccountAction } from "@/app/actions/account";
import { logoutAction } from "@/app/actions/auth";
import { Field, Notice, PageTitle } from "@/components/ui";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { t } = await getT();
  const sp = await searchParams;
  return (
    <div className="container-page max-w-lg py-6">
      <PageTitle>{t("account.title")}</PageTitle>
      {sp.saved && <div className="mb-4"><Notice kind="brand">{t("account.saved")}</Notice></div>}
      {sp.error && <div className="mb-4"><Notice kind="brand">{t("auth.err.form")}</Notice></div>}
      <form action={updateAccountAction} className="space-y-4">
        <Field label={t("auth.email")}><input className="input bg-neutral-50" value={user.email} disabled dir="ltr" /></Field>
        <Field label={t("auth.name")}><input className="input" name="name" defaultValue={user.name} required /></Field>
        <Field label={t("auth.phone")}><input className="input" name="phone" defaultValue={user.phone ?? ""} dir="ltr" /></Field>
        <Field label={t("gender.label")}>
          <select name="gender" className="input" defaultValue={user.gender ?? ""}>
            <option value="">—</option>
            <option value="MALE">{t("gender.user.MALE")}</option>
            <option value="FEMALE">{t("gender.user.FEMALE")}</option>
          </select>
        </Field>
        <Field label={t("account.language")}>
          <select name="locale" className="input" defaultValue={user.locale}>
            {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
          </select>
        </Field>
        <Field label={t("account.newPassword")}><input className="input" name="password" type="password" minLength={8} autoComplete="new-password" /></Field>
        <button className="btn-primary w-full">{t("common.save")}</button>
      </form>
      <div className="mt-8 flex flex-wrap gap-2">
        {user.role === "GUEST" && <Link href="/host/onboarding" className="btn-secondary no-underline">{t("nav.becomeHost")}</Link>}
        {user.role === "HOST" && <Link href="/host" className="btn-secondary no-underline">{t("nav.host")}</Link>}
        {user.role === "ADMIN" && <Link href="/admin" className="btn-secondary no-underline">{t("nav.admin")}</Link>}
        <form action={logoutAction}><button className="btn-ghost">{t("nav.logout")}</button></form>
      </div>
    </div>
  );
}

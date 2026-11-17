import { getT } from "@/lib/i18n/server";
import { getUser } from "@/lib/auth";
import { contactAction } from "@/app/actions/contact";
import { Field, Notice } from "@/components/ui";

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { t } = await getT();
  const user = await getUser();
  const sp = await searchParams;
  return (
    <div className="container-page max-w-lg py-8">
      <h1 className="mb-6 text-2xl">{t("contact.title")}</h1>
      {sp.sent && <div className="mb-4"><Notice kind="brand">{t("contact.sent")}</Notice></div>}
      {sp.error && <div className="mb-4"><Notice kind="brand">{t("auth.err.form")}</Notice></div>}
      <form action={contactAction} className="space-y-4">
        <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
        <Field label={t("auth.name")}><input name="name" required className="input" defaultValue={user?.name} /></Field>
        <Field label={t("auth.email")}><input name="email" type="email" required className="input" defaultValue={user?.email} dir="ltr" /></Field>
        <Field label={t("contact.subject")}><input name="subject" required className="input" /></Field>
        <Field label={t("contact.message")}><textarea name="body" required minLength={5} rows={5} className="input" /></Field>
        <button className="btn-primary w-full">{t("common.send")}</button>
      </form>
    </div>
  );
}

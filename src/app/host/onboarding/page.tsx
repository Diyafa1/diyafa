import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { hostApplicationAction } from "@/app/actions/host";
import { Field, Notice } from "@/components/ui";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  const { t } = await getT();
  const sp = await searchParams;
  const p = await db.hostProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="container-page max-w-xl py-6">
      <h1 className="mb-2 text-2xl">{t("host.onboardingTitle")}</h1>
      <p className="mb-6 text-sm text-neutral-600">{t("host.onboardingIntro")}</p>
      {p && <div className="mb-4"><Notice kind="brand">{p.status === "APPROVED" ? t("host.approved") : p.status === "REJECTED" ? t("host.rejected", { reason: p.rejectionReason ?? "—" }) : t("host.pending")}</Notice></div>}
      {sp.error && <div className="mb-4"><Notice kind="brand">{sp.error === "upload" ? t("lf.err.upload") : t("auth.err.form")}</Notice></div>}
      <form action={hostApplicationAction} className="space-y-4">
        <Field label={t("host.displayName")}><input className="input" name="displayName" required minLength={2} defaultValue={p?.displayName ?? user.name} /></Field>
        <Field label={t("host.whatsapp")}><input className="input" name="whatsapp" required dir="ltr" placeholder="+9665xxxxxxxx" defaultValue={p?.whatsapp ?? user.phone ?? ""} /></Field>
        <Field label={`${t("host.bio")} (${t("common.optional")})`}><textarea className="input" name="bio" rows={3} defaultValue={p?.bio ?? ""} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("host.idNumber")}><input className="input" name="idNumber" required dir="ltr" defaultValue={p?.idNumber ?? ""} /></Field>
          <Field label={t("host.idDoc")} hint={p?.idDocPath ? "✓" : undefined}><input className="input" name="idDoc" type="file" accept="image/*,application/pdf" required={!p?.idDocPath} /></Field>
        </div>
        <button className="btn-primary w-full">{t("host.submit")}</button>
      </form>
    </div>
  );
}

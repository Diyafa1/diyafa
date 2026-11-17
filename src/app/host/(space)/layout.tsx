import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { HostTabs } from "./tabs";

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("HOST");
  const profile = await db.hostProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/host/onboarding");
  const { t } = await getT();
  return (
    <div className="container-page py-6">
      {profile.status === "PENDING" && <div className="alert-brand mb-4">{t("host.pending")}</div>}
      {profile.status === "REJECTED" && (
        <div className="alert-brand mb-4">
          {t("host.rejected", { reason: profile.rejectionReason ?? "—" })} <a href="/host/onboarding" className="link">{t("host.profile")}</a>
        </div>
      )}
      <HostTabs labels={{
        dash: t("host.dashboard"), listings: t("host.listings"), bookings: t("host.bookings"),
        earnings: t("host.earnings"), reviews: t("host.reviews"), messages: t("nav.messages"), profile: t("host.profile"),
      }} />
      {children}
    </div>
  );
}

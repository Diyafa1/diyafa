import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { createListingAction } from "@/app/actions/host";
import { ListingForm } from "../listing-form";
import { Notice } from "@/components/ui";

export default async function NewListing({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireRole("HOST");
  const { t } = await getT();
  const sp = await searchParams;
  const profile = await db.hostProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-2xl">{t("host.newListing")}</h1>
      {sp.error && <div className="mb-4"><Notice kind="brand">{t("auth.err.form")}</Notice></div>}
      <ListingForm t={t} action={createListingAction} defaultLicense={profile?.licenseNumber} />
    </div>
  );
}

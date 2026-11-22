import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { createListingAction } from "@/app/actions/host";
import { ListingForm } from "../listing-form";
import { Notice } from "@/components/ui";

export default async function NewListing({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireRole("HOST");
  const { t } = await getT();
  const sp = await searchParams;
  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-2xl">{t("host.newListing")}</h1>
      {sp.error && <div className="mb-4"><Notice kind="brand">{t(sp.error === "contact" ? "lf.err.contact" : sp.error === "price" ? "lf.err.price" : "auth.err.form")}</Notice></div>}
      <ListingForm t={t} action={createListingAction} />
    </div>
  );
}

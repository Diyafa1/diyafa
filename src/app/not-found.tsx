import Link from "next/link";
import { getT } from "@/lib/i18n/server";
export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="container-page max-w-md py-16 text-center">
      <h1 className="mb-4 text-2xl">{t("listing.notFound")}</h1>
      <Link href="/search" className="btn-primary no-underline">{t("nav.search")}</Link>
    </div>
  );
}

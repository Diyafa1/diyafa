import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function Forbidden() {
  const { t } = await getT();
  return (
    <div className="container-page max-w-md py-16 text-center">
      <h1 className="mb-4 text-2xl">{t("auth.forbidden")}</h1>
      <Link href="/" className="btn-primary no-underline">{t("nav.home")}</Link>
    </div>
  );
}

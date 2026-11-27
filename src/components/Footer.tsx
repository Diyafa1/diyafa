import Link from "next/link";
import type { T } from "@/lib/i18n";
import { LogoMark } from "./Logo";

export function Footer({ t }: { t: T }) {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-50 pb-20 md:pb-0">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-neutral-600 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <span>© {new Date().getFullYear()} {t("app.name")} — {t("footer.rights")}</span>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/makkah" className="text-neutral-600">{t("city.MAKKAH")}</Link>
          <Link href="/madinah" className="text-neutral-600">{t("city.MADINAH")}</Link>
          <Link href="/help" className="text-neutral-600">{t("footer.help")}</Link>
          <Link href="/contact" className="text-neutral-600">{t("footer.contact")}</Link>
          <Link href="/terms" className="text-neutral-600">{t("footer.terms")}</Link>
          <Link href="/privacy" className="text-neutral-600">{t("footer.privacy")}</Link>
        </nav>
      </div>
    </footer>
  );
}

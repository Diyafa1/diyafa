import Link from "next/link";
import type { User } from "@prisma/client";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { Locale, T } from "@/lib/i18n";
import { logoutAction } from "@/app/actions/auth";

export function Header({ user, t, locale }: { user: User | null; t: T; locale: Locale }) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="no-underline">
          <Logo name={t("app.name")} />
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link href="/search" className="btn-ghost no-underline">{t("nav.search")}</Link>
          {user && <Link href="/trips" className="btn-ghost no-underline">{t("nav.trips")}</Link>}
          {user && <Link href="/favorites" className="btn-ghost no-underline">{t("nav.favorites")}</Link>}
          {user && <Link href="/messages" className="btn-ghost no-underline">{t("nav.messages")}</Link>}
          {user?.role === "HOST" && <Link href="/host" className="btn-ghost no-underline">{t("nav.host")}</Link>}
          {(user?.role === "ADMIN" || user?.role === "STAFF") && <Link href="/admin" className="btn-ghost no-underline">{t("nav.admin")}</Link>}
          {user?.role === "GUEST" && <Link href="/host/onboarding" className="btn-ghost no-underline">{t("nav.becomeHost")}</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} label={t("nav.language")} />
          {user ? (
            <div className="hidden items-center gap-1 md:flex">
              <Link href="/account" className="btn-ghost no-underline">{user.name.split(" ")[0]}</Link>
              <form action={logoutAction}>
                <button className="btn-secondary btn-sm">{t("nav.logout")}</button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-secondary btn-sm no-underline">{t("nav.login")}</Link>
              <Link href="/register" className="btn-primary btn-sm hidden no-underline sm:inline-flex">{t("nav.register")}</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar on phones. */
export function MobileNav({ user, t }: { user: User | null; t: T }) {
  if (!user) return null;
  const items = [
    { href: "/search", label: t("nav.search"), icon: "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" },
    { href: "/favorites", label: t("nav.favorites"), icon: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.5 4.5 7 4.5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21Z" },
    { href: "/trips", label: t("nav.trips"), icon: "M4 7h16v13H4zM8 3v4M16 3v4M4 11h16" },
    { href: "/messages", label: t("nav.messages"), icon: "M4 5h16v11H8l-4 4z" },
    user.role === "HOST"
      ? { href: "/host", label: t("nav.host"), icon: "M3 11l9-7 9 7v9H3zM9 20v-6h6v6" }
      : user.role === "ADMIN" || user.role === "STAFF"
        ? { href: "/admin", label: t("nav.admin"), icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" }
        : { href: "/account", label: t("nav.account"), icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 4-6 8-6s8 2 8 6" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-5">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="flex min-w-0 flex-col items-center gap-1 py-2 text-[11px] text-neutral-600 no-underline">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={i.icon} />
            </svg>
            <span className="w-full truncate px-1 text-center">{i.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

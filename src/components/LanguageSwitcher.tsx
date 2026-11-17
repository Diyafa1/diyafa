"use client";
import { useTransition } from "react";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { setLocaleAction } from "@/app/actions/common";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={label}
      className="rounded-[12px] border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-700"
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("locale", e.target.value);
        start(() => setLocaleAction(fd));
      }}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
      ))}
    </select>
  );
}

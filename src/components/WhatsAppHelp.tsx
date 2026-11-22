import type { T } from "@/lib/i18n";
import { longTermWhatsApp } from "@/lib/listing-ref";

/** Floating "Help on WhatsApp" button, shown on every page when SUPPORT_WHATSAPP is set (e.g. +32470000000). */
export function WhatsAppHelp({ t }: { t: T }) {
  // Diyafa's number by default (same as long-term visits); can be changed with SUPPORT_WHATSAPP
  const n = (process.env.SUPPORT_WHATSAPP || longTermWhatsApp()).replace(/[^\d]/g, "");
  if (!n) return null;
  return (
    <a
      href={`https://wa.me/${n}?text=${encodeURIComponent(t("help.waText"))}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("help.wa")}
      className="fixed bottom-24 end-4 z-40 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-medium text-white no-underline shadow-lg hover:bg-brand-dark md:bottom-6"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 5 5 0 0 0 1 2.6 11.3 11.3 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.1l-.5-.3Z" />
      </svg>
      <span className="hidden sm:inline">{t("help.wa")}</span>
    </a>
  );
}

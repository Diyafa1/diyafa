import type { T } from "@/lib/i18n";

export function GoogleButton({ t, next, intent }: { t: T; next?: string; intent?: "guest" | "host" }) {
  const q = new URLSearchParams();
  if (next) q.set("next", next);
  if (intent) q.set("intent", intent);
  return (
    <>
      <a href={`/api/auth/google${q.toString() ? `?${q}` : ""}`} className="btn-secondary w-full no-underline">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
          <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3ZM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Zm-5.6-8a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9l3.3-2.5ZM12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z" />
        </svg>
        {t("auth.google")}
      </a>
      <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />{t("auth.or")}<span className="h-px flex-1 bg-neutral-200" />
      </div>
    </>
  );
}

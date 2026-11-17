import type { T } from "@/lib/i18n";
import { walkMinutes } from "@/lib/haram";

export function formatDistance(m: number, t: T) {
  return m >= 1000 ? t("listing.km", { d: (m / 1000).toFixed(1) }) : t("listing.meters", { d: m });
}

export function DistanceBadge({ meters, t, compact }: { meters: number; t: T; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-1 text-brand ${compact ? "mt-1 text-xs" : "text-sm"}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="13" cy="4" r="2" /><path d="M10 21l2-6 3 3v3M9 12l2-4 4 2 2 3M7 12l2-4" />
      </svg>
      <span>
        {formatDistance(meters, t)} {t("listing.toHaram")} · {t("listing.walk", { m: walkMinutes(meters) })}
      </span>
    </div>
  );
}

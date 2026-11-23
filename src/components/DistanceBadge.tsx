import type { T } from "@/lib/i18n";
import { walkMinutes } from "@/lib/haram";

export function formatDistance(m: number, t: T) {
  return m >= 1000 ? t("listing.km", { d: String(Math.round(m / 100) / 10) }) : t("listing.meters", { d: m });
}

export function DistanceBadge({ meters, t, compact, driveMinutes, walk: walkGiven }: { meters: number; t: T; compact?: boolean; driveMinutes?: number | null; walk?: number | null }) {
  // times given by the host win; otherwise the walking time is estimated from the distance
  const walk = walkGiven ?? walkMinutes(meters);
  const far = !walkGiven && walk > 30;
  return (
    <div className={`flex items-center gap-1 text-brand ${compact ? "mt-1 text-xs" : "text-sm"}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="13" cy="4" r="2" /><path d="M10 21l2-6 3 3v3M9 12l2-4 4 2 2 3M7 12l2-4" />
      </svg>
      <span>
        {formatDistance(meters, t)} {t("listing.toHaram")}
        {!far ? ` · ${t("listing.walk", { m: walk })}` : ""}
        {driveMinutes ? ` · ${t("listing.drive", { m: driveMinutes })}` : ""}
      </span>
    </div>
  );
}

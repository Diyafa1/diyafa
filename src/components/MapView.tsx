"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = { id: string; lat: number; lng: number; label: string; href?: string };

/** OpenStreetMap map with the Haram and the listings (free, no API key). */
export function MapView({ center, haramLabel, points, height = 420, zoom = 15 }: {
  center: { lat: number; lng: number }; haramLabel: string; points: MapPoint[]; height?: number; zoom?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false }).setView([center.lat, center.lng], zoom);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const haram = L.divIcon({
        className: "",
        html: `<div style="background:#171717;color:#fff;border-radius:12px;padding:4px 8px;font:600 12px 'Readex Pro Variable',sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3)">🕋 ${haramLabel}</div>`,
        iconAnchor: [40, 14],
      });
      L.marker([center.lat, center.lng], { icon: haram, zIndexOffset: 1000 }).addTo(map);
      const bounds = L.latLngBounds([[center.lat, center.lng]]);
      for (const p of points) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#7A2E3A;color:#fff;border-radius:12px;padding:4px 8px;font:600 12px 'Readex Pro Variable',sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3)">${p.label.replace(/</g, "&lt;")}</div>`,
          iconAnchor: [24, 14],
        });
        const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
        if (p.href) m.on("click", () => (window.location.href = p.href!));
        bounds.extend([p.lat, p.lng]);
      }
      if (points.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [center.lat, center.lng, haramLabel, points, zoom]);
  return <div ref={el} style={{ height }} className="z-0 w-full overflow-hidden rounded-[12px] border border-neutral-200" />;
}

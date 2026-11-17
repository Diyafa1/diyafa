import type { City } from "@prisma/client";

export const HARAM_COORDS: Record<City, { lat: number; lng: number }> = {
  MAKKAH: { lat: 21.4225, lng: 39.8262 }, // Masjid al-Haram
  MADINAH: { lat: 24.4672, lng: 39.6112 }, // Al-Masjid an-Nabawi
};

/** Straight-line distance in metres (haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Walking time at ~4.5 km/h (75 m per minute). */
export const walkMinutes = (meters: number) => Math.max(1, Math.ceil(meters / 75));

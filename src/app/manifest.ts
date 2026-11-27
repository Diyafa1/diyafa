import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Al-Diyafa الضيافة",
    short_name: "Al-Diyafa",
    description: "Logements à Makkah et Médine près du Haram — Stays in Makkah & Madinah — سكن في مكة والمدينة",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#7A2E3A",
    dir: "auto",
    categories: ["travel", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Makkah", url: "/makkah", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Madinah", url: "/madinah", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Mes voyages · Trips", url: "/trips", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

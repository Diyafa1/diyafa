import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Al-Diyafa الضيافة",
    short_name: "Al-Diyafa",
    description: "Stays in Makkah & Madinah near the Haram",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7A2E3A",
    dir: "auto",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

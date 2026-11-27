import type { Metadata, Viewport } from "next";
import "@fontsource-variable/readex-pro";
import "./globals.css";
import { getLocale, getT } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/seo";
import { SEO } from "@/lib/seo-content";
import { dirOf } from "@/lib/i18n";
import { getUser } from "@/lib/auth";
import { Header, MobileNav } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/components/I18nProvider";
import { PwaRegister } from "@/components/PwaRegister";
import { WhatsAppHelp } from "@/components/WhatsAppHelp";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SEO.home[locale].title, template: "%s · Al-Diyafa" },
    description: SEO.home[locale].description,
    applicationName: "Al-Diyafa",
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: "Al-Diyafa", statusBarStyle: "default" },
    openGraph: { siteName: "Al-Diyafa الضيافة", images: [{ url: "/icons/og.png", width: 1200, height: 630 }] },
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION.trim() } } : {}),
  };
}
export const viewport: Viewport = { themeColor: "#7A2E3A", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = await getT();
  const user = await getUser();
  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body className="flex min-h-screen flex-col">
        <I18nProvider locale={locale}>
          <Header user={user} t={t} locale={locale} />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer t={t} />
          <MobileNav user={user} t={t} />
          <WhatsAppHelp t={t} />
          <PwaRegister />
        </I18nProvider>
      </body>
    </html>
  );
}

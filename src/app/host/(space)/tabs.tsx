"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HostTabs({ labels }: { labels: Record<string, string> }) {
  const path = usePathname();
  const items = [
    { href: "/host", label: labels.dash },
    { href: "/host/listings", label: labels.listings },
    { href: "/host/bookings", label: labels.bookings },
    { href: "/host/earnings", label: labels.earnings },
    { href: "/host/reviews", label: labels.reviews },
    { href: "/messages", label: labels.messages },
    { href: "/host/onboarding", label: labels.profile },
  ];
  const active = items.filter((i) => path === i.href || path.startsWith(i.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`whitespace-nowrap rounded-[12px] px-3 py-2 text-sm no-underline ${active === i.href ? "bg-brand text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

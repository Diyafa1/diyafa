"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTabs({ labels }: { labels: Record<string, string> }) {
  const path = usePathname();
  const items = Object.entries(labels).map(([k, label]) => ({ href: k === "dashboard" ? "/admin" : `/admin/${k}`, label }));
  return (
    <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1">
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`whitespace-nowrap rounded-[12px] px-3 py-2 text-sm no-underline ${active ? "bg-brand text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl">{children}</h1>
      {actions}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-neutral-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-8 text-center text-sm text-neutral-500">{children}</div>;
}

export function Tabs({ items, active }: { items: { href: string; label: string }[]; active: string }) {
  return (
    <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`whitespace-nowrap rounded-[12px] px-3 py-2 text-sm no-underline ${
            active === i.href ? "bg-brand text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "brand"; children: ReactNode }) {
  return <div className={kind === "brand" ? "alert-brand" : "alert"}>{children}</div>;
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "badge-brand",
  APPROVED: "badge-brand",
  COMPLETED: "badge",
  PAID: "badge-brand",
  REQUESTED: "badge-dark",
  PENDING: "badge-dark",
  PENDING_PAYMENT: "badge-dark",
  OPEN: "badge-dark",
};
export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={STATUS_STYLE[status] ?? "badge"}>{label}</span>;
}

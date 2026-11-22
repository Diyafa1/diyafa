import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { AdminTabs } from "./tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  const { t } = await getT();
  const keys = ["dashboard", "hosts", "listings", "bookings", "payments", "users", "disputes", "moderation", "settings", "seasons", "promos", "contact"] as const;
  return (
    <div className="container-page py-6">
      <AdminTabs labels={Object.fromEntries(keys.map((k) => [k, t(`admin.${k}`)]))} />
      {children}
    </div>
  );
}

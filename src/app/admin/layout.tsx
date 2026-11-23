import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { can, type Section } from "@/lib/permissions";
import { AdminTabs } from "./tabs";

const TABS: { key: string; section: Section }[] = [
  { key: "dashboard", section: "dashboard" },
  { key: "hosts", section: "hosts" },
  { key: "listings", section: "listings" },
  { key: "bookings", section: "bookings" },
  { key: "cancellations", section: "cancellations" },
  { key: "payments", section: "payments" },
  { key: "users", section: "users" },
  { key: "disputes", section: "disputes" },
  { key: "moderation", section: "moderation" },
  { key: "settings", section: "settings" },
  { key: "seasons", section: "seasons" },
  { key: "promos", section: "promos" },
  { key: "contact", section: "contact" },
  { key: "staff", section: "staff" },
  { key: "diagnostic", section: "settings" },
  { key: "reset", section: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN", "STAFF");
  const { t } = await getT();
  const visible = TABS.filter((x) => can(user, x.section));
  return (
    <div className="container-page py-6">
      <AdminTabs labels={Object.fromEntries(visible.map((x) => [x.key, t(`admin.${x.key}` as never)]))} />
      {children}
    </div>
  );
}

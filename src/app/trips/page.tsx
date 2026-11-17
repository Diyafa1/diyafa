import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { completeFinishedStays, expireStaleHolds } from "@/lib/bookings";
import { Empty, PageTitle } from "@/components/ui";
import { TripCard } from "@/components/TripCard";

export default async function TripsPage() {
  const user = await requireUser();
  const { t, locale } = await getT();
  await expireStaleHolds();
  await completeFinishedStays();
  const bookings = await db.booking.findMany({
    where: { guestId: user.id, status: { not: "EXPIRED" } },
    include: { listing: { include: { photos: { orderBy: { position: "asc" }, take: 1 } } } },
    orderBy: { checkIn: "desc" },
  });
  const upcoming = bookings.filter((b) => ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"].includes(b.status));
  const past = bookings.filter((b) => !upcoming.includes(b));
  return (
    <div className="container-page max-w-3xl py-6">
      <PageTitle>{t("trips.title")}</PageTitle>
      {bookings.length === 0 && <Empty>{t("trips.empty")}</Empty>}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg">{t("trips.upcoming")}</h2>
          <div className="space-y-3">{upcoming.map((b) => <TripCard key={b.id} b={b} t={t} locale={locale} href={`/trips/${b.id}`} />)}</div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg">{t("trips.past")}</h2>
          <div className="space-y-3">{past.map((b) => <TripCard key={b.id} b={b} t={t} locale={locale} href={`/trips/${b.id}`} />)}</div>
        </section>
      )}
    </div>
  );
}

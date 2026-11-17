import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { getListingCards, PUBLIC_LISTING } from "@/lib/listings";
import { ListingCard } from "@/components/ListingCard";
import { Empty, PageTitle } from "@/components/ui";

export default async function FavoritesPage() {
  const user = await requireUser();
  const { t, locale } = await getT();
  const rows = await getListingCards({ ...PUBLIC_LISTING, favorites: { some: { userId: user.id } } });
  return (
    <div className="container-page py-6">
      <PageTitle>{t("fav.title")}</PageTitle>
      {rows.length === 0 ? <Empty>{t("fav.empty")}</Empty> : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((l) => <ListingCard key={l.id} l={l} t={t} locale={locale} />)}
        </div>
      )}
    </div>
  );
}

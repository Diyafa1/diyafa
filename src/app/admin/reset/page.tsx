import { requireSection } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { formatListingPrice } from "@/lib/money";
import { displayPrice } from "@/lib/listings";
import { deleteListingsAction, resetBookingsAction } from "@/app/actions/admin";
import { fmtDay } from "@/components/TripCard";

/** Owner-only: wipe test data before launch. */
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ done?: string; n?: string; error?: string }> }) {
  await requireSection("settings");
  const { t, locale } = await getT();
  const sp = await searchParams;
  const [bookings, payments, reviews, listings] = await Promise.all([
    db.booking.count(),
    db.payment.count(),
    db.review.count(),
    db.listing.findMany({
      include: { host: { select: { name: true, email: true } }, rooms: { include: { beds: true } }, _count: { select: { bookings: true, photos: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <div className="max-w-4xl space-y-8">
      {sp.done === "bookings" && <div className="alert-brand">✅ Réservations, paiements, avis, litiges et gains remis à zéro.</div>}
      {sp.done === "listings" && <div className="alert-brand">✅ {sp.n} annonce(s) supprimée(s).</div>}
      {sp.error === "confirm" && <div className="alert-brand">Tapez le mot SUPPRIMER pour confirmer.</div>}
      {sp.error === "none" && <div className="alert-brand">Aucune annonce cochée.</div>}

      <section className="card space-y-3 p-4">
        <h2 className="text-lg">1. Remettre les compteurs et les gains à zéro</h2>
        <p className="text-sm text-neutral-600">
          Supprime toutes les réservations ({bookings}), paiements ({payments}), avis ({reviews}), litiges, versements et recherches « pas trouvées ».
          Les comptes (clients, hôtes, employés) et les annonces sont conservés. ⚠️ Irréversible.
        </p>
        <form action={resetBookingsAction} className="flex flex-wrap items-end gap-2">
          <label className="block"><span className="label">Tapez SUPPRIMER</span><input name="confirm" required className="input w-48" autoComplete="off" /></label>
          <button className="btn-primary">Tout remettre à zéro</button>
        </form>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-lg">2. Supprimer des annonces</h2>
        <p className="text-sm text-neutral-600">Cochez les annonces de test à supprimer (photos, lits, calendrier et conversations compris). Vérifiez la date et l'hôte pour ne pas supprimer un vrai hôte. ⚠️ Irréversible.</p>
        <form action={deleteListingsAction} className="space-y-3">
          <div className="max-h-[50vh] overflow-y-auto rounded-[12px] border border-neutral-200">
            <table className="table">
              <thead><tr><th></th><th>Annonce</th><th>Hôte</th><th>Créée le</th><th>Statut</th></tr></thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td><input type="checkbox" name="ids" value={l.id} className="accent-[#7A2E3A]" /></td>
                    <td><div className="font-medium">{l.title}</div><div className="text-xs text-neutral-500">{t(`type.${l.type}`)} · {formatListingPrice(l, displayPrice(l), locale)} · {l._count.photos} photo(s)</div></td>
                    <td><div>{l.host.name}</div><div className="text-xs text-neutral-500" dir="ltr">{l.host.email}</div></td>
                    <td>{fmtDay(l.createdAt, locale)}</td>
                    <td>{t(`lstatus.${l.status}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-brand"><input type="checkbox" name="all" className="accent-[#7A2E3A]" />Supprimer TOUTES les annonces ({listings.length})</label>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block"><span className="label">Tapez SUPPRIMER</span><input name="confirm" required className="input w-48" autoComplete="off" /></label>
            <button className="btn-primary">Supprimer les annonces cochées</button>
          </div>
        </form>
      </section>
    </div>
  );
}

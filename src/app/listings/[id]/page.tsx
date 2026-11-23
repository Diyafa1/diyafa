import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { getUser } from "@/lib/auth";
import { PUBLIC_LISTING, displayPrice } from "@/lib/listings";
import { formatListingPrice, formatMoney } from "@/lib/money";
import { DistanceBadge } from "@/components/DistanceBadge";
import { BookingWidget } from "@/components/BookingWidget";
import { toggleFavoriteAction } from "@/app/actions/booking";
import { startConversationAction } from "@/app/actions/messages";
import { AMENITIES } from "@/lib/amenities";
import { MapView } from "@/components/MapView";
import { HARAM_COORDS } from "@/lib/haram";
import { LongTermContact } from "@/components/LongTermContact";
import { listingRef, longTermMessage, longTermWhatsApp } from "@/lib/listing-ref";
import type { TKey } from "@/lib/i18n";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

async function load(id: string, viewerId?: string, isAdmin?: boolean) {
  const l = await db.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" } },
      rooms: { include: { beds: { where: { active: true }, orderBy: { label: "asc" } } }, orderBy: { name: "asc" } },
      host: { include: { hostProfile: true } },
      reviews: { where: { hidden: false }, include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!l) return null;
  const isPublic = await db.listing.count({ where: { id, ...PUBLIC_LISTING } });
  // Hosts can preview their own listing, admins can see everything
  if (!isPublic && l.hostId !== viewerId && !isAdmin) return null;
  return { ...l, isPublic: !!isPublic };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const l = await db.listing.findFirst({ where: { id, ...PUBLIC_LISTING }, select: { title: true } });
  return { title: l?.title ?? "Diyafa" };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const { t, locale } = await getT();
  const user = await getUser();
  const l = await load(id, user?.id, user?.role === "ADMIN");
  if (!l) notFound();
  const fav = user ? await db.favorite.findUnique({ where: { userId_listingId: { userId: user.id, listingId: l.id } } }) : null;
  const price = displayPrice(l);
  const unit = l.type === "LONG_TERM" ? t("listing.perYear") : l.type === "SHARED_BED" ? t("listing.perBed") : t("listing.perNight");
  const priceLabel = `${l.type === "SHARED_BED" ? t("listing.from") + " " : ""}${formatListingPrice(l, price, locale)} ${unit}`;
  const avg = l.reviews.length ? l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length : null;
  const hostName = l.host.hostProfile?.displayName ?? l.host.name;

  return (
    <div className="container-page py-6">
      {!l.isPublic && <div className="alert-brand mb-4">{t(`lstatus.${l.status}`)}</div>}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{l.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <span className="badge-brand">{t(`type.${l.type}`)}</span>
            <span>{t(`city.${l.city}`)}{l.neighborhood ? ` · ${l.neighborhood}` : ""}</span>
            {avg !== null && <span>★ {avg.toFixed(1)} ({l.reviews.length})</span>}
            <span className="text-neutral-400" dir="ltr">{listingRef(l.id)}</span>
          </div>
        </div>
        <form action={toggleFavoriteAction}>
          <input type="hidden" name="listingId" value={l.id} />
          <button className="btn-secondary btn-sm" aria-pressed={!!fav}>
            {fav ? "♥" : "♡"} {fav ? t("listing.saved") : t("listing.save")}
          </button>
        </form>
      </div>

      {/* Photos: swipeable on phones, grid on desktop */}
      <div className="-mx-4 mb-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:grid-rows-2 md:overflow-visible md:px-0">
        {l.photos.slice(0, 5).map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.url} alt="" className={`aspect-[4/3] w-[85%] shrink-0 snap-center rounded-[12px] object-cover md:w-full ${i === 0 ? "md:col-span-2 md:row-span-2 md:aspect-auto md:h-full" : ""}`} />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="space-y-2">
            <DistanceBadge meters={l.distanceToHaramM} walk={l.walkMinutes} driveMinutes={l.driveMinutes} t={t} />
            <p className="text-sm text-neutral-600">
              {l.type !== "SHARED_BED" && <>{t("listing.guests", { n: l.maxGuests })} · </>}
              {t("listing.bedrooms", { n: l.bedrooms })} · {t("listing.bathrooms", { n: l.bathrooms })}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg">{t("listing.description")}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{l.description}</p>
          </section>

          {l.type === "SHARED_BED" && (
            <section>
              <h2 className="mb-2 text-lg">{t("listing.rooms")} {l.bedGender && <span className="badge-brand ms-2">{t(`beds.for.${l.bedGender}`)}</span>}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {l.rooms.map((r) => (
                  <div key={r.id} className="card p-3 text-sm">
                    <div className="font-medium">{r.name}</div>
                    <ul className="mt-2 space-y-1 text-neutral-600">
                      {r.beds.map((b) => <li key={b.id} className="flex justify-between"><span>{b.label}</span><span>{formatMoney(b.pricePerNight, locale)}</span></li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {l.amenities.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg">{t("listing.amenities")}</h2>
              <ul className="grid grid-cols-2 gap-2 text-sm text-neutral-700 sm:grid-cols-3">
                {AMENITIES.filter((a) => l.amenities.includes(a)).map((a) => (
                  <li key={a} className="flex items-center gap-2"><span className="text-brand">✓</span>{t(`amenity.${a}` as TKey)}</li>
                ))}
              </ul>
            </section>
          )}

          {l.rules && (
            <section>
              <h2 className="mb-2 text-lg">{t("listing.rules")}</h2>
              <p className="whitespace-pre-line text-sm text-neutral-700">{l.rules}</p>
            </section>
          )}

          {l.latitude != null && l.longitude != null && (
            <section>
              <h2 className="mb-2 text-lg">{t("listing.location")}</h2>
              <MapView center={HARAM_COORDS[l.city]} haramLabel={t(l.city === "MADINAH" ? "map.nabawi" : "map.haram")} points={[{ id: l.id, lat: l.latitude, lng: l.longitude, label: "📍" }]} height={260} />
            </section>
          )}

          <section>
            <h2 className="mb-2 text-lg">{t("listing.times")}</h2>
            <p className="text-sm text-neutral-700">{t("listing.checkInFrom", { time: l.checkInTime })} · {t("listing.checkOutBefore", { time: l.checkOutTime })}</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg">{t("listing.cancellation")}</h2>
            <p className="text-sm text-neutral-700"><strong>{t(`policy.${l.cancellationPolicy}`)}</strong> — {t(`policy.${l.cancellationPolicy}.desc`)}</p>
          </section>

          {l.type === "LONG_TERM" ? (
            <section className="card p-4">
              <h2 className="mb-2 text-lg">{t("lt.managed")}</h2>
              <p className="text-sm text-neutral-700">{t("lt.explain")}</p>
            </section>
          ) : (
          <section className="card p-4">
            <h2 className="mb-3 text-lg">{t("listing.host")}</h2>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand">{hostName.slice(0, 1)}</span>
              <div>
                <div className="font-medium">{hostName} {l.host.hostProfile?.status === "APPROVED" && <span className="badge-brand ms-1">✓ {t("rstatus.APPROVED")}</span>}</div>
              </div>
            </div>
            {l.host.hostProfile?.bio && <p className="mt-3 text-sm text-neutral-700">{l.host.hostProfile.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {user && user.id !== l.hostId && (
                <form action={startConversationAction}>
                  <input type="hidden" name="listingId" value={l.id} />
                  <button className="btn-secondary">{t("listing.message")}</button>
                </form>
              )}
            </div>
          </section>
          )}

          <section>
            <h2 className="mb-3 text-lg">{t("listing.reviews")} {avg !== null && <span className="text-neutral-500">★ {avg.toFixed(1)}</span>}</h2>
            {l.reviews.length === 0 ? (
              <p className="text-sm text-neutral-500">{t("listing.noReviews")}</p>
            ) : (
              <ul className="space-y-4">
                {l.reviews.map((r) => (
                  <li key={r.id} className="border-b border-neutral-100 pb-4 text-sm">
                    <div className="flex justify-between"><span className="font-medium">{r.author.name.split(" ")[0]}</span><span>{"★".repeat(r.rating)}<span className="text-neutral-300">{"★".repeat(5 - r.rating)}</span></span></div>
                    <div className="text-xs text-neutral-500">{r.createdAt.toLocaleDateString(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : locale)}</div>
                    <p className="mt-1 text-neutral-700">{r.comment}</p>
                    {r.hostReply && <p className="mt-2 rounded-[12px] bg-neutral-50 p-3 text-neutral-700"><strong>{t("review.hostReply")}:</strong> {r.hostReply}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {l.isPublic && l.type === "LONG_TERM" ? (
            <LongTermContact
              t={t}
              priceLabel={priceLabel}
              refCode={listingRef(l.id)}
              twoPayments={l.allowTwoPayments && l.pricePerYear ? formatListingPrice(l, Math.round(l.pricePerYear / 2), locale) : null}
              waNumber={longTermWhatsApp()}
              message={longTermMessage({ ref: listingRef(l.id), title: l.title, url: `${process.env.APP_URL || ""}/listings/${l.id}`, twoPayments: l.allowTwoPayments })}
            />
          ) : l.isPublic ? (
            <BookingWidget
              listingId={l.id}
              type={l.type}
              priceLabel={priceLabel}
              instantBook={l.instantBook}
              minNights={l.minNights}
              minMonths={l.minMonths}
              maxGuests={l.maxGuests}
              beds={l.rooms.flatMap((r) => r.beds.map((b) => ({ id: b.id, label: b.label, pricePerNight: b.pricePerNight, roomName: r.name, gender: r.gender })))}
              loggedIn={!!user}
              userGender={user?.gender ?? null}
              bedGender={l.bedGender}
              initial={{ checkIn: sp.checkIn, checkOut: sp.checkOut, guests: sp.guests, months: sp.months }}
            />
          ) : (
            <div className="card p-4 text-sm text-neutral-600">{priceLabel}</div>
          )}
          {user?.id === l.hostId && <Link href={`/host/listings/${l.id}`} className="btn-secondary mt-3 w-full no-underline">{t("host.edit")}</Link>}
        </aside>
      </div>
    </div>
  );
}

import type { T } from "@/lib/i18n";

export type SearchParams = Record<string, string | undefined>;

export function SearchForm({ t, sp = {}, full = false }: { t: T; sp?: SearchParams; full?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action="/search" method="get" className="card grid gap-3 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
      <label className="block lg:col-span-1">
        <span className="label">{t("search.city")}</span>
        <select name="city" className="input" defaultValue={sp.city ?? "MAKKAH"}>
          <option value="MAKKAH">{t("city.MAKKAH")}</option>
          <option value="MADINAH">{t("city.MADINAH")}</option>
        </select>
      </label>
      <label className="block">
        <span className="label">{t("search.type")}</span>
        <select name="type" className="input" defaultValue={sp.type ?? ""}>
          <option value="">{t("search.anyType")}</option>
          <option value="SHORT_STAY">{t("type.SHORT_STAY")}</option>
          <option value="SHARED_BED">{t("type.SHARED_BED")}</option>
          <option value="LONG_TERM">{t("type.LONG_TERM")}</option>
        </select>
      </label>
      <label className="block">
        <span className="label">{t("search.checkIn")}</span>
        <input type="date" name="checkIn" min={today} className="input" defaultValue={sp.checkIn} />
      </label>
      <label className="block">
        <span className="label">{t("search.checkOut")}</span>
        <input type="date" name="checkOut" min={today} className="input" defaultValue={sp.checkOut} />
      </label>
      <label className="block">
        <span className="label">{t("search.guests")}</span>
        <input type="number" name="guests" min={1} max={30} className="input" defaultValue={sp.guests ?? "1"} />
      </label>
      {full && (
        <>
          <label className="block">
            <span className="label">{t("search.bedsFor")}</span>
            <select name="gender" className="input" defaultValue={sp.gender ?? ""}>
              <option value="">{t("search.anyGender")}</option>
              <option value="MALE">{t("gender.MALE")}</option>
              <option value="FEMALE">{t("gender.FEMALE")}</option>
            </select>
          </label>
          <label className="block">
            <span className="label">{t("search.minPrice")}</span>
            <input type="number" name="minPrice" min={0} className="input" defaultValue={sp.minPrice} />
          </label>
          <label className="block">
            <span className="label">{t("search.maxPrice")}</span>
            <input type="number" name="maxPrice" min={0} className="input" defaultValue={sp.maxPrice} />
          </label>
          <label className="block">
            <span className="label">{t("search.maxDistance")}</span>
            <select name="maxDistance" className="input" defaultValue={sp.maxDistance ?? ""}>
              <option value="">{t("search.anyDistance")}</option>
              {[300, 500, 1000, 2000, 5000].map((m) => (
                <option key={m} value={m}>{m >= 1000 ? t("listing.km", { d: m / 1000 }) : t("listing.meters", { d: m })}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">{t("search.months")}</span>
            <input type="number" name="months" min={1} max={24} className="input" defaultValue={sp.months} />
          </label>
          <label className="block">
            <span className="label">{t("search.sort")}</span>
            <select name="sort" className="input" defaultValue={sp.sort ?? "distance"}>
              <option value="distance">{t("search.sort.distance")}</option>
              <option value="priceAsc">{t("search.sort.priceAsc")}</option>
              <option value="priceDesc">{t("search.sort.priceDesc")}</option>
              <option value="rating">{t("search.sort.rating")}</option>
            </select>
          </label>
        </>
      )}
      <div className="flex items-end lg:col-span-1">
        <button className="btn-primary w-full">{t("search.submit")}</button>
      </div>
    </form>
  );
}

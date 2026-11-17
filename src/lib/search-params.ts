import type { City, ListingType } from "@prisma/client";
import type { SearchFilters } from "./listings";
import { parseDay } from "./dates";

const CITIES = ["MAKKAH", "MADINAH"];
const TYPES = ["LONG_TERM", "SHORT_STAY", "SHARED_BED"];
const SORTS = ["distance", "priceAsc", "priceDesc", "rating"];

const posInt = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};
const day = (v?: string) => {
  try {
    return v ? parseDay(v) : undefined;
  } catch {
    return undefined;
  }
};

export function parseSearch(sp: Record<string, string | undefined>): SearchFilters {
  const checkIn = day(sp.checkIn);
  let checkOut = day(sp.checkOut);
  if (checkIn && checkOut && checkOut <= checkIn) checkOut = undefined;
  return {
    city: CITIES.includes(sp.city ?? "") ? (sp.city as City) : undefined,
    type: TYPES.includes(sp.type ?? "") ? (sp.type as ListingType) : undefined,
    checkIn,
    checkOut,
    months: posInt(sp.months),
    guests: posInt(sp.guests),
    minPrice: posInt(sp.minPrice) ? posInt(sp.minPrice)! * 100 : undefined,
    maxPrice: posInt(sp.maxPrice) ? posInt(sp.maxPrice)! * 100 : undefined,
    maxDistance: posInt(sp.maxDistance),
    sort: SORTS.includes(sp.sort ?? "") ? (sp.sort as SearchFilters["sort"]) : undefined,
  };
}

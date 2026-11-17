export const AMENITIES = [
  "wifi", "ac", "kitchen", "washer", "parking", "elevator", "tv", "haramView",
  "prayerArea", "zamzam", "shuttle", "familyFriendly", "wheelchair", "lockers", "cleaning",
] as const;
export type Amenity = (typeof AMENITIES)[number];

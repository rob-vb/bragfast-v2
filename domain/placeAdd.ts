import type { SpotType } from "./spot";

const LIVE_TYPES: Record<string, SpotType> = {
  cafe: "cafe",
  bakery: "bakery",
  restaurant: "cafe",
  meal_takeaway: "cafe",
  breakfast_restaurant: "cafe",
  brunch_restaurant: "cafe",
  coffee_shop: "cafe",
  lodging: "hotel",
  hotel: "hotel",
  bed_and_breakfast: "hotel",
  guest_house: "hotel",
};

export type PlaceAddPlan =
  | { action: "live"; spotType: SpotType }
  | { action: "queue"; reason: "disallowed-type" };

export function classifyPlaceTypes(types: readonly string[]): PlaceAddPlan {
  for (const type of types) {
    const spotType = LIVE_TYPES[type];
    if (spotType) {
      return { action: "live", spotType };
    }
  }
  return { action: "queue", reason: "disallowed-type" };
}

export function slugFromPlaceName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length === 0 ? "spot" : slug;
}

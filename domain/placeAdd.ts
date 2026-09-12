import { parseCitySlug, parseSpotSlug, type CitySlug, type SpotSlug } from "./ids";
import type { SpotType } from "./spot";
import { assignPlaceSlug } from "./woonplaatsen";

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

const REJECT_TYPES = new Set(["fast_food", "gas_station"]);

export type PlaceAddRejectReason =
  | "disallowed-type"
  | "no-woonplaats"
  | "photo-required";

export type PlaceTypeGate =
  | { action: "live"; spotType: SpotType }
  | { action: "reject"; reason: "disallowed-type" };

export type PlaceAddPlan =
  | { action: "live"; spotType: SpotType; placeSlug: CitySlug }
  | { action: "redirect"; spotSlug: SpotSlug; placeSlug: CitySlug }
  | { action: "reject"; reason: PlaceAddRejectReason };

export function classifyPlaceTypes(types: readonly string[]): PlaceTypeGate {
  for (const type of types) {
    if (REJECT_TYPES.has(type)) {
      return { action: "reject", reason: "disallowed-type" };
    }
  }
  for (const type of types) {
    const spotType = LIVE_TYPES[type];
    if (spotType) {
      return { action: "live", spotType };
    }
  }
  return { action: "reject", reason: "disallowed-type" };
}

export function planPlaceAdd(input: {
  types: readonly string[];
  geo: { lat: number; lng: number };
  photo: boolean;
  existing: { spotSlug: string; placeSlug: string } | null;
}): PlaceAddPlan {
  if (input.existing) {
    return {
      action: "redirect",
      spotSlug: parseSpotSlug(input.existing.spotSlug),
      placeSlug: parseCitySlug(input.existing.placeSlug),
    };
  }
  const gate = classifyPlaceTypes(input.types);
  if (gate.action === "reject") {
    return gate;
  }
  if (!input.photo) {
    return { action: "reject", reason: "photo-required" };
  }
  const placeSlug = assignPlaceSlug(input.geo);
  if (!placeSlug) {
    return { action: "reject", reason: "no-woonplaats" };
  }
  return { action: "live", spotType: gate.spotType, placeSlug };
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

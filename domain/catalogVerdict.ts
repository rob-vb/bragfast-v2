import { hasOpenBefore, type OpeningHours, type SpotType } from "./spot";
import { slugFromPlaceName } from "./placeAdd";

const FAST_FOOD_TYPE = "fast_food_restaurant";

const FAST_FOOD_SLUGS = [
  "mcdonalds",
  "mcdonald-s",
  "burger-king",
  "kfc",
  "subway",
  "febo",
  "new-york-pizza",
] as const;

const BREAKFAST_PLACE_TYPES: Record<string, SpotType> = {
  cafe: "cafe",
  bakery: "bakery",
  coffee_shop: "cafe",
  breakfast_restaurant: "cafe",
  brunch_restaurant: "cafe",
  lodging: "hotel",
  hotel: "hotel",
  bed_and_breakfast: "hotel",
  guest_house: "hotel",
};

const GENERIC_RESTAURANT_TYPES = ["restaurant", "meal_takeaway"] as const;

export const BREAKFAST_OPEN_BEFORE = "11:00";

export type FastFoodEvidence =
  | { kind: "google-type"; value: typeof FAST_FOOD_TYPE }
  | { kind: "blocked-name"; value: (typeof FAST_FOOD_SLUGS)[number] };

export type CatalogFitVerdict =
  | { kind: "hospitality"; spotType: SpotType }
  | { kind: "fast-food"; evidence: FastFoodEvidence }
  | { kind: "not-hospitality" };

function slugMatchesBrand(slug: string, brand: string): boolean {
  return (
    slug === brand ||
    slug.startsWith(`${brand}-`) ||
    slug.includes(`-${brand}-`) ||
    slug.endsWith(`-${brand}`)
  );
}

export function blockedFastFoodName(
  name: string,
): (typeof FAST_FOOD_SLUGS)[number] | null {
  const slug = slugFromPlaceName(name);
  for (const brand of FAST_FOOD_SLUGS) {
    if (slugMatchesBrand(slug, brand)) {
      return brand;
    }
  }
  return null;
}

function breakfastSpotType(types: readonly string[]): SpotType | null {
  for (const type of types) {
    const spotType = BREAKFAST_PLACE_TYPES[type];
    if (spotType) {
      return spotType;
    }
  }
  return null;
}

function isGenericRestaurant(types: readonly string[]): boolean {
  return GENERIC_RESTAURANT_TYPES.some((type) => types.includes(type));
}

function opensForBreakfast(hours: OpeningHours | null | undefined): boolean | null {
  if (!hours) {
    return null;
  }
  return hasOpenBefore(hours, BREAKFAST_OPEN_BEFORE);
}

export function catalogTypesFromStored(input: {
  spotType: SpotType;
  placesRaw: unknown;
}): string[] {
  if (input.placesRaw !== null && typeof input.placesRaw === "object") {
    const raw = input.placesRaw as Record<string, unknown>;
    if (Array.isArray(raw.types)) {
      const types = raw.types.filter((entry): entry is string => typeof entry === "string");
      if (types.length > 0) {
        return types;
      }
    }
  }
  if (input.spotType === "hotel") {
    return ["hotel"];
  }
  if (input.spotType === "bakery") {
    return ["bakery"];
  }
  return ["cafe"];
}

export function judgeCatalogFit(input: {
  name: string;
  types: readonly string[];
  hours?: OpeningHours | null;
}): CatalogFitVerdict {
  if (input.types.includes(FAST_FOOD_TYPE)) {
    return {
      kind: "fast-food",
      evidence: { kind: "google-type", value: FAST_FOOD_TYPE },
    };
  }
  const blocked = blockedFastFoodName(input.name);
  if (blocked) {
    return {
      kind: "fast-food",
      evidence: { kind: "blocked-name", value: blocked },
    };
  }

  const typed = breakfastSpotType(input.types);
  const morning = opensForBreakfast(input.hours ?? null);
  if (typed === "hotel") {
    return { kind: "hospitality", spotType: "hotel" };
  }
  if (typed !== null) {
    if (morning === false) {
      return { kind: "not-hospitality" };
    }
    return { kind: "hospitality", spotType: typed };
  }
  if (isGenericRestaurant(input.types) && morning === true) {
    return { kind: "hospitality", spotType: "cafe" };
  }
  return { kind: "not-hospitality" };
}

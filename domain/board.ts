import type { CityCard, CitySpotCard } from "./viewModels";

export type WoonplaatsBoard =
  | { kind: "empty"; city: CityCard }
  | { kind: "listed"; city: CityCard; spots: readonly [CitySpotCard, ...CitySpotCard[]] };

export function boardFromListedSpots(
  city: CityCard,
  spots: readonly CitySpotCard[],
): WoonplaatsBoard {
  if (spots.length === 0) return { kind: "empty", city };
  return { kind: "listed", city, spots: spots as readonly [CitySpotCard, ...CitySpotCard[]] };
}

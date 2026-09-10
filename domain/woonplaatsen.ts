import data from "./data/woonplaatsen.json";
import { canonicalCitySlug, type GazetteerCity } from "./cities";
import { parseCitySlug } from "./ids";

export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type GazetteerWoonplaats = GazetteerCity & {
  identificatie: string;
  bbox: BBox;
  rings: readonly (readonly (readonly number[])[])[];
};

type WoonplaatsenFile = {
  version: string;
  woonplaatsen: GazetteerWoonplaats[];
};

const FILE = data as WoonplaatsenFile;

export const NL_WOONPLAATSEN: readonly GazetteerWoonplaats[] = FILE.woonplaatsen;

export { canonicalCitySlug, lookupWoonplaats } from "./cities";

function inBBox(point: { lat: number; lng: number }, bbox: BBox): boolean {
  return (
    point.lng >= bbox.west &&
    point.lng <= bbox.east &&
    point.lat >= bbox.south &&
    point.lat <= bbox.north
  );
}

function ringContains(
  point: { lat: number; lng: number },
  ring: readonly (readonly number[])[],
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const ai = ring[i];
    const aj = ring[j];
    if (!ai || !aj || ai.length < 2 || aj.length < 2) {
      continue;
    }
    const xi = ai[0]!;
    const yi = ai[1]!;
    const xj = aj[0]!;
    const yj = aj[1]!;
    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointInWoonplaats(
  point: { lat: number; lng: number },
  woonplaats: GazetteerWoonplaats,
): boolean {
  if (!inBBox(point, woonplaats.bbox)) {
    return false;
  }
  return woonplaats.rings.some((ring) => ringContains(point, ring));
}

export function assignPlaceSlug(point: { lat: number; lng: number }): string | null {
  for (const woonplaats of NL_WOONPLAATSEN) {
    if (pointInWoonplaats(point, woonplaats)) {
      return parseCitySlug(woonplaats.slug);
    }
  }
  return null;
}

export function assignPlaceSlugWithFallback(
  point: { lat: number; lng: number },
  localityNames: readonly string[],
): string | null {
  const polygon = assignPlaceSlug(point);
  if (polygon) {
    return polygon;
  }
  for (const name of localityNames) {
    const slug = canonicalCitySlug(name);
    if (slug) {
      return slug;
    }
  }
  return null;
}

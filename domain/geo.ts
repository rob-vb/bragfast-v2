import { NL_CITIES } from "./cities";
import { assignPlaceSlug } from "./woonplaatsen";
import type { CitySlug } from "./ids";

export type GeoPoint = { lat: number; lng: number };

export const NL_CITY_CENTROIDS: Record<string, GeoPoint> = Object.fromEntries(
  NL_CITIES.map((city) => [city.slug, { lat: city.lat, lng: city.lng }]),
);

const EARTH_M = 6371000;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function sortByDistance<T extends { geo: GeoPoint }>(
  origin: GeoPoint,
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) => haversineMeters(origin, a.geo) - haversineMeters(origin, b.geo),
  );
}

export function nearestCity<T extends { slug: CitySlug; geo: GeoPoint }>(
  origin: GeoPoint,
  cities: readonly T[],
): T | null {
  if (cities.length === 0) {
    return null;
  }
  return sortByDistance(origin, cities)[0] ?? null;
}

export function cityCentroid(slug: string): GeoPoint | null {
  return NL_CITY_CENTROIDS[slug] ?? null;
}

export function assignCitySlug(geo: GeoPoint): string | null {
  return assignPlaceSlug(geo);
}

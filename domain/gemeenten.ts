import data from "./data/gemeenten.json";
import populationFile from "./data/gemeente-population.json";
import { orderGemeentenForIngest } from "./ingestTurn";
import { parseCitySlug } from "./ids";

export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type GazetteerCity = {
  slug: string;
  nameNl: string;
  nameEn: string;
  lat: number;
  lng: number;
  featuredOrder?: number;
};

export type GazetteerGemeente = GazetteerCity & {
  code: string;
  population: number;
  aliases: readonly string[];
  bbox: BBox;
  rings: readonly (readonly (readonly number[])[])[];
};

type GemeentenFile = {
  version: string;
  gemeenten: Array<Omit<GazetteerGemeente, "population">>;
};

type PopulationFile = {
  populations: Record<string, number>;
};

const FILE = data as GemeentenFile;
const POPULATIONS = (populationFile as PopulationFile).populations;

export const GEMEENTEN_VERSION = FILE.version;

export const NL_GEMEENTEN: readonly GazetteerGemeente[] = FILE.gemeenten.map(
  (gemeente) => ({
    ...gemeente,
    population: POPULATIONS[gemeente.code] ?? 0,
  }),
);

export const NL_INGEST_GEMEENTEN: readonly GazetteerGemeente[] =
  orderGemeentenForIngest(NL_GEMEENTEN);

export const NL_CITIES: readonly GazetteerCity[] = NL_GEMEENTEN.map(
  (gemeente) => ({
    slug: gemeente.slug,
    nameNl: gemeente.nameNl,
    nameEn: gemeente.nameEn,
    lat: gemeente.lat,
    lng: gemeente.lng,
    ...(gemeente.featuredOrder !== undefined
      ? { featuredOrder: gemeente.featuredOrder }
      : {}),
  }),
);

const bySlug = new Map<string, GazetteerGemeente>();
const byAlias = new Map<string, GazetteerGemeente>();

for (const gemeente of NL_GEMEENTEN) {
  bySlug.set(gemeente.slug, gemeente);
  for (const alias of gemeente.aliases) {
    byAlias.set(alias.toLowerCase(), gemeente);
  }
}

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

export function pointInGemeente(
  point: { lat: number; lng: number },
  gemeente: GazetteerGemeente,
): boolean {
  if (!inBBox(point, gemeente.bbox)) {
    return false;
  }
  return gemeente.rings.some((ring) => ringContains(point, ring));
}

export function lookupGemeente(input: string): GazetteerGemeente | null {
  const needle = input.trim().toLowerCase();
  if (needle.length === 0) {
    return null;
  }
  return bySlug.get(needle) ?? byAlias.get(needle) ?? null;
}

export function canonicalCitySlug(input: string): string | null {
  const gemeente = lookupGemeente(input);
  if (gemeente) {
    return gemeente.slug;
  }
  for (const row of NL_GEMEENTEN) {
    if (
      row.nameNl.toLowerCase() === input.trim().toLowerCase() ||
      row.nameEn.toLowerCase() === input.trim().toLowerCase()
    ) {
      return row.slug;
    }
  }
  return null;
}

export function assignGemeenteSlug(point: { lat: number; lng: number }): string | null {
  for (const gemeente of NL_GEMEENTEN) {
    if (pointInGemeente(point, gemeente)) {
      return parseCitySlug(gemeente.slug);
    }
  }
  return null;
}

export function assignCitySlugWithFallback(
  point: { lat: number; lng: number },
  localityNames: readonly string[],
): string | null {
  const polygon = assignGemeenteSlug(point);
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

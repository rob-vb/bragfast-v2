import { canonicalCitySlug, NL_CITIES } from "./cities";
import { parseCitySlug } from "./ids";
import type { SearchHit } from "./viewModels";

export function searchNeedle(query: string): string {
  return query.trim().toLowerCase();
}

type CityHit = Extract<SearchHit, { kind: "city" }>;

type IndexedCity = {
  hit: CityHit;
  hay: string;
};

const SEARCH_INDEX: IndexedCity[] = NL_CITIES.map((city) => ({
  hit: {
    kind: "city",
    slug: parseCitySlug(city.slug),
    nameNl: city.nameNl,
    nameEn: city.nameEn,
  },
  hay: [
    city.slug,
    city.nameNl.toLowerCase(),
    city.nameEn.toLowerCase(),
    ...city.aliases.map((alias) => alias.toLowerCase()),
  ].join("\n"),
}));

const BY_GRAM = new Map<string, IndexedCity[]>();

for (const row of SEARCH_INDEX) {
  const seen = new Set<string>();
  for (let i = 0; i <= row.hay.length - 2; i += 1) {
    const gram = row.hay.slice(i, i + 2);
    if (seen.has(gram)) {
      continue;
    }
    seen.add(gram);
    const bucket = BY_GRAM.get(gram);
    if (bucket) {
      bucket.push(row);
    } else {
      BY_GRAM.set(gram, [row]);
    }
  }
}

export function isExactCityQuery(
  query: string,
  city: { slug: string; nameNl: string; nameEn: string },
): boolean {
  const needle = searchNeedle(query);
  if (needle.length < 2) {
    return false;
  }
  return canonicalCitySlug(query) === city.slug;
}

export function exactCitySlugFromHits(
  query: string,
  hits: SearchHit[],
): string | null {
  const slug = canonicalCitySlug(query);
  if (!slug || searchNeedle(query).length < 2) {
    return null;
  }
  for (const hit of hits) {
    if (hit.kind === "city" && hit.slug === slug) {
      return slug;
    }
  }
  return slug;
}

export function searchWoonplaatsHits(query: string): SearchHit[] {
  const needle = searchNeedle(query);
  if (needle.length < 2) {
    return [];
  }
  const candidates = BY_GRAM.get(needle.slice(0, 2)) ?? [];
  const hits: SearchHit[] = [];
  for (const row of candidates) {
    if (row.hay.includes(needle)) {
      hits.push(row.hit);
    }
  }
  return hits;
}


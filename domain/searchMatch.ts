import { canonicalCitySlug, NL_CITIES } from "./cities";
import { parseCitySlug } from "./ids";
import type { SearchHit } from "./viewModels";

export function searchNeedle(query: string): string {
  return query.trim().toLowerCase();
}

type IndexedCity = {
  hit: SearchHit;
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

export function exactCitySlugFromHits(
  query: string,
  hits: SearchHit[],
): string | null {
  const slug = canonicalCitySlug(query);
  if (!slug || searchNeedle(query).length < 2) {
    return null;
  }
  for (const hit of hits) {
    if (hit.slug === slug) {
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

export type WoonplaatsSuggest =
  | { kind: "closed" }
  | { kind: "none"; query: string }
  | {
      kind: "list";
      query: string;
      hits: readonly SearchHit[];
      active: SearchHit;
    };

export function woonplaatsSuggest(query: string): WoonplaatsSuggest {
  const needle = searchNeedle(query);
  if (needle.length < 2) {
    return { kind: "closed" };
  }
  const hits = searchWoonplaatsHits(query);
  // Gram order is not rank. An exact BAG slug must be active so Enter opens that city.
  const exactSlug = canonicalCitySlug(query);
  const exact = exactSlug
    ? hits.find((hit) => hit.slug === exactSlug)
    : undefined;
  const ordered =
    exact === undefined
      ? hits
      : [exact, ...hits.filter((hit) => hit.slug !== exact.slug)];
  const active = ordered[0];
  if (active === undefined) {
    return { kind: "none", query };
  }
  return { kind: "list", query, hits: ordered, active };
}

export function moveWoonplaatsSuggest(
  state: Extract<WoonplaatsSuggest, { kind: "list" }>,
  delta: 1 | -1,
): Extract<WoonplaatsSuggest, { kind: "list" }> {
  const length = state.hits.length;
  const i = state.hits.findIndex((hit) => hit.slug === state.active.slug);
  const next = state.hits[(i + delta + length) % length];
  if (next === undefined) {
    return state;
  }
  return { ...state, active: next };
}

export function pickWoonplaatsHref(
  state: WoonplaatsSuggest,
): `/nl/${string}` | null {
  if (state.kind === "list") {
    return `/nl/${state.active.slug}`;
  }
  return null;
}


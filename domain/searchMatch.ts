import type { SearchHit } from "./viewModels";

export function searchNeedle(query: string): string {
  return query.trim().toLowerCase();
}

export function isExactCityQuery(
  query: string,
  city: { slug: string; nameNl: string; nameEn: string },
): boolean {
  const needle = searchNeedle(query);
  if (needle.length < 2) {
    return false;
  }
  return (
    city.slug === needle ||
    city.nameNl.toLowerCase() === needle ||
    city.nameEn.toLowerCase() === needle
  );
}

export function exactCitySlugFromHits(
  query: string,
  hits: SearchHit[],
): string | null {
  for (const hit of hits) {
    if (hit.kind === "city" && isExactCityQuery(query, hit)) {
      return hit.slug;
    }
  }
  return null;
}

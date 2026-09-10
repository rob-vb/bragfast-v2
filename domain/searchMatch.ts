import { canonicalCitySlug } from "./gemeenten";
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

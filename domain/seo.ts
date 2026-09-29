import { lookupWoonplaats } from "./cities";
import { parseCitySlug } from "./ids";
import type { Locale } from "./messages";
import type { BoardIndexEntry, LiveSpotRef, SitemapEntry } from "./viewModels";

/** Pages the header, footer or home link to; always crawlable. */
const CHROME_PATHS = ["/", "/how-it-works", "/nl/woonplaatsen", "/nl/leaderboard"] as const;

/**
 * The boards that have something on them. An empty board stays reachable
 * through search but is noindex and left out of the sitemap until its first
 * spot, so thousands of identical empty pages don't stand for the site.
 */
export function boardIndex(spots: readonly LiveSpotRef[]): BoardIndexEntry[] {
  const counts = new Map<string, number>();
  for (const spot of spots) {
    counts.set(spot.citySlug, (counts.get(spot.citySlug) ?? 0) + 1);
  }
  const entries: BoardIndexEntry[] = [];
  for (const [slug, spotCount] of counts) {
    const city = lookupWoonplaats(slug);
    if (city === null || city.slug !== slug) {
      continue;
    }
    entries.push({
      city: { slug: parseCitySlug(city.slug), nameNl: city.nameNl, nameEn: city.nameEn },
      spotCount,
    });
  }
  return entries;
}

export function planSitemap(spots: readonly LiveSpotRef[]): SitemapEntry[] {
  const boards = boardIndex(spots).map((entry) => `/nl/${entry.city.slug}`);
  const live = new Set(boards);
  return [
    ...CHROME_PATHS,
    ...boards.sort(),
    ...spots
      .filter((spot) => live.has(`/nl/${spot.citySlug}`))
      .map((spot) => `/nl/${spot.citySlug}/${spot.slug}`)
      .sort(),
  ].map((path) => ({ path }));
}

/** "'s-Hertogenbosch" files under H, "Ĳlst" under I. */
function sortKey(name: string): string {
  return name
    .replace(/^'[st][\s-]/i, "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

export type TownIndexGroup = {
  letter: string;
  entries: BoardIndexEntry[];
};

/** The index A to Z by the name the visitor reads, one group per letter. */
export function townIndexGroups(
  entries: readonly BoardIndexEntry[],
  locale: Locale,
): TownIndexGroup[] {
  const name = (entry: BoardIndexEntry) =>
    locale === "en" ? entry.city.nameEn : entry.city.nameNl;
  const collator = new Intl.Collator(locale === "en" ? "en-GB" : "nl-NL", {
    sensitivity: "base",
  });
  const sorted = [...entries].sort((a, b) =>
    collator.compare(sortKey(name(a)), sortKey(name(b))),
  );
  const groups: TownIndexGroup[] = [];
  for (const entry of sorted) {
    const letter = sortKey(name(entry)).charAt(0).toUpperCase();
    const last = groups.at(-1);
    if (last?.letter === letter) {
      last.entries.push(entry);
    } else {
      groups.push({ letter, entries: [entry] });
    }
  }
  return groups;
}

import { lookupWoonplaats } from "./cities";
import { parseCitySlug } from "./ids";
import { sortCityBoard } from "./like";
import type { Locale } from "./messages";
import type { BoardIndexEntry, LiveSpotRef, SitemapEntry } from "./viewModels";

/** Chrome pages whose content does not move with the catalog. */
const STATIC_PATHS = ["/", "/how-it-works"] as const;

/** Chrome pages that change with every add or like. */
const CATALOG_PATHS = ["/nl/steden", "/nl/leaderboard"] as const;

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

/** When a spot's page last changed for a reader: its add or its latest like. */
function touchedAt(spot: LiveSpotRef): number {
  return Math.max(spot.addedAt, spot.lastLikedAt);
}

function sitemapEntry(path: string, lastModified: number | undefined): SitemapEntry {
  return lastModified ? { path, lastModified } : { path };
}

export function planSitemap(spots: readonly LiveSpotRef[]): SitemapEntry[] {
  const boards = boardIndex(spots).map((entry) => `/nl/${entry.city.slug}`);
  const live = new Set(boards);
  const listed = spots.filter((spot) => live.has(`/nl/${spot.citySlug}`));
  const boardTouched = new Map<string, number>();
  let latest = 0;
  for (const spot of listed) {
    const board = `/nl/${spot.citySlug}`;
    boardTouched.set(board, Math.max(boardTouched.get(board) ?? 0, touchedAt(spot)));
    latest = Math.max(latest, touchedAt(spot));
  }
  return [
    ...STATIC_PATHS.map((path) => sitemapEntry(path, undefined)),
    ...CATALOG_PATHS.map((path) => sitemapEntry(path, latest)),
    ...boards.sort().map((path) => sitemapEntry(path, boardTouched.get(path))),
    ...listed
      .map((spot) => sitemapEntry(`/nl/${spot.citySlug}/${spot.slug}`, touchedAt(spot)))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
  ];
}

/** Brackets would break a Markdown link label. */
function linkLabel(text: string): string {
  return text.replace(/[[\]]/g, "\\$&");
}

function likesLabel(count: number): string {
  return count === 1 ? "1 like" : `${count} likes`;
}

/**
 * `/llms.txt` (llmstxt.org): what the site is, how the board ranks, and every
 * live spot per woonplaats in board order. Facts the pages already show, no
 * copy of its own; every live spot is listed the same way.
 */
export function llmsTxt(origin: string, spots: readonly LiveSpotRef[]): string {
  const boards = townIndexGroups(boardIndex(spots), "nl").flatMap((group) => group.entries);
  const bySlug = new Map<string, LiveSpotRef[]>();
  for (const spot of spots) {
    bySlug.set(spot.citySlug, [...(bySlug.get(spot.citySlug) ?? []), spot]);
  }
  const latest = spots.reduce((max, spot) => Math.max(max, touchedAt(spot)), 0);
  const lines = [
    "# brag.fast",
    "",
    "> Breakfast and brunch spots in the Netherlands, one board per woonplaats (every Dutch town and village). Visitors add a spot with a photo in the brag.fast app, and each board ranks its spots by visitors' likes. No star ratings, no paid placement.",
    "",
    "The site is Dutch by default, with an English UI on the same URLs. A board lives at `/nl/{woonplaats}` and a spot at `/nl/{woonplaats}/{spot}`.",
    ...(latest > 0 ? ["", `Catalog as of ${new Date(latest).toISOString().slice(0, 10)}.`] : []),
    "",
    "## How the ranking works",
    "",
    "- A spot is a place where a guest can buy breakfast or brunch: cafés, bakeries, lunchrooms and hotels. No fast food, no home kitchens, no place that only does lunch or dinner.",
    "- The first photo of a place, taken in the app, puts the spot on the board of the woonplaats it is in. Anyone can add more photos in the app.",
    "- One like per signed-in person per spot. The spot with the most likes sits at the top; a tie goes to the most recent like, then the most recent add.",
    "- Likes are not for sale. Rank is only the like count.",
    "- A spot that closes for good leaves the board. Its page stays, marked closed.",
    "",
    "## Pages",
    "",
    `- [Home](${origin}/): search any Dutch woonplaats`,
    `- [How it works](${origin}/how-it-works): the steps and the house rules`,
    `- [Steden](${origin}/nl/steden): every board with at least one spot, A to Z`,
    `- [Leaderboard](${origin}/nl/leaderboard): people ranked by the likes on the spots they added`,
  ];
  for (const board of boards) {
    const { slug, nameNl, nameEn } = board.city;
    const name = nameEn === nameNl ? nameNl : `${nameNl} (${nameEn})`;
    lines.push(
      "",
      `## ${name}`,
      "",
      `- [Breakfast and brunch in ${linkLabel(nameNl)}](${origin}/nl/${slug}): the board, ${board.spotCount === 1 ? "1 spot" : `${board.spotCount} spots`} ranked by likes`,
    );
    for (const spot of sortCityBoard(bySlug.get(slug) ?? [])) {
      lines.push(
        `- [${linkLabel(spot.name)}](${origin}/nl/${slug}/${spot.slug}): ${likesLabel(spot.likeCount)}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
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

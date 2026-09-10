import type { GenericId } from "convex/values";
import { haversineMeters, type GeoPoint } from "./geo";
import { lookupGemeente } from "./gemeenten";
import { slugFromPlaceName } from "./placeAdd";
import { openingHoursFromPeriods, type OpeningHours } from "./spot";

export const OSM_HOURS_CURSOR_KEY = "osm-hours" as const;
export const OSM_HOURS_OVERPASS_PER_RUN = 4;
export const OSM_HOURS_MATCH_RADIUS_M = 75;
export const OSM_HOURS_TIMEZONE = "Europe/Amsterdam";

export type HourlessSpot = {
  id: GenericId<"spots">;
  name: string;
  geo: GeoPoint;
  citySlug: string;
};

export type OsmParsedHours =
  | { kind: "parsed"; hours: OpeningHours }
  | { kind: "unparseable" };

export type OsmVenue = {
  name: string;
  geo: GeoPoint;
  hours: OsmParsedHours;
};

export type HoursFillSkipReason = "unmatched" | "ambiguous" | "unparseable";

export type HoursFillDecision =
  | { action: "fill"; spot: HourlessSpot; hours: OpeningHours }
  | { action: "skip"; spot: HourlessSpot; reason: HoursFillSkipReason };

export type OsmHoursWalkInput = {
  startIndex: number;
  slugs: readonly string[];
  hasHourless: (slug: string) => boolean;
  overpassBudget: number;
};

export type OsmHoursWalk = {
  visit: string[];
  nextIndex: number;
};

const DAY_INDEX: Record<string, number> = {
  su: 0,
  mo: 1,
  tu: 2,
  we: 3,
  th: 4,
  fr: 5,
  sa: 6,
};

const TIME_RANGE =
  /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/;
const UNSUPPORTED =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|week|sunrise|sunset|dawn|dusk|easter|sh)\b|\|\||\+|\[|\]|"|'/i;

function expandDayRange(from: number, to: number): number[] {
  const days: number[] = [];
  let current = from;
  for (let i = 0; i < 7; i += 1) {
    days.push(current);
    if (current === to) {
      break;
    }
    current = (current + 1) % 7;
  }
  return days;
}

function parseDayList(raw: string): number[] | null {
  const days = new Set<number>();
  const chunks = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (chunks.length === 0) {
    return null;
  }
  for (const chunk of chunks) {
    const range = chunk.split("-").map((part) => part.trim().toLowerCase());
    if (range.length === 1) {
      const day = DAY_INDEX[range[0] ?? ""];
      if (day === undefined) {
        return null;
      }
      days.add(day);
      continue;
    }
    if (range.length !== 2) {
      return null;
    }
    const from = DAY_INDEX[range[0] ?? ""];
    const to = DAY_INDEX[range[1] ?? ""];
    if (from === undefined || to === undefined) {
      return null;
    }
    for (const day of expandDayRange(from, to)) {
      days.add(day);
    }
  }
  return [...days];
}

type DayHours = Map<number, Array<{ open: string; close: string }>>;

function parseTimeList(raw: string): Array<{ open: string; close: string }> | null {
  const ranges: Array<{ open: string; close: string }> = [];
  for (const chunk of raw.split(",").map((part) => part.trim()).filter(Boolean)) {
    const match = TIME_RANGE.exec(chunk);
    if (!match) {
      return null;
    }
    ranges.push({ open: match[1]!, close: match[2]! });
  }
  return ranges.length > 0 ? ranges : null;
}

function splitPrefixDays(raw: string): { days: string; rest: string } | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const match =
    /^((?:(?:su|mo|tu|we|th|fr|sa)(?:-(?:su|mo|tu|we|th|fr|sa))?(?:\s*,\s*)?)*)(.*)$/i.exec(
      trimmed,
    );
  if (!match) {
    return { days: "", rest: trimmed };
  }
  return {
    days: (match[1] ?? "").replace(/,\s*$/, "").trim(),
    rest: (match[2] ?? "").trim(),
  };
}

function applyClause(table: DayHours, clause: string): boolean {
  const trimmed = clause.trim();
  if (trimmed.length === 0) {
    return true;
  }
  if (/^ph(?:\s+(?:off|closed))?$/i.test(trimmed)) {
    return true;
  }
  if (UNSUPPORTED.test(trimmed)) {
    return false;
  }
  const split = splitPrefixDays(trimmed);
  if (!split) {
    return false;
  }
  const days =
    split.days.length > 0 ? parseDayList(split.days.replace(/\s+/g, "")) : [0, 1, 2, 3, 4, 5, 6];
  if (!days) {
    return false;
  }
  const rest = split.rest.trim();
  if (/^(off|closed)$/i.test(rest)) {
    for (const day of days) {
      table.set(day, []);
    }
    return true;
  }
  const times = parseTimeList(rest);
  if (!times) {
    return false;
  }
  for (const day of days) {
    table.set(day, times);
  }
  return true;
}

function clauseHasHours(text: string): boolean {
  return /\d{1,2}:\d{2}/.test(text) || /\b(?:off|closed)$/i.test(text.trim());
}

function clauseStartsDayAndHours(text: string): boolean {
  const first = text.trim().split(/[\s,]/)[0]?.split("-")[0]?.toLowerCase() ?? "";
  return DAY_INDEX[first] !== undefined && clauseHasHours(text);
}

function splitAdditiveClauses(rule: string): string[] | null {
  const pieces = rule.split(",").map((part) => part.trim()).filter(Boolean);
  if (pieces.length === 0) {
    return null;
  }
  const clauses: string[] = [];
  let current = pieces[0]!;
  for (const piece of pieces.slice(1)) {
    if (clauseStartsDayAndHours(piece) && clauseHasHours(current)) {
      clauses.push(current);
      current = piece;
      continue;
    }
    current = `${current},${piece}`;
  }
  clauses.push(current);
  return clauses;
}

export function parseOsmOpeningHours(
  tag: string,
  timezone: string = OSM_HOURS_TIMEZONE,
): OpeningHours | null {
  const raw = tag.trim();
  if (raw.length === 0) {
    return null;
  }
  if (/^24\/7$/i.test(raw)) {
    return openingHoursFromPeriods(
      [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        open: "00:00",
        close: "24:00",
      })),
      timezone,
    );
  }
  if (UNSUPPORTED.test(raw) && !/^24\/7$/i.test(raw)) {
    const withoutPh = raw.replace(/\bPH\b/gi, "");
    if (UNSUPPORTED.test(withoutPh)) {
      return null;
    }
  }
  const table: DayHours = new Map();
  for (const rule of raw.split(";")) {
    const clauses = splitAdditiveClauses(rule);
    if (!clauses) {
      return null;
    }
    for (const clause of clauses) {
      if (!applyClause(table, clause)) {
        return null;
      }
    }
  }
  const periods: Array<{ day: number; open: string; close: string }> = [];
  for (const [day, ranges] of table) {
    for (const range of ranges) {
      periods.push({ day, open: range.open, close: range.close });
    }
  }
  return openingHoursFromPeriods(periods, timezone);
}

export function isOsmHospitality(tags: Readonly<Record<string, string>>): boolean {
  if (tags.amenity === "fast_food") {
    return false;
  }
  if (tags.amenity === "cafe" || tags.amenity === "restaurant" || tags.amenity === "hotel") {
    return true;
  }
  if (tags.shop === "bakery") {
    return true;
  }
  return (
    tags.tourism === "hotel" ||
    tags.tourism === "guest_house" ||
    tags.tourism === "hostel"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringTags(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) {
    return null;
  }
  const tags: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && entry.trim().length > 0) {
      tags[key] = entry;
    }
  }
  return tags;
}

function elementGeo(element: Record<string, unknown>): GeoPoint | null {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { lat: element.lat, lng: element.lon };
  }
  const center = isRecord(element.center) ? element.center : null;
  if (
    center &&
    typeof center.lat === "number" &&
    typeof center.lon === "number"
  ) {
    return { lat: center.lat, lng: center.lon };
  }
  return null;
}

export function readOverpassVenues(payload: unknown): OsmVenue[] {
  if (!isRecord(payload) || !Array.isArray(payload.elements)) {
    return [];
  }
  const venues: OsmVenue[] = [];
  for (const element of payload.elements) {
    if (!isRecord(element)) {
      continue;
    }
    const tags = stringTags(element.tags);
    if (!tags || !isOsmHospitality(tags)) {
      continue;
    }
    const name = tags.name?.trim();
    const hoursTag = tags.opening_hours?.trim();
    const geo = elementGeo(element);
    if (!name || !hoursTag || !geo) {
      continue;
    }
    const parsed = parseOsmOpeningHours(hoursTag, OSM_HOURS_TIMEZONE);
    venues.push({
      name,
      geo,
      hours: parsed ? { kind: "parsed", hours: parsed } : { kind: "unparseable" },
    });
  }
  return venues;
}

export function overpassHoursQueries(anchors: readonly GeoPoint[]): string[] {
  const chunk = 50;
  const queries: string[] = [];
  for (let i = 0; i < anchors.length; i += chunk) {
    const slice = anchors.slice(i, i + chunk);
    const clauses = slice
      .map(
        (point) =>
          `nwr(around:${OSM_HOURS_MATCH_RADIUS_M},${point.lat.toFixed(5)},${point.lng.toFixed(5)})["name"]["opening_hours"];`,
      )
      .join("\n  ");
    queries.push(`[out:json][timeout:60];
(
  ${clauses}
);
out center tags;`);
  }
  return queries;
}

function cityDropTokens(citySlug: string): string[] {
  const gemeente = lookupGemeente(citySlug);
  const names = gemeente
    ? [gemeente.slug, gemeente.nameNl, gemeente.nameEn, ...gemeente.aliases]
    : [citySlug];
  const tokens = new Set<string>();
  for (const name of names) {
    for (const token of slugFromPlaceName(name).split("-")) {
      if (token.length > 0) {
        tokens.add(token);
      }
    }
  }
  return [...tokens];
}

function strippedSlug(name: string, drop: readonly string[]): string {
  const slug = slugFromPlaceName(name);
  const kept = slug.split("-").filter((token) => !drop.includes(token));
  return kept.length > 0 ? kept.join("-") : slug;
}

const GENERIC_NAME_TOKENS = new Set([
  "all",
  "and",
  "bakery",
  "bakker",
  "bar",
  "breakfast",
  "brunch",
  "cafe",
  "coffee",
  "day",
  "de",
  "en",
  "het",
  "hotel",
  "koffie",
  "lunch",
  "lunchroom",
  "restaurant",
  "shop",
  "store",
  "the",
]);

function significantSlug(slug: string): string {
  const kept = slug
    .split("-")
    .filter((token) => token.length > 0 && !GENERIC_NAME_TOKENS.has(token));
  return kept.length > 0 ? kept.join("-") : slug;
}

export type NameMatchKind = "exact" | "subset";

export function scoreVenueName(
  spotName: string,
  venueName: string,
  citySlug: string,
): NameMatchKind | null {
  const drop = cityDropTokens(citySlug);
  const a = significantSlug(strippedSlug(spotName, drop));
  const b = significantSlug(strippedSlug(venueName, drop));
  if (a.length === 0 || b.length === 0) {
    return null;
  }
  if (a === b) {
    return "exact";
  }
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (GENERIC_NAME_TOKENS.has(shorter)) {
    return null;
  }
  const compact = shorter.replace(/-/g, "");
  if (compact.length < 4) {
    return null;
  }
  if (longer.startsWith(`${shorter}-`)) {
    return "subset";
  }
  if (compact.length >= 5 && longer.includes(shorter)) {
    return "subset";
  }
  return null;
}

export function planOsmHoursWalk(input: OsmHoursWalkInput): OsmHoursWalk {
  const length = input.slugs.length;
  const visit: string[] = [];
  if (length === 0 || input.overpassBudget <= 0) {
    return { visit, nextIndex: 0 };
  }
  const start =
    Number.isInteger(input.startIndex) &&
    input.startIndex >= 0 &&
    input.startIndex < length
      ? input.startIndex
      : 0;
  let index = start;
  let nextIndex = start;
  for (let stepped = 0; stepped < length; stepped += 1) {
    const slug = input.slugs[index]!;
    const next = (index + 1) % length;
    nextIndex = next;
    if (input.hasHourless(slug)) {
      visit.push(slug);
      index = next;
      if (visit.length >= input.overpassBudget) {
        break;
      }
      continue;
    }
    index = next;
  }
  return { visit, nextIndex };
}

type ScoredPair = {
  spotIndex: number;
  venueIndex: number;
  exact: boolean;
  distanceM: number;
};

function hoursKey(hours: OsmParsedHours): string {
  if (hours.kind === "unparseable") {
    return "unparseable";
  }
  return JSON.stringify(hours.hours.periods);
}

export function matchHourlessSpots(
  spots: readonly HourlessSpot[],
  venues: readonly OsmVenue[],
): HoursFillDecision[] {
  const fillPairs: ScoredPair[] = [];
  const early: Array<HoursFillDecision | null> = spots.map(() => null);

  for (let si = 0; si < spots.length; si += 1) {
    const spot = spots[si]!;
    const matches: ScoredPair[] = [];
    for (let vi = 0; vi < venues.length; vi += 1) {
      const venue = venues[vi]!;
      const distanceM = haversineMeters(spot.geo, venue.geo);
      if (distanceM > OSM_HOURS_MATCH_RADIUS_M) {
        continue;
      }
      const name = scoreVenueName(spot.name, venue.name, spot.citySlug);
      if (!name) {
        continue;
      }
      matches.push({
        spotIndex: si,
        venueIndex: vi,
        exact: name === "exact",
        distanceM,
      });
    }
    if (matches.length === 0) {
      early[si] = { action: "skip", spot, reason: "unmatched" };
      continue;
    }
    const parsedKeys = new Set(
      matches
        .map((row) => venues[row.venueIndex]!.hours)
        .filter((hours) => hours.kind === "parsed")
        .map(hoursKey),
    );
    if (parsedKeys.size > 1) {
      early[si] = { action: "skip", spot, reason: "ambiguous" };
      continue;
    }
    if (parsedKeys.size === 0) {
      early[si] = { action: "skip", spot, reason: "unparseable" };
      continue;
    }
    matches.sort(
      (a, b) => Number(b.exact) - Number(a.exact) || a.distanceM - b.distanceM,
    );
    const best = matches.find(
      (row) => hoursKey(venues[row.venueIndex]!.hours) === [...parsedKeys][0],
    );
    if (!best) {
      early[si] = { action: "skip", spot, reason: "unmatched" };
      continue;
    }
    fillPairs.push(best);
  }

  fillPairs.sort(
    (a, b) =>
      Number(b.exact) - Number(a.exact) || a.distanceM - b.distanceM || a.spotIndex - b.spotIndex,
  );
  const usedVenue = new Set<number>();
  const assigned = new Map<number, number>();
  for (const pair of fillPairs) {
    if (usedVenue.has(pair.venueIndex)) {
      continue;
    }
    usedVenue.add(pair.venueIndex);
    assigned.set(pair.spotIndex, pair.venueIndex);
  }

  return spots.map((spot, si) => {
    const existing = early[si];
    if (existing) {
      return existing;
    }
    const venueIndex = assigned.get(si);
    if (venueIndex === undefined) {
      return { action: "skip", spot, reason: "unmatched" };
    }
    const hours = venues[venueIndex]!.hours;
    if (hours.kind !== "parsed") {
      return { action: "skip", spot, reason: "unparseable" };
    }
    return { action: "fill", spot, hours: hours.hours };
  });
}

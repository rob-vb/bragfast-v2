import data from "./data/woonplaatsen-lite.json";
import { parseCitySlug } from "./ids";

export type GazetteerCity = {
  slug: string;
  nameNl: string;
  nameEn: string;
  aliases: readonly string[];
  lat: number;
  lng: number;
  featuredOrder?: number;
};

type LiteFile = {
  version: string;
  woonplaatsen: GazetteerCity[];
};

const FILE = data as LiteFile;

export const WOONPLAATSEN_VERSION = FILE.version;

export const NL_CITIES: readonly GazetteerCity[] = FILE.woonplaatsen;

const bySlug = new Map<string, GazetteerCity>();
const byAlias = new Map<string, GazetteerCity>();
const byExactName = new Map<string, GazetteerCity | "ambiguous">();

function rememberName(name: string, city: GazetteerCity) {
  const key = name.trim().toLowerCase();
  if (key.length === 0) {
    return;
  }
  const existing = byExactName.get(key);
  if (existing && existing !== city) {
    byExactName.set(key, "ambiguous");
    return;
  }
  byExactName.set(key, city);
}

for (const city of NL_CITIES) {
  bySlug.set(city.slug, city);
  rememberName(city.nameNl, city);
  rememberName(city.nameEn, city);
  for (const alias of city.aliases) {
    byAlias.set(alias.toLowerCase(), city);
  }
}

function slugifyLookup(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function lookupWoonplaats(input: string): GazetteerCity | null {
  const needle = input.trim().toLowerCase();
  if (needle.length === 0) {
    return null;
  }
  const named = byExactName.get(needle);
  return (
    bySlug.get(needle) ??
    bySlug.get(slugifyLookup(input)) ??
    byAlias.get(needle) ??
    (named === "ambiguous" || named === undefined ? null : named)
  );
}

export function canonicalCitySlug(input: string): string | null {
  const city = lookupWoonplaats(input);
  return city ? parseCitySlug(city.slug) : null;
}

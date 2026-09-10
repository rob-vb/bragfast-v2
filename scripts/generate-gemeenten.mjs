#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeGemeentePopulation } from "./generate-gemeente-population.mjs";

const SOURCE =
  "https://cartomap.github.io/nl/wgs84/gemeente_2025.geojson";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "domain/data/gemeenten.json");

const FEATURED = {
  haarlem: 1,
  amsterdam: 2,
  rotterdam: 3,
  utrecht: 4,
  "den-haag": 5,
  eindhoven: 6,
  groningen: 7,
  tilburg: 8,
  almere: 9,
};

const SLUG_OVERRIDES = {
  "'s-Hertogenbosch": "den-bosch",
  "'s-Gravenhage": "den-haag",
  Zaanstad: "zaandam",
  "Hengelo (O.)": "hengelo",
  "Middelburg (Z.)": "middelburg",
};

const ALIASES = {
  "den-bosch": ["s-hertogenbosch", "den bosch"],
  "den-haag": ["s-gravenhage", "the hague", "den haag"],
  zaandam: ["zaanstad"],
  haarlemmermeer: ["hoofddorp"],
  nissewaard: ["spijkenisse"],
  "sittard-geleen": ["sittard"],
  hengelo: ["hengelo-o"],
  middelburg: ["middelburg-z"],
};

const DISPLAY_NL = {
  "den-haag": "Den Haag",
  "den-bosch": "Den Bosch",
  zaandam: "Zaandam",
  hengelo: "Hengelo",
  middelburg: "Middelburg",
};

const ENGLISH_NAMES = {
  "den-haag": "The Hague",
  "den-bosch": "Den Bosch",
};

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ringsOf(geometry) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates;
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat();
  }
  throw new Error(`unsupported geometry ${geometry.type}`);
}

function bboxAndCentroid(rings) {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  let sumLat = 0;
  let sumLng = 0;
  let n = 0;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      west = Math.min(west, lng);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      north = Math.max(north, lat);
      sumLat += lat;
      sumLng += lng;
      n += 1;
    }
  }
  return {
    bbox: { west, south, east, north },
    lat: sumLat / n,
    lng: sumLng / n,
  };
}

const response = await fetch(SOURCE);
if (!response.ok) {
  throw new Error(`download failed ${response.status}`);
}
const geo = await response.json();
const gemeenten = [];
const slugs = new Set();

for (const feature of geo.features) {
  const nameNl = feature.properties.statnaam;
  const code = feature.properties.statcode;
  const slug = SLUG_OVERRIDES[nameNl] ?? slugify(nameNl);
  if (slugs.has(slug)) {
    throw new Error(`duplicate slug ${slug} for ${nameNl}`);
  }
  slugs.add(slug);
  const rings = ringsOf(feature.geometry);
  const { bbox, lat, lng } = bboxAndCentroid(rings);
  const featuredOrder = FEATURED[slug];
  gemeenten.push({
    code,
    slug,
    nameNl: DISPLAY_NL[slug] ?? nameNl,
    nameEn: ENGLISH_NAMES[slug] ?? DISPLAY_NL[slug] ?? nameNl,
    aliases: ALIASES[slug] ?? [],
    lat,
    lng,
    bbox,
    rings,
    ...(featuredOrder !== undefined ? { featuredOrder } : {}),
  });
}

gemeenten.sort((a, b) => a.code.localeCompare(b.code));

if (gemeenten.length < 300) {
  throw new Error(`expected ~340 gemeenten, got ${gemeenten.length}`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ version: "gemeente-2025", gemeenten }),
);
await writeGemeentePopulation();
console.log(`wrote ${gemeenten.length} gemeenten to ${OUT}`);

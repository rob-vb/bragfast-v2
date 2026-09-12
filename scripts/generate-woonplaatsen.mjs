#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CBS_SOURCE =
  "https://opendata.cbs.nl/ODataApi/odata/85877NED/Woonplaatsen";
const PAGE_SIZE = 1000;
const SIMPLIFY_TOLERANCE = 0.0008;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FULL_OUT = join(ROOT, "domain/data/woonplaatsen.json");
const LITE_OUT = join(ROOT, "domain/data/woonplaatsen-lite.json");

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
};

const ALIASES = {
  "den-bosch": ["s-hertogenbosch", "den bosch"],
  "den-haag": ["s-gravenhage", "the hague", "den haag"],
};

const DISPLAY_NL = {
  "den-haag": "Den Haag",
  "den-bosch": "Den Bosch",
};

const ENGLISH_NAMES = {
  "den-haag": "The Hague",
  "den-bosch": "Den Bosch",
};

const FETCH_HEADERS = {
  "user-agent": "brag.fast woonplaats generator",
  accept: "application/json",
};

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function round3(n) {
  return Number((Math.round(n * 1000) / 1000).toFixed(3));
}

function round6(n) {
  return Number(n.toFixed(6));
}

function idKey(raw) {
  const digits = String(raw).replace(/\D/g, "");
  return String(Number(digits));
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

function perpendicularDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - start[0], point[1] - start[1]);
  }
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
        (dx * dx + dy * dy),
    ),
  );
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

function douglasPeucker(points, tolerance) {
  if (points.length <= 2) {
    return points;
  }
  let maxDistance = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance);
    const right = douglasPeucker(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

function simplifyRing(ring) {
  if (ring.length < 4) {
    return ring.map(([lng, lat]) => [round3(lng), round3(lat)]);
  }
  const closed =
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1];
  const open = closed ? ring.slice(0, -1) : ring.slice();
  const simplified = douglasPeucker(open, SIMPLIFY_TOLERANCE);
  const rounded = [];
  for (const [lng, lat] of simplified) {
    const next = [round3(lng), round3(lat)];
    const prev = rounded[rounded.length - 1];
    if (!prev || prev[0] !== next[0] || prev[1] !== next[1]) {
      rounded.push(next);
    }
  }
  if (rounded.length < 3) {
    const fallback = [];
    for (const [lng, lat] of open) {
      const next = [round3(lng), round3(lat)];
      const prev = fallback[fallback.length - 1];
      if (!prev || prev[0] !== next[0] || prev[1] !== next[1]) {
        fallback.push(next);
      }
    }
    if (fallback.length < 3) {
      return ring.map(([lng, lat]) => [round3(lng), round3(lat)]);
    }
    const first = fallback[0];
    const last = fallback[fallback.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      fallback.push([first[0], first[1]]);
    }
    return fallback;
  }
  const first = rounded[0];
  const last = rounded[rounded.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    rounded.push([first[0], first[1]]);
  }
  return rounded;
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
    bbox: {
      west: round3(west),
      south: round3(south),
      east: round3(east),
      north: round3(north),
    },
    lat: round6(sumLat / n),
    lng: round6(sumLng / n),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: FETCH_HEADERS });
  if (!response.ok) {
    throw new Error(`download failed ${response.status} ${url}`);
  }
  return response.json();
}

async function fetchCbsNames() {
  const names = new Map();
  let url = CBS_SOURCE;
  while (url) {
    const data = await fetchJson(url);
    for (const row of data.value ?? []) {
      names.set(idKey(row.Key), row.Title);
    }
    url = data["odata.nextLink"] ?? data["@odata.nextLink"] ?? null;
  }
  return names;
}

function bagPageUrl(startIndex) {
  return `https://service.pdok.nl/kadaster/bag/wfs/v2_0?service=WFS&version=2.0.0&request=GetFeature&typeNames=bag:woonplaats&count=${PAGE_SIZE}&startIndex=${startIndex}&outputFormat=application/json&srsName=EPSG:4326`;
}

async function fetchBagFeatures() {
  const features = [];
  let startIndex = 0;
  while (startIndex < PAGE_SIZE * 8) {
    const geo = await fetchJson(bagPageUrl(startIndex));
    const page = geo.features ?? [];
    if (page.length === 0) {
      break;
    }
    features.push(...page);
    startIndex += page.length;
    if (page.length < PAGE_SIZE) {
      break;
    }
  }
  return features;
}

function uniqueSlug(nameNl, identificatie, used) {
  const override = SLUG_OVERRIDES[nameNl];
  const base = override ?? slugify(nameNl);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const tagged = `${base}-${identificatie}`;
  if (used.has(tagged)) {
    throw new Error(`duplicate slug ${tagged} for ${nameNl}`);
  }
  used.add(tagged);
  return tagged;
}

const cbsNames = await fetchCbsNames();
const bagFeatures = await fetchBagFeatures();
if (bagFeatures.length < 2500) {
  throw new Error(`expected ~2503 woonplaatsen, got ${bagFeatures.length}`);
}

const usedSlugs = new Set();
const woonplaatsen = [];

for (const feature of bagFeatures) {
  const identificatie = idKey(feature.properties.identificatie);
  const nameNl = cbsNames.get(identificatie) ?? feature.properties.woonplaats;
  if (!nameNl) {
    throw new Error(`missing name for ${identificatie}`);
  }
  const slug = uniqueSlug(nameNl, identificatie, usedSlugs);
  const rings = ringsOf(feature.geometry).map(simplifyRing);
  const { bbox, lat, lng } = bboxAndCentroid(rings);
  const featuredOrder = FEATURED[slug];
  woonplaatsen.push({
    identificatie,
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

woonplaatsen.sort((a, b) => {
  const byId = Number(a.identificatie) - Number(b.identificatie);
  if (byId !== 0) {
    return byId;
  }
  return a.slug.localeCompare(b.slug);
});

const lite = woonplaatsen.map((row) => ({
  slug: row.slug,
  nameNl: row.nameNl,
  nameEn: row.nameEn,
  aliases: row.aliases,
  lat: row.lat,
  lng: row.lng,
  ...(row.featuredOrder !== undefined ? { featuredOrder: row.featuredOrder } : {}),
}));

mkdirSync(dirname(FULL_OUT), { recursive: true });
writeFileSync(FULL_OUT, JSON.stringify({ version: "woonplaats-bag", woonplaatsen }));
writeFileSync(LITE_OUT, JSON.stringify({ version: "woonplaats-bag", woonplaatsen: lite }));
console.log(`wrote ${woonplaatsen.length} woonplaatsen to ${FULL_OUT}`);
console.log(`wrote ${lite.length} lite rows to ${LITE_OUT}`);

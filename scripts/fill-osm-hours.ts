import { execFileSync } from "node:child_process";
import dns from "node:dns";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  matchHourlessSpots,
  overpassHoursQueries,
  readOverpassVenues,
  type HourlessSpot,
  type OsmVenue,
} from "../domain/osmHours";
import type { OpeningHours } from "../domain/spot";

dns.setDefaultResultOrder("ipv4first");

const ROOT = process.cwd();
const OVERPASS_ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const WRITE_BATCH = 40;
const PIN_CHUNK = 40;

function convexRun<T>(name: string, args?: unknown): T {
  const argv = ["convex", "run", name];
  if (args !== undefined) {
    const dir = join(tmpdir(), "bragfast-osm-hours");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "args.json");
    writeFileSync(file, JSON.stringify(args));
    argv.push(execFileSync("cat", [file], { encoding: "utf8" }));
  }
  const out = execFileSync("npx", argv, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOverpass(query: string): Promise<unknown | null> {
  const body = new URLSearchParams({ data: query });
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const url = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length]!;
    if (attempt > 0) {
      process.stderr.write(`overpass ${url} attempt ${attempt + 1}\n`);
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "brag.fast hours-fill (http://77.42.31.66/)",
        },
        body,
        signal: AbortSignal.timeout(50_000),
      });
      if (response.ok) {
        return await response.json();
      }
      if (response.status === 429 || response.status >= 500) {
        await sleep(6_000 * (attempt + 1));
        continue;
      }
    } catch {
      await sleep(2_000 * (attempt + 1));
    }
  }
  return null;
}

async function venuesForCity(spots: HourlessSpot[]): Promise<OsmVenue[] | null> {
  const venues: OsmVenue[] = [];
  let ok = 0;
  for (let i = 0; i < spots.length; i += PIN_CHUNK) {
    const slice = spots.slice(i, i + PIN_CHUNK);
    const queries = overpassHoursQueries(slice.map((spot) => spot.geo));
    for (const query of queries) {
      const payload = await fetchOverpass(query);
      if (payload === null) {
        continue;
      }
      ok += 1;
      venues.push(...readOverpassVenues(payload));
    }
  }
  if (ok === 0) {
    return null;
  }
  return venues;
}

function writeFills(
  fills: Array<{ spotId: HourlessSpot["id"]; hours: OpeningHours }>,
): number {
  let filled = 0;
  for (let i = 0; i < fills.length; i += WRITE_BATCH) {
    const slice = fills.slice(i, i + WRITE_BATCH);
    const result = convexRun<{ filled: number }>(
      "internal.osmHours.applyHoursFillMany",
      { fills: slice },
    );
    filled += result.filled;
  }
  return filled;
}

async function main() {
  const hourless = convexRun<HourlessSpot[]>("internal.osmHours.listedHourless");
  const byCity = new Map<string, HourlessSpot[]>();
  for (const spot of hourless) {
    const list = byCity.get(spot.citySlug) ?? [];
    list.push(spot);
    byCity.set(spot.citySlug, list);
  }
  const cities = [...byCity.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log(`hourless ${hourless.length} in ${cities.length} cities`);

  let filled = 0;
  let failed = 0;
  for (const [slug, spots] of cities) {
    const venues = await venuesForCity(spots);
    if (venues === null) {
      failed += 1;
      console.log(`${slug}: overpass failed (${spots.length} hourless)`);
      continue;
    }
    const decisions = matchHourlessSpots(spots, venues);
    const skipReasons = { unmatched: 0, ambiguous: 0, unparseable: 0 };
    const fills = [];
    for (const row of decisions) {
      if (row.action === "fill") {
        fills.push({ spotId: row.spot.id, hours: row.hours });
      } else {
        skipReasons[row.reason] += 1;
      }
    }
    const wrote = fills.length > 0 ? writeFills(fills) : 0;
    filled += wrote;
    console.log(
      `${slug}: hourless ${spots.length} osm ${venues.length} matched ${fills.length} filled ${wrote} skip ${JSON.stringify(skipReasons)}`,
    );
  }
  console.log(`done filled ${filled} overpassFailedCities ${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

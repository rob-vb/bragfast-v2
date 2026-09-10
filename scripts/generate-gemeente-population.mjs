#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CBS =
  "https://opendata.cbs.nl/ODataApi/OData/03759ned/TypedDataSet";
const PERIOD = "2026JJ00";
const FALLBACK_PERIOD = "2025JJ00";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "domain/data/gemeente-population.json");

async function fetchPeriod(period) {
  const filter =
    "Geslacht eq 'T001038' and Leeftijd eq '10000' and BurgerlijkeStaat eq 'T001019' " +
    `and Perioden eq '${period}' and startswith(RegioS,'GM')`;
  let url = `${CBS}?$filter=${encodeURIComponent(filter)}&$select=RegioS,BevolkingOp1Januari_1`;
  const rows = [];
  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CBS ${period} failed ${response.status}`);
    }
    const payload = await response.json();
    rows.push(...payload.value);
    url = payload["odata.nextLink"] ?? null;
  }
  const populations = {};
  for (const row of rows) {
    const code = String(row.RegioS ?? "").trim();
    const value = row.BevolkingOp1Januari_1;
    if (code.startsWith("GM") && typeof value === "number") {
      populations[code] = value;
    }
  }
  return populations;
}

export async function writeGemeentePopulation() {
  const primary = await fetchPeriod(PERIOD);
  const fallback =
    Object.keys(primary).length > 0 ? {} : await fetchPeriod(FALLBACK_PERIOD);
  const populations = { ...fallback, ...primary };
  if (Object.keys(populations).length < 300) {
    throw new Error(
      `expected ~340 gemeente populations, got ${Object.keys(populations).length}`,
    );
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        source: "CBS 03759ned",
        period: Object.keys(primary).length > 0 ? PERIOD : FALLBACK_PERIOD,
        asOf: "2026-01-01",
        populations,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `wrote ${Object.keys(populations).length} populations to ${OUT}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await writeGemeentePopulation();
}

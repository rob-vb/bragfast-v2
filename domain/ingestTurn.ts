export type IngestIntent = "discover" | "refresh";

/** Stable cursor row. Do not change this key — a new key restarts at Amsterdam. */
export const INGEST_CURSOR_KEY = "catalog-pop";

/** CBS inwoners. Below this, a gemeente waits until the 20k+ pass finishes. */
export const INGEST_POPULATION_FLOOR = 20_000;

export type IngestFetch = {
  placeId: string;
  intent: IngestIntent;
};

export type PlanIngestTurnInput = {
  budget: number;
  discoveredIds: readonly string[];
  staleListedIds: readonly string[];
};

export type PlanIngestTurnResult = {
  fetch: IngestFetch[];
};

export function nextCityIndex(current: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return (current + 1) % length;
}

/** Resume at the saved gemeente slug so a new walk order does not restart. */
export function resolveIngestIndex(
  slugs: readonly string[],
  citySlug: string | null | undefined,
  fallbackIndex: number,
): number {
  if (citySlug) {
    const at = slugs.indexOf(citySlug);
    if (at >= 0) {
      return at;
    }
  }
  if (
    Number.isInteger(fallbackIndex) &&
    fallbackIndex >= 0 &&
    fallbackIndex < slugs.length
  ) {
    return fallbackIndex;
  }
  return 0;
}

export function orderGemeentenForIngest<
  T extends { population: number; slug: string },
>(gemeenten: readonly T[]): T[] {
  const byPopThenSlug = (a: T, b: T) =>
    b.population - a.population || a.slug.localeCompare(b.slug);
  const big = gemeenten
    .filter((row) => row.population >= INGEST_POPULATION_FLOOR)
    .sort(byPopThenSlug);
  const small = gemeenten
    .filter((row) => row.population < INGEST_POPULATION_FLOOR)
    .sort(byPopThenSlug);
  return [...big, ...small];
}

export function planIngestTurn(
  input: PlanIngestTurnInput,
): PlanIngestTurnResult {
  const budget = Math.max(0, Math.floor(input.budget));
  const discover = [...new Set(input.discoveredIds)];
  const refresh = [...new Set(input.staleListedIds)].filter(
    (id) => !discover.includes(id),
  );
  const fetch: IngestFetch[] = [];
  let di = 0;
  let ri = 0;
  while (fetch.length < budget && (di < discover.length || ri < refresh.length)) {
    const wantRefresh = fetch.length % 2 === 0;
    if (wantRefresh && ri < refresh.length) {
      fetch.push({ placeId: refresh[ri]!, intent: "refresh" });
      ri += 1;
      continue;
    }
    if (!wantRefresh && di < discover.length) {
      fetch.push({ placeId: discover[di]!, intent: "discover" });
      di += 1;
      continue;
    }
    if (ri < refresh.length) {
      fetch.push({ placeId: refresh[ri]!, intent: "refresh" });
      ri += 1;
      continue;
    }
    fetch.push({ placeId: discover[di]!, intent: "discover" });
    di += 1;
  }
  return { fetch };
}

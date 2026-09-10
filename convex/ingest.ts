import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import {
  assignCitySlugWithFallback,
  NL_INGEST_GEMEENTEN,
} from "../domain/gemeenten";
import {
  placesHoursToOpeningHours,
  type HygienePlan,
  type PlacesBusinessStatus,
  type PlacesHoursPeriod,
  type PlacesSnapshot,
} from "../domain/hygiene";
import {
  INGEST_CURSOR_KEY,
  nextCityIndex,
  planIngestTurn,
  resolveIngestIndex,
} from "../domain/ingestTurn";
import {
  DETAILS_PER_RUN,
  DISCOVERY_QUERIES,
  DISCOVERY_TYPES,
  GEMEENTEN_PER_RUN,
  INGEST_DETAILS_MONTHLY_CAP,
  billingMonthKey,
  detailsBudgetLeft,
  type DiscoveryQuery,
  type DiscoveryType,
} from "../domain/placesQuota";
import { applySnapshot, rejudgeStoredSpot } from "./model/hygiene";
import { openingHoursValidator } from "../domain/spot";
import type { Id } from "./_generated/dataModel";

const snapshotValidator = v.object({
  placeId: v.string(),
  name: v.string(),
  address: v.string(),
  geo: v.object({ lat: v.number(), lng: v.number() }),
  types: v.array(v.string()),
  hours: openingHoursValidator,
  businessStatus: v.union(
    v.literal("OPERATIONAL"),
    v.literal("CLOSED_TEMPORARILY"),
    v.literal("CLOSED_PERMANENTLY"),
  ),
  citySlug: v.string(),
});

const seenReasonValidator = v.union(
  v.literal("fast-food"),
  v.literal("not-hospitality"),
  v.literal("unassigned"),
  v.literal("closed-unknown"),
  v.literal("invalid"),
);

function placesKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function textOf(value: unknown): string | null {
  if (!isRecord(value) || typeof value.text !== "string") {
    return null;
  }
  const text = value.text.trim();
  return text.length > 0 ? text : null;
}

function parseBusinessStatus(value: unknown): PlacesBusinessStatus {
  if (value === "CLOSED_TEMPORARILY" || value === "CLOSED_PERMANENTLY") {
    return value;
  }
  return "OPERATIONAL";
}

function parseClockPoint(
  value: unknown,
): { day: number; hour: number; minute: number } | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.day !== "number" ||
    typeof value.hour !== "number" ||
    typeof value.minute !== "number"
  ) {
    return null;
  }
  return { day: value.day, hour: value.hour, minute: value.minute };
}

function parseHours(payload: Record<string, unknown>) {
  const hours = isRecord(payload.regularOpeningHours)
    ? payload.regularOpeningHours
    : null;
  if (!hours || !Array.isArray(hours.periods)) {
    return null;
  }
  const periods: PlacesHoursPeriod[] = [];
  for (const period of hours.periods) {
    if (!isRecord(period)) {
      continue;
    }
    const open = parseClockPoint(period.open);
    if (!open) {
      continue;
    }
    const close = parseClockPoint(period.close) ?? undefined;
    periods.push({ open, close });
  }
  return placesHoursToOpeningHours(periods, "Europe/Amsterdam");
}

function localityNames(payload: Record<string, unknown>): string[] {
  if (!Array.isArray(payload.addressComponents)) {
    return [];
  }
  const names: string[] = [];
  for (const component of payload.addressComponents) {
    if (!isRecord(component) || typeof component.longText !== "string") {
      continue;
    }
    const types = Array.isArray(component.types)
      ? component.types.filter((entry): entry is string => typeof entry === "string")
      : [];
    if (
      types.includes("locality") ||
      types.includes("postal_town") ||
      types.includes("administrative_area_level_2")
    ) {
      names.push(component.longText);
    }
  }
  return names;
}

function parseHygienePlace(payload: unknown): Omit<PlacesSnapshot, "citySlug"> | null {
  if (!isRecord(payload)) {
    return null;
  }
  const placeId = typeof payload.id === "string" ? payload.id : null;
  const name = textOf(payload.displayName);
  const address =
    typeof payload.formattedAddress === "string"
      ? payload.formattedAddress.trim()
      : "";
  const location = isRecord(payload.location) ? payload.location : null;
  const lat =
    location && typeof location.latitude === "number"
      ? location.latitude
      : null;
  const lng =
    location && typeof location.longitude === "number"
      ? location.longitude
      : null;
  if (!placeId || !name || address.length === 0 || lat === null || lng === null) {
    return null;
  }
  const types = Array.isArray(payload.types)
    ? payload.types.filter((entry): entry is string => typeof entry === "string")
    : [];
  return {
    placeId,
    name,
    address,
    geo: { lat, lng },
    types,
    hours: parseHours(payload),
    businessStatus: parseBusinessStatus(payload.businessStatus),
  };
}

function parseSearchPage(payload: unknown): {
  ids: string[];
  nextPageToken: string | null;
} {
  if (!isRecord(payload)) {
    return { ids: [], nextPageToken: null };
  }
  const ids: string[] = [];
  if (Array.isArray(payload.places)) {
    for (const place of payload.places) {
      if (isRecord(place) && typeof place.id === "string") {
        ids.push(place.id);
      }
    }
  }
  const nextPageToken =
    typeof payload.nextPageToken === "string" &&
    payload.nextPageToken.length > 0
      ? payload.nextPageToken
      : null;
  return { ids, nextPageToken };
}

async function searchGemeente(
  bbox: { west: number; south: number; east: number; north: number },
  type: DiscoveryType,
  query: DiscoveryQuery,
  key: string,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 3; page += 1) {
    const body: Record<string, unknown> = {
      textQuery: query,
      includedType: type,
      strictTypeFiltering: true,
      languageCode: "nl",
      regionCode: "NL",
      pageSize: 20,
      locationRestriction: {
        rectangle: {
          low: { latitude: bbox.south, longitude: bbox.west },
          high: { latitude: bbox.north, longitude: bbox.east },
        },
      },
    };
    if (pageToken) {
      body.pageToken = pageToken;
    }
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "places.id,nextPageToken",
        },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      break;
    }
    const parsed = parseSearchPage(await response.json());
    ids.push(...parsed.ids);
    if (!parsed.nextPageToken) {
      break;
    }
    pageToken = parsed.nextPageToken;
  }
  return ids;
}

async function fetchPlacePro(
  placeId: string,
  key: string,
): Promise<unknown | null> {
  const id = placeId.startsWith("places/") ? placeId.slice(7) : placeId;
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=nl`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        // Pro SKU only. `regularOpeningHours` is Place Details Enterprise
        // (1,000 free/month); 200/run would exhaust that in five nights.
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,addressComponents,location,types,businessStatus",
      },
    },
  );
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

export const placeKnowledge = internalQuery({
  args: { placeId: v.string() },
  handler: async (
    ctx,
    { placeId },
  ): Promise<"listed" | "rejected" | "unknown"> => {
    const row = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
      .unique();
    if (row) {
      return "listed";
    }
    const seen = await ctx.db
      .query("placesSeen")
      .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
      .unique();
    return seen !== null ? "rejected" : "unknown";
  },
});

export const listedInCity = internalQuery({
  args: { citySlug: v.string() },
  handler: async (
    ctx,
    { citySlug },
  ): Promise<Array<{ placeId: string; lastSeenAt: number }>> => {
    const rows = await ctx.db
      .query("spots")
      .withIndex("by_city_slug", (q) => q.eq("citySlug", citySlug))
      .collect();
    return rows
      .filter((row) => row.listingStatus === "listed")
      .sort((a, b) => (a.lastSeenAt ?? 0) - (b.lastSeenAt ?? 0))
      .map((row) => ({ placeId: row.placeId, lastSeenAt: row.lastSeenAt ?? 0 }));
  },
});

export const markSeen = internalMutation({
  args: {
    placeId: v.string(),
    reason: seenReasonValidator,
  },
  handler: async (ctx, { placeId, reason }) => {
    const existing = await ctx.db
      .query("placesSeen")
      .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { reason, seenAt: Date.now() });
      return;
    }
    await ctx.db.insert("placesSeen", {
      placeId,
      reason,
      seenAt: Date.now(),
    });
  },
});

export const loadCursor = internalQuery({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ cityIndex: number; citySlug: string | null }> => {
    const row = await ctx.db
      .query("ingestCursor")
      .withIndex("by_key", (q) => q.eq("key", INGEST_CURSOR_KEY))
      .unique();
    return {
      cityIndex: row?.cityIndex ?? 0,
      citySlug: row?.citySlug ?? null,
    };
  },
});

export const saveCursor = internalMutation({
  args: { cityIndex: v.number(), citySlug: v.string() },
  handler: async (ctx, { cityIndex, citySlug }) => {
    const existing = await ctx.db
      .query("ingestCursor")
      .withIndex("by_key", (q) => q.eq("key", INGEST_CURSOR_KEY))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { cityIndex, citySlug });
      return;
    }
    await ctx.db.insert("ingestCursor", {
      key: INGEST_CURSOR_KEY,
      cityIndex,
      citySlug,
    });
  },
});

export const quota = internalQuery({
  args: { monthKey: v.string() },
  handler: async (ctx, { monthKey }): Promise<number> => {
    const row = await ctx.db
      .query("placesQuota")
      .withIndex("by_monthKey", (q) => q.eq("monthKey", monthKey))
      .unique();
    return row?.detailsCount ?? 0;
  },
});

export const spendDetail = internalMutation({
  args: { monthKey: v.string() },
  handler: async (ctx, { monthKey }): Promise<number> => {
    const existing = await ctx.db
      .query("placesQuota")
      .withIndex("by_monthKey", (q) => q.eq("monthKey", monthKey))
      .unique();
    if (existing) {
      const next = existing.detailsCount + 1;
      await ctx.db.patch(existing._id, { detailsCount: next });
      return next;
    }
    await ctx.db.insert("placesQuota", { monthKey, detailsCount: 1 });
    return 1;
  },
});

export const apply = internalMutation({
  args: { snapshot: snapshotValidator },
  handler: async (ctx, { snapshot }): Promise<HygienePlan> => {
    return await applySnapshot(ctx, snapshot, Date.now());
  },
});

export const rejudgeBatch = internalMutation({
  args: { ids: v.array(v.id("spots")) },
  handler: async (
    ctx,
    { ids },
  ): Promise<{ closed: number; kept: number }> => {
    const now = Date.now();
    let closed = 0;
    let kept = 0;
    for (const id of ids) {
      const row = await ctx.db.get(id);
      if (!row || row.listingStatus !== "listed") {
        continue;
      }
      const plan = await rejudgeStoredSpot(ctx, row, now);
      if (plan.action === "close") {
        closed += 1;
      } else {
        kept += 1;
      }
    }
    return { closed, kept };
  },
});

export const listedSpots = internalQuery({
  args: {},
  handler: async (
    ctx,
  ): Promise<Array<{ id: Id<"spots">; citySlug: string; geo: { lat: number; lng: number } }>> => {
    const rows = await ctx.db.query("spots").collect();
    return rows
      .filter((row) => row.listingStatus === "listed")
      .map((row) => ({ id: row._id, citySlug: row.citySlug, geo: row.geo }));
  },
});

export const patchCitySlug = internalMutation({
  args: { id: v.id("spots"), citySlug: v.string() },
  handler: async (ctx, { id, citySlug }) => {
    await ctx.db.patch(id, { citySlug });
  },
});

export const rejudgeListed = internalAction({
  args: {},
  handler: async (ctx): Promise<{ closed: number; kept: number }> => {
    const listed = await ctx.runQuery(internal.ingest.listedSpots, {});
    let closed = 0;
    let kept = 0;
    const batchSize = 80;
    for (let i = 0; i < listed.length; i += batchSize) {
      const result = await ctx.runMutation(internal.ingest.rejudgeBatch, {
        ids: listed.slice(i, i + batchSize).map((row) => row.id),
      });
      closed += result.closed;
      kept += result.kept;
    }
    return { closed, kept };
  },
});

export const refreshCatalog = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    skipped: boolean;
    applied: number;
    details: number;
    capped: boolean;
    cityIndex: number;
    citySlug: string | null;
  }> => {
    await ctx.runAction(internal.ingest.rejudgeListed, {});
    const key = placesKey();
    if (!key) {
      return {
        skipped: true,
        applied: 0,
        details: 0,
        capped: false,
        cityIndex: 0,
        citySlug: null,
      };
    }

    await ctx.runMutation(internal.seed.cities, {});

    const monthKey = billingMonthKey(Date.now());
    let used: number = await ctx.runQuery(internal.ingest.quota, { monthKey });
    const left = detailsBudgetLeft(used, INGEST_DETAILS_MONTHLY_CAP);
    if (left === 0) {
      return {
        skipped: false,
        applied: 0,
        details: 0,
        capped: true,
        cityIndex: 0,
        citySlug: null,
      };
    }

    const listed = await ctx.runQuery(internal.ingest.listedSpots, {});
    for (const row of listed) {
      const nextSlug = assignCitySlugWithFallback(row.geo, []);
      if (nextSlug && nextSlug !== row.citySlug) {
        await ctx.runMutation(internal.ingest.patchCitySlug, {
          id: row.id,
          citySlug: nextSlug,
        });
      }
    }

    const runBudget = Math.min(DETAILS_PER_RUN, left);
    let applied = 0;
    let details = 0;
    const ingestSlugs = NL_INGEST_GEMEENTEN.map((row) => row.slug);
    const saved = await ctx.runQuery(internal.ingest.loadCursor, {});
    let cityIndex = resolveIngestIndex(
      ingestSlugs,
      saved.citySlug,
      saved.cityIndex,
    );

    for (let visited = 0; visited < GEMEENTEN_PER_RUN; visited += 1) {
      if (details >= runBudget) {
        break;
      }
      const gemeente = NL_INGEST_GEMEENTEN[cityIndex];
      if (!gemeente) {
        cityIndex = nextCityIndex(cityIndex, NL_INGEST_GEMEENTEN.length);
        continue;
      }

      const discovered: string[] = [];
      for (const type of DISCOVERY_TYPES) {
        for (const query of DISCOVERY_QUERIES) {
          let ids: string[] = [];
          try {
            ids = await searchGemeente(gemeente.bbox, type, query, key);
          } catch {
            continue;
          }
          for (const placeId of ids) {
            if (discovered.includes(placeId)) {
              continue;
            }
            const knowledge: "listed" | "rejected" | "unknown" =
              await ctx.runQuery(internal.ingest.placeKnowledge, { placeId });
            if (knowledge === "unknown") {
              discovered.push(placeId);
            }
          }
        }
      }

      const staleRows: Array<{ placeId: string; lastSeenAt: number }> =
        await ctx.runQuery(internal.ingest.listedInCity, {
          citySlug: gemeente.slug,
        });
      const plan = planIngestTurn({
        budget: runBudget - details,
        discoveredIds: discovered,
        staleListedIds: staleRows.map((row) => row.placeId),
      });

      for (const item of plan.fetch) {
        if (details >= runBudget) {
          break;
        }
        try {
          const payload = await fetchPlacePro(item.placeId, key);
          if (!payload) {
            continue;
          }
          used = await ctx.runMutation(internal.ingest.spendDetail, {
            monthKey,
          });
          details += 1;
          const parsed = parseHygienePlace(payload);
          if (!parsed) {
            await ctx.runMutation(internal.ingest.markSeen, {
              placeId: item.placeId,
              reason: "invalid",
            });
            continue;
          }
          const names = isRecord(payload) ? localityNames(payload) : [];
          const citySlug = assignCitySlugWithFallback(parsed.geo, names);
          if (!citySlug) {
            await ctx.runMutation(internal.ingest.markSeen, {
              placeId: parsed.placeId,
              reason: "unassigned",
            });
            continue;
          }
          const planResult: HygienePlan = await ctx.runMutation(
            internal.ingest.apply,
            {
              snapshot: {
                ...parsed,
                citySlug,
                types: [...parsed.types],
              },
            },
          );
          if (planResult.action === "skip") {
            await ctx.runMutation(internal.ingest.markSeen, {
              placeId: parsed.placeId,
              reason:
                planResult.reason === "fast-food" ||
                planResult.reason === "not-hospitality" ||
                planResult.reason === "closed-unknown"
                  ? planResult.reason
                  : "invalid",
            });
            continue;
          }
          if (
            planResult.action === "insert" ||
            planResult.action === "refresh" ||
            planResult.action === "close"
          ) {
            applied += 1;
          }
        } catch {
          continue;
        }
      }

      cityIndex = nextCityIndex(cityIndex, NL_INGEST_GEMEENTEN.length);
    }

    const nextSlug = NL_INGEST_GEMEENTEN[cityIndex]?.slug ?? ingestSlugs[0] ?? "";
    await ctx.runMutation(internal.ingest.saveCursor, {
      cityIndex,
      citySlug: nextSlug,
    });
    return {
      skipped: false,
      applied,
      details,
      capped: used >= INGEST_DETAILS_MONTHLY_CAP || details >= runBudget,
      cityIndex,
      citySlug: nextSlug || null,
    };
  },
});

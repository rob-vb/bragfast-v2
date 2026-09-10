import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import { NL_INGEST_GEMEENTEN } from "../domain/gemeenten";
import { resolveIngestIndex } from "../domain/ingestTurn";
import {
  OSM_HOURS_CURSOR_KEY,
  OSM_HOURS_OVERPASS_PER_RUN,
  matchHourlessSpots,
  overpassHoursQueries,
  planOsmHoursWalk,
  readOverpassVenues,
  type HourlessSpot,
} from "../domain/osmHours";
import { rejudgeStoredSpot } from "./model/hygiene";

const presentHoursValidator = v.object({
  timezone: v.string(),
  periods: v.array(
    v.object({
      day: v.number(),
      open: v.string(),
      close: v.string(),
    }),
  ),
});

const OVERPASS_ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
] as const;

function overpassEndpoints(): string[] {
  const preferred = process.env.OVERPASS_URL;
  if (!preferred) {
    return [...OVERPASS_ENDPOINTS];
  }
  return [preferred, ...OVERPASS_ENDPOINTS.filter((url) => url !== preferred)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const listedHourless = internalQuery({
  args: {},
  handler: async (ctx): Promise<HourlessSpot[]> => {
    const rows = await ctx.db.query("spots").collect();
    return rows
      .filter((row) => row.listingStatus === "listed" && row.hours === null)
      .map((row) => ({
        id: row._id,
        name: row.name,
        geo: row.geo,
        citySlug: row.citySlug,
      }));
  },
});

export const loadCursor = internalQuery({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ cityIndex: number; citySlug: string | null }> => {
    const row = await ctx.db
      .query("ingestCursor")
      .withIndex("by_key", (q) => q.eq("key", OSM_HOURS_CURSOR_KEY))
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
      .withIndex("by_key", (q) => q.eq("key", OSM_HOURS_CURSOR_KEY))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { cityIndex, citySlug });
      return;
    }
    await ctx.db.insert("ingestCursor", {
      key: OSM_HOURS_CURSOR_KEY,
      cityIndex,
      citySlug,
    });
  },
});

type PresentHours = {
  timezone: string;
  periods: Array<{ day: number; open: string; close: string }>;
};

async function patchHoursIfStillNull(
  ctx: MutationCtx,
  spotId: Id<"spots">,
  hours: PresentHours,
): Promise<"filled" | "missing" | "gravestone" | "already-has-hours"> {
  const row = await ctx.db.get(spotId);
  if (!row) {
    return "missing";
  }
  if (row.listingStatus !== "listed") {
    return "gravestone";
  }
  if (row.hours !== null) {
    return "already-has-hours";
  }
  await ctx.db.patch(spotId, { hours });
  const updated = await ctx.db.get(spotId);
  if (updated) {
    await rejudgeStoredSpot(ctx, updated, Date.now());
  }
  return "filled";
}

export const applyHoursFill = internalMutation({
  args: {
    spotId: v.id("spots"),
    hours: presentHoursValidator,
  },
  handler: async (ctx, { spotId, hours }) => {
    return await patchHoursIfStillNull(ctx, spotId, hours);
  },
});

export const applyHoursFillMany = internalMutation({
  args: {
    fills: v.array(
      v.object({
        spotId: v.id("spots"),
        hours: presentHoursValidator,
      }),
    ),
  },
  handler: async (ctx, { fills }): Promise<{ filled: number }> => {
    let filled = 0;
    for (const row of fills) {
      const outcome = await patchHoursIfStillNull(ctx, row.spotId, row.hours);
      if (outcome === "filled") {
        filled += 1;
      }
    }
    return { filled };
  },
});

export const setListedHours = internalMutation({
  args: {
    spotId: v.id("spots"),
    hours: v.union(presentHoursValidator, v.null()),
  },
  handler: async (ctx, { spotId, hours }): Promise<"ok" | "missing" | "gravestone"> => {
    const row = await ctx.db.get(spotId);
    if (!row) {
      return "missing";
    }
    if (row.listingStatus !== "listed") {
      return "gravestone";
    }
    await ctx.db.patch(spotId, { hours });
    return "ok";
  },
});

async function fetchOverpass(query: string): Promise<unknown | null> {
  const urls = overpassEndpoints();
  const body = new URLSearchParams({ data: query });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const url = urls[attempt % urls.length]!;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "brag.fast hours-fill (http://77.42.31.66/)",
        },
        body,
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Retry on the next mirror.
    }
    await sleep(3_000 * (attempt + 1));
  }
  return null;
}

export const fillHours = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    filled: number;
    visited: string[];
    overpassFailed: boolean;
    cityIndex: number;
    citySlug: string | null;
  }> => {
    const hourless: HourlessSpot[] = await ctx.runQuery(
      internal.osmHours.listedHourless,
      {},
    );
    const byCity = new Map<string, HourlessSpot[]>();
    for (const spot of hourless) {
      const list = byCity.get(spot.citySlug) ?? [];
      list.push(spot);
      byCity.set(spot.citySlug, list);
    }

    const ingestSlugs = NL_INGEST_GEMEENTEN.map((row) => row.slug);
    const saved = await ctx.runQuery(internal.osmHours.loadCursor, {});
    const startIndex = resolveIngestIndex(
      ingestSlugs,
      saved.citySlug,
      saved.cityIndex,
    );
    const walk = planOsmHoursWalk({
      startIndex,
      slugs: ingestSlugs,
      hasHourless: (slug) => (byCity.get(slug)?.length ?? 0) > 0,
      overpassBudget: OSM_HOURS_OVERPASS_PER_RUN,
    });

    let filled = 0;
    const completed: string[] = [];
    for (const slug of walk.visit) {
      const gemeente = NL_INGEST_GEMEENTEN.find((row) => row.slug === slug);
      if (!gemeente) {
        continue;
      }
      const spots = byCity.get(slug) ?? [];
      const queries = overpassHoursQueries(spots.map((spot) => spot.geo));
      const venues = [];
      let failed = false;
      for (const query of queries) {
        let payload: unknown | null = null;
        try {
          payload = await fetchOverpass(query);
        } catch {
          payload = null;
        }
        if (payload === null) {
          failed = true;
          break;
        }
        venues.push(...readOverpassVenues(payload));
      }
      if (failed || queries.length === 0) {
        const cursor = await ctx.runQuery(internal.osmHours.loadCursor, {});
        return {
          filled,
          visited: completed,
          overpassFailed: true,
          cityIndex: cursor.cityIndex,
          citySlug: cursor.citySlug,
        };
      }
      const decisions = matchHourlessSpots(spots, venues);
      for (const decision of decisions) {
        if (decision.action !== "fill") {
          continue;
        }
        const outcome = await ctx.runMutation(internal.osmHours.applyHoursFill, {
          spotId: decision.spot.id,
          hours: decision.hours,
        });
        if (outcome === "filled") {
          filled += 1;
        }
      }
      completed.push(slug);
      const doneAt = ingestSlugs.indexOf(slug);
      if (doneAt >= 0) {
        const nextIndex = (doneAt + 1) % ingestSlugs.length;
        await ctx.runMutation(internal.osmHours.saveCursor, {
          cityIndex: nextIndex,
          citySlug: ingestSlugs[nextIndex] ?? "",
        });
      }
      await sleep(1_500);
    }

    const nextSlug = ingestSlugs[walk.nextIndex] ?? ingestSlugs[0] ?? "";
    await ctx.runMutation(internal.osmHours.saveCursor, {
      cityIndex: walk.nextIndex,
      citySlug: nextSlug,
    });
    return {
      filled,
      visited: completed,
      overpassFailed: false,
      cityIndex: walk.nextIndex,
      citySlug: nextSlug || null,
    };
  },
});

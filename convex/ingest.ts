import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { cityCentroid } from "../domain/geo";
import {
  placesHoursToOpeningHours,
  type HygienePlan,
  type PlacesBusinessStatus,
  type PlacesHoursPeriod,
  type PlacesSnapshot,
} from "../domain/hygiene";
import { applySnapshot } from "./model/hygiene";
import { openingHoursValidator } from "../domain/spot";

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

function parseHourPoint(
  value: unknown,
): { day: number; hour: number; minute: number } | null {
  if (!isRecord(value) || typeof value.day !== "number") {
    return null;
  }
  const hour = typeof value.hour === "number" ? value.hour : 0;
  const minute = typeof value.minute === "number" ? value.minute : 0;
  return { day: value.day, hour, minute };
}

function parseGooglePeriods(payload: unknown): PlacesHoursPeriod[] {
  if (!isRecord(payload) || !Array.isArray(payload.periods)) {
    return [];
  }
  const periods: PlacesHoursPeriod[] = [];
  for (const entry of payload.periods) {
    if (!isRecord(entry)) {
      continue;
    }
    const open = parseHourPoint(entry.open);
    if (!open) {
      continue;
    }
    const close = parseHourPoint(entry.close);
    periods.push(close ? { open, close } : { open });
  }
  return periods;
}

function parseHygienePlace(
  payload: unknown,
  citySlug: string,
): PlacesSnapshot | null {
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
  const hoursPayload = isRecord(payload.regularOpeningHours)
    ? payload.regularOpeningHours
    : null;
  return {
    placeId,
    name,
    address,
    geo: { lat, lng },
    types,
    hours: placesHoursToOpeningHours(
      hoursPayload ? parseGooglePeriods(hoursPayload) : [],
      "Europe/Amsterdam",
    ),
    businessStatus: parseBusinessStatus(payload.businessStatus),
    citySlug,
  };
}

function parseSearchIds(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.places)) {
    return [];
  }
  const ids: string[] = [];
  for (const place of payload.places) {
    if (!isRecord(place) || typeof place.id !== "string") {
      continue;
    }
    ids.push(place.id);
  }
  return ids;
}

async function searchCity(
  geo: { lat: number; lng: number },
  key: string,
): Promise<string[]> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id",
      },
      body: JSON.stringify({
        textQuery: "ontbijt brunch",
        languageCode: "nl",
        regionCode: "NL",
        locationBias: {
          circle: {
            center: { latitude: geo.lat, longitude: geo.lng },
            radius: 8000,
          },
        },
      }),
    },
  );
  if (!response.ok) {
    return [];
  }
  return parseSearchIds(await response.json());
}

async function fetchHygieneDetails(
  placeId: string,
  key: string,
): Promise<unknown | null> {
  const id = placeId.startsWith("places/") ? placeId.slice(7) : placeId;
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=nl`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "businessStatus,regularOpeningHours,id,displayName,formattedAddress,location,types",
      },
    },
  );
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

export const featuredCitySlugs = internalQuery({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const rows = await ctx.db.query("cities").withIndex("by_featured").collect();
    return rows
      .filter((row) => row.featuredOrder !== undefined)
      .map((row) => row.slug);
  },
});

export const apply = internalMutation({
  args: { snapshot: snapshotValidator },
  handler: async (ctx, { snapshot }): Promise<HygienePlan> => {
    return await applySnapshot(ctx, snapshot, Date.now());
  },
});

export const refreshCatalog = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ skipped: boolean; applied: number }> => {
    const key = placesKey();
    if (!key) {
      return { skipped: true, applied: 0 };
    }
    const slugs: string[] = await ctx.runQuery(
      internal.ingest.featuredCitySlugs,
      {},
    );
    let applied = 0;
    for (const slug of slugs) {
      const geo = cityCentroid(slug);
      if (!geo) {
        continue;
      }
      let ids: string[] = [];
      try {
        ids = await searchCity(geo, key);
      } catch {
        continue;
      }
      for (const placeId of ids) {
        try {
          const payload = await fetchHygieneDetails(placeId, key);
          const snapshot = payload
            ? parseHygienePlace(payload, slug)
            : null;
          if (!snapshot) {
            continue;
          }
          const plan: HygienePlan = await ctx.runMutation(
            internal.ingest.apply,
            {
              snapshot: {
                ...snapshot,
                types: [...snapshot.types],
              },
            },
          );
          if (
            plan.action === "insert" ||
            plan.action === "refresh" ||
            plan.action === "close"
          ) {
            applied += 1;
          }
        } catch {
          continue;
        }
      }
    }
    return { skipped: false, applied };
  },
});

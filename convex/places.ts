import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { applyPlaceAdd } from "./model/placeAdd";
import { ensureUserByAuthId } from "./model/users";

type PlaceSuggestion = { placeId: string; name: string; address: string };

type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  types: string[];
};

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

function parseSuggestions(payload: unknown): PlaceSuggestion[] {
  if (!isRecord(payload) || !Array.isArray(payload.suggestions)) {
    return [];
  }
  const out: PlaceSuggestion[] = [];
  for (const item of payload.suggestions) {
    if (!isRecord(item) || !isRecord(item.placePrediction)) {
      continue;
    }
    const prediction = item.placePrediction;
    const placeId =
      typeof prediction.placeId === "string"
        ? prediction.placeId
        : typeof prediction.place === "string"
          ? prediction.place
          : null;
    if (!placeId) {
      continue;
    }
    const structured = isRecord(prediction.structuredFormat)
      ? prediction.structuredFormat
      : null;
    const name =
      textOf(structured?.mainText) ??
      textOf(prediction.text);
    if (!name) {
      continue;
    }
    out.push({
      placeId,
      name,
      address: textOf(structured?.secondaryText) ?? "",
    });
    if (out.length === 6) {
      break;
    }
  }
  return out;
}

function parseDetails(payload: unknown): PlaceDetails {
  if (!isRecord(payload)) {
    throw new ConvexError("Place details missing");
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
    throw new ConvexError("Place details incomplete");
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
  };
}

async function fetchSuggestions(
  q: string,
  key: string,
): Promise<PlaceSuggestion[]> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify({
        input: q,
        includedRegionCodes: ["nl"],
        languageCode: "nl",
      }),
    },
  );
  if (!response.ok) {
    return [];
  }
  return parseSuggestions(await response.json());
}

async function fetchDetails(placeId: string, key: string): Promise<PlaceDetails> {
  const id = placeId.startsWith("places/") ? placeId.slice(7) : placeId;
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=nl`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,types",
      },
    },
  );
  if (!response.ok) {
    throw new ConvexError("Place details failed");
  }
  return parseDetails(await response.json());
}

export const placesConfigured = query({
  args: {},
  handler: async () => Boolean(placesKey()),
});

export const autocomplete = action({
  args: { q: v.string() },
  handler: async (ctx, { q }): Promise<PlaceSuggestion[]> => {
    await authComponent.getAuthUser(ctx);
    const key = placesKey();
    if (!key) {
      return [];
    }
    const needle = q.trim();
    if (needle.length < 2) {
      return [];
    }
    return await fetchSuggestions(needle, key);
  },
});

export const add = action({
  args: { placeId: v.string(), citySlug: v.string() },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    const key = placesKey();
    if (!key) {
      throw new ConvexError("Places is not configured");
    }
    const details = await fetchDetails(args.placeId, key);
    const displayName =
      (typeof authUser.name === "string" ? authUser.name.trim() : "") ||
      (typeof authUser.email === "string" ? authUser.email : "") ||
      "bragger";
    await ctx.runMutation(internal.places.apply, {
      placeId: details.placeId,
      name: details.name,
      address: details.address,
      geo: details.geo,
      types: details.types,
      citySlug: args.citySlug,
      authId: authUser._id,
      displayName,
      avatarUrl:
        typeof authUser.image === "string" ? authUser.image : null,
    });
  },
});

export const apply = internalMutation({
  args: {
    placeId: v.string(),
    name: v.string(),
    address: v.string(),
    geo: v.object({ lat: v.number(), lng: v.number() }),
    types: v.array(v.string()),
    citySlug: v.string(),
    authId: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await ensureUserByAuthId(ctx, {
      authId: args.authId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
    });
    await applyPlaceAdd(ctx, {
      placeId: args.placeId,
      name: args.name,
      address: args.address,
      geo: args.geo,
      types: args.types,
      citySlug: args.citySlug,
      submittedBy: user._id,
    });
  },
});

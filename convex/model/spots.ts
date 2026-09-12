import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  parseCitySlug,
  parsePlaceId,
  parseSpotSlug,
} from "../../domain/ids";
import { planSpotUpsert, type OpeningHours, type SpotType } from "../../domain/spot";

export type SpotUpsert = {
  placeId: string;
  slug: string;
  citySlug: string;
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  hours: OpeningHours | null;
  spotType: SpotType;
  listingStatus: "listed" | "gravestone";
  closedAt?: number;
  lastSeenAt?: number;
  placesRaw?: unknown;
  addedBy?: Id<"users">;
  photoId?: Id<"_storage">;
};

export async function upsertCity(
  ctx: MutationCtx,
  input: {
    slug: string;
    nameNl: string;
    nameEn: string;
    featuredOrder?: number;
  },
) {
  const slug = parseCitySlug(input.slug);
  const existing = await ctx.db
    .query("cities")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  const fields = {
    slug,
    country: "nl" as const,
    nameNl: input.nameNl,
    nameEn: input.nameEn,
    ...(input.featuredOrder !== undefined
      ? { featuredOrder: input.featuredOrder }
      : {}),
  };

  if (existing) {
    await ctx.db.patch(existing._id, fields);
    return existing._id;
  }

  return await ctx.db.insert("cities", fields);
}

export async function upsertSpot(ctx: MutationCtx, input: SpotUpsert) {
  const placeId = parsePlaceId(input.placeId);
  const citySlug = parseCitySlug(input.citySlug);
  const slug = parseSpotSlug(input.slug);
  const byPlaceId = await ctx.db
    .query("spots")
    .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
    .unique();
  const bySlug = await ctx.db
    .query("spots")
    .withIndex("by_city_slug", (q) => q.eq("citySlug", citySlug).eq("slug", slug))
    .unique();

  const plan = planSpotUpsert({
    incomingPlaceId: placeId,
    byPlaceId,
    bySlug,
  });

  const listing =
    input.listingStatus === "gravestone"
      ? {
          listingStatus: "gravestone" as const,
          closedAt: input.closedAt ?? Date.now(),
        }
      : {
          listingStatus: "listed" as const,
        };

  const lifecyclePatch =
    input.listingStatus === "gravestone"
      ? {
          boardScore: undefined,
          latestBragAt: undefined,
          windowExpiresAt: undefined,
        }
      : { closedAt: undefined };

  const fields = {
    citySlug,
    country: "nl" as const,
    name: input.name,
    address: input.address,
    geo: input.geo,
    hours: input.hours,
    spotType: input.spotType,
    ...listing,
    ...(input.lastSeenAt !== undefined ? { lastSeenAt: input.lastSeenAt } : {}),
    ...(input.addedBy !== undefined ? { addedBy: input.addedBy } : {}),
    ...(input.photoId !== undefined ? { photoId: input.photoId } : {}),
  };

  const placesRaw = input.placesRaw ?? { source: "seed" };

  if (plan.action === "patch") {
    const target = plan.via === "placeId" ? byPlaceId : bySlug;
    if (!target) {
      throw new Error("Spot upsert plan missed its row");
    }
    await ctx.db.patch(target._id, {
      ...fields,
      ...lifecyclePatch,
      placeId: plan.placeId,
      ...(input.placesRaw !== undefined ? { placesRaw: input.placesRaw } : {}),
    });
    return target._id;
  }

  if (input.listingStatus === "gravestone") {
    return await ctx.db.insert("spots", {
      ...fields,
      placeId,
      slug,
      closedAt: input.closedAt ?? Date.now(),
      allTimeMakers: 0,
      placesRaw,
    });
  }

  return await ctx.db.insert("spots", {
    ...fields,
    placeId,
    slug,
    allTimeMakers: 0,
    placesRaw,
  });
}

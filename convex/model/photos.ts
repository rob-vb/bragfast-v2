import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { parsePlaceId, parseSpotSlug } from "../../domain/ids";
import {
  planHeroAfterDelete,
  planPhotoDelete,
  planPhotoPublish,
  unusedPublishBlob,
  type PhotoPublishChannel,
} from "../../domain/photo";
import { applyPlaceAdd, type PlaceAddCommit } from "./placeAdd";

export type PhotoPublishCommit =
  | Extract<PlaceAddCommit, { action: "live" | "redirect" | "reject" }>
  | { action: "attach"; placeSlug: string; spotSlug: ReturnType<typeof parseSpotSlug> };

export async function insertVisitorPhoto(
  ctx: MutationCtx,
  input: {
    spotId: Id<"spots">;
    storageId: Id<"_storage">;
    uploadedBy: Id<"users">;
    createdAt: number;
    promoteIfEmpty: boolean;
  },
) {
  await ctx.db.insert("photos", {
    spotId: input.spotId,
    storageId: input.storageId,
    uploadedBy: input.uploadedBy,
    createdAt: input.createdAt,
  });
  if (!input.promoteIfEmpty) {
    return;
  }
  const spot = await ctx.db.get(input.spotId);
  if (!spot || spot.photoId !== undefined) {
    return;
  }
  await ctx.db.patch(input.spotId, { photoId: input.storageId });
}

export async function applyPhotoPublish(
  ctx: MutationCtx,
  input: {
    channel: PhotoPublishChannel;
    placeId: string;
    name: string;
    address: string;
    geo: { lat: number; lng: number };
    types: string[];
    photoId: Id<"_storage"> | null;
    addedBy: Id<"users">;
  },
): Promise<PhotoPublishCommit> {
  const placeId = parsePlaceId(input.placeId);
  const byPlaceId = await ctx.db
    .query("spots")
    .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
    .unique();
  const photoId = input.photoId;
  const photoOk =
    photoId !== null && (await ctx.storage.getUrl(photoId)) !== null;
  const plan = planPhotoPublish({
    channel: input.channel,
    types: input.types,
    geo: input.geo,
    photo: photoOk,
    existing: byPlaceId
      ? { spotSlug: byPlaceId.slug, placeSlug: byPlaceId.citySlug }
      : null,
  });
  if (plan.action === "attach") {
    if (!byPlaceId || photoId === null) {
      if (photoId !== null) {
        await ctx.storage.delete(photoId);
      }
      return { action: "reject", reason: "photo-required" };
    }
    await insertVisitorPhoto(ctx, {
      spotId: byPlaceId._id,
      storageId: photoId,
      uploadedBy: input.addedBy,
      createdAt: Date.now(),
      promoteIfEmpty: true,
    });
    return {
      action: "attach",
      placeSlug: byPlaceId.citySlug,
      spotSlug: parseSpotSlug(byPlaceId.slug),
    };
  }
  if (unusedPublishBlob(plan)) {
    if (photoId !== null) {
      await ctx.storage.delete(photoId);
    }
    return plan;
  }
  return await applyPlaceAdd(ctx, {
    placeId: input.placeId,
    name: input.name,
    address: input.address,
    geo: input.geo,
    types: input.types,
    photoId: input.photoId,
    addedBy: input.addedBy,
  });
}

export async function applyPhotoDelete(
  ctx: MutationCtx,
  input: { photoId: Id<"photos">; userId: Id<"users"> },
): Promise<
  | { action: "delete" }
  | { action: "reject"; reason: "not-owner" | "missing" }
> {
  const photo = await ctx.db.get(input.photoId);
  const plan = planPhotoDelete({
    exists: photo !== null,
    owner: photo !== null && photo.uploadedBy === input.userId,
  });
  if (photo === null) {
    return plan;
  }
  if (plan.action === "reject") {
    return plan;
  }
  const spot = await ctx.db.get(photo.spotId);
  const siblings = await ctx.db
    .query("photos")
    .withIndex("by_spot", (q) => q.eq("spotId", photo.spotId))
    .collect();
  const remaining = siblings
    .filter((row) => row._id !== photo._id)
    .map((row) => ({
      storageId: row.storageId as string,
      createdAt: row.createdAt,
    }));
  const hero = planHeroAfterDelete({
    deletingStorageId: photo.storageId,
    heroStorageId: spot?.photoId ?? null,
    remaining,
  });
  await ctx.db.delete(photo._id);
  await ctx.storage.delete(photo.storageId);
  if (spot) {
    if (hero.kind === "empty") {
      await ctx.db.patch(spot._id, { photoId: undefined });
    } else if (hero.kind === "promote") {
      await ctx.db.patch(spot._id, {
        photoId: hero.storageId as Id<"_storage">,
      });
    }
  }
  return { action: "delete" };
}

export async function backfillHeroPhotos(ctx: MutationCtx) {
  const spots = await ctx.db.query("spots").collect();
  let inserted = 0;
  for (const spot of spots) {
    if (spot.photoId === undefined || spot.addedBy === undefined) {
      continue;
    }
    const existing = await ctx.db
      .query("photos")
      .withIndex("by_spot", (q) => q.eq("spotId", spot._id))
      .first();
    if (existing) {
      continue;
    }
    await ctx.db.insert("photos", {
      spotId: spot._id,
      storageId: spot.photoId,
      uploadedBy: spot.addedBy,
      createdAt: spot._creationTime,
    });
    inserted += 1;
  }
  return { inserted };
}

export async function listSpotPhotoDocs(ctx: QueryCtx, spotId: Id<"spots">) {
  return await ctx.db
    .query("photos")
    .withIndex("by_spot_created", (q) => q.eq("spotId", spotId))
    .collect();
}

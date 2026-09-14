import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  planHeroAfterDelete,
  planPhotoDelete,
} from "../../domain/photo";

export async function insertSpotPhoto(
  ctx: MutationCtx,
  input: {
    spotId: Id<"spots">;
    storageId: Id<"_storage">;
    uploadedBy: Id<"users">;
    createdAt?: number;
  },
): Promise<Id<"photos">> {
  return await ctx.db.insert("photos", {
    spotId: input.spotId,
    storageId: input.storageId,
    uploadedBy: input.uploadedBy,
    createdAt: input.createdAt ?? Date.now(),
  });
}

export async function photosOnSpot(
  ctx: MutationCtx,
  spotId: Id<"spots">,
) {
  const rows = await ctx.db
    .query("photos")
    .withIndex("by_spot_created", (q) => q.eq("spotId", spotId))
    .collect();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function deleteOwnPhoto(
  ctx: MutationCtx,
  input: { photoId: Id<"photos">; userId: Id<"users"> },
): Promise<
  | { action: "delete" }
  | { action: "reject"; reason: "not-owner" | "missing" }
> {
  const row = await ctx.db.get(input.photoId);
  const plan = planPhotoDelete({
    exists: row !== null,
    owner: row !== null && row.uploadedBy === input.userId,
  });
  if (row === null || plan.action === "reject") {
    return plan;
  }
  const spot = await ctx.db.get(row.spotId);
  const remaining = (await photosOnSpot(ctx, row.spotId)).filter(
    (photo) => photo._id !== row._id,
  );
  const hero = planHeroAfterDelete({
    deletingStorageId: row.storageId,
    heroStorageId: spot?.photoId ?? null,
    remaining: remaining.map((photo) => ({
      storageId: photo.storageId,
      createdAt: photo.createdAt,
    })),
  });
  if (spot) {
    if (hero.kind === "promote") {
      await ctx.db.patch(spot._id, {
        photoId: hero.storageId as Id<"_storage">,
      });
    } else if (hero.kind === "empty") {
      await ctx.db.patch(spot._id, { photoId: undefined });
    }
  }
  await ctx.db.delete(row._id);
  const stillUsed =
    remaining.some((photo) => photo.storageId === row.storageId) ||
    (hero.kind !== "empty" && hero.storageId === row.storageId);
  if (!stillUsed) {
    await ctx.storage.delete(row.storageId);
  }
  return { action: "delete" };
}

export async function backfillHeroPhotos(ctx: MutationCtx): Promise<number> {
  const spots = await ctx.db.query("spots").collect();
  let inserted = 0;
  for (const spot of spots) {
    if (spot.photoId === undefined || spot.addedBy === undefined) {
      continue;
    }
    const existing = await ctx.db
      .query("photos")
      .withIndex("by_spot", (q) => q.eq("spotId", spot._id))
      .collect();
    if (existing.some((row) => row.storageId === spot.photoId)) {
      continue;
    }
    await insertSpotPhoto(ctx, {
      spotId: spot._id,
      storageId: spot.photoId,
      uploadedBy: spot.addedBy,
      createdAt: spot._creationTime,
    });
    inserted += 1;
  }
  return inserted;
}

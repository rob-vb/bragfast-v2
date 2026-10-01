import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  pickDiscoveryPhoto,
  planHeroAfterDelete,
  planPhotoDelete,
  type PhotoSource,
} from "../../domain/photo";

export async function insertSpotPhoto(
  ctx: MutationCtx,
  input: {
    spotId: Id<"spots">;
    storageId: Id<"_storage">;
    uploadedBy: Id<"users">;
    createdAt?: number;
    discovery?: boolean;
    source?: PhotoSource;
    scannedAt?: number;
  },
): Promise<Id<"photos">> {
  return await ctx.db.insert("photos", {
    spotId: input.spotId,
    storageId: input.storageId,
    uploadedBy: input.uploadedBy,
    createdAt: input.createdAt ?? Date.now(),
    ...(input.discovery ? { discovery: true } : {}),
    ...(input.source ? { source: input.source } : {}),
    ...(input.scannedAt !== undefined ? { scannedAt: input.scannedAt } : {}),
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
  await deletePhoto(ctx, row);
  return { action: "delete" };
}

/** Point the spot's hero away from a photo that leaves view. */
async function moveHeroOff(ctx: MutationCtx, row: Doc<"photos">) {
  const spot = await ctx.db.get(row.spotId);
  if (!spot) {
    return;
  }
  const remaining = (await photosOnSpot(ctx, row.spotId)).filter(
    (photo) => photo._id !== row._id && photo.hiddenAt === undefined,
  );
  const hero = planHeroAfterDelete({
    deletingStorageId: row.storageId,
    heroStorageId: spot.photoId ?? null,
    remaining: remaining.map((photo) => ({
      storageId: photo.storageId,
      createdAt: photo.createdAt,
    })),
  });
  if (hero.kind === "promote") {
    await ctx.db.patch(spot._id, {
      photoId: hero.storageId as Id<"_storage">,
    });
  } else if (hero.kind === "empty") {
    await ctx.db.patch(spot._id, { photoId: undefined });
  }
}

/** Gone for good: the row, its reports, its like credit and, if unshared, the file. */
export async function deletePhoto(ctx: MutationCtx, row: Doc<"photos">) {
  await moveHeroOff(ctx, row);
  // The likes stay on the spot; only the photo's credit goes
  const credited = await ctx.db
    .query("likes")
    .withIndex("by_photo", (q) => q.eq("viaPhotoId", row._id))
    .collect();
  for (const like of credited) {
    await ctx.db.patch(like._id, { viaPhotoId: undefined });
  }
  const reports = await ctx.db
    .query("reports")
    .withIndex("by_photo", (q) => q.eq("target.photoId", row._id))
    .collect();
  for (const report of reports) {
    await ctx.db.delete(report._id);
  }
  await ctx.db.delete(row._id);
  const spot = await ctx.db.get(row.spotId);
  const stillUsed =
    (await photosOnSpot(ctx, row.spotId)).some(
      (photo) => photo.storageId === row.storageId,
    ) || spot?.photoId === row.storageId;
  if (!stillUsed) {
    await ctx.storage.delete(row.storageId);
  }
}

/** Out of view pending owner review; the hero moves on if it was this one. */
export async function hidePhoto(ctx: MutationCtx, row: Doc<"photos">) {
  if (row.hiddenAt !== undefined) {
    return;
  }
  await ctx.db.patch(row._id, { hiddenAt: Date.now() });
  await moveHeroOff(ctx, row);
}

/** Back in view; it becomes the hero only when the spot has none. */
export async function unhidePhoto(ctx: MutationCtx, row: Doc<"photos">) {
  await ctx.db.patch(row._id, { hiddenAt: undefined });
  const spot = await ctx.db.get(row.spotId);
  if (spot && spot.photoId === undefined) {
    await ctx.db.patch(spot._id, { photoId: row.storageId });
  }
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
      discovery: true,
    });
    inserted += 1;
  }
  return inserted;
}

/** Marks the discovery photo on spots created before photos carried it. */
export async function backfillDiscoveryPhotos(
  ctx: MutationCtx,
): Promise<number> {
  const spots = await ctx.db.query("spots").collect();
  let marked = 0;
  for (const spot of spots) {
    const photos = await photosOnSpot(ctx, spot._id);
    if (photos.some((photo) => photo.discovery === true)) {
      continue;
    }
    const first = pickDiscoveryPhoto(
      { addedBy: spot.addedBy ?? null, createdAt: spot._creationTime },
      photos,
    );
    if (first) {
      await ctx.db.patch(first._id, { discovery: true });
      marked += 1;
    }
  }
  return marked;
}

import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import {
  applyLikeCommand,
  likesBroughtByPhoto,
  pickLikeCredit,
  planLikeToggle,
  type LikeRow,
} from "../domain/like";
import { photosOnSpot } from "./model/photos";
import { ensureAppUser } from "./model/users";

async function likesOnSpot(ctx: QueryCtx | MutationCtx, spotId: Id<"spots">) {
  return await ctx.db
    .query("likes")
    .withIndex("by_spot", (q) => q.eq("spotId", spotId))
    .collect();
}

async function likeByUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  spotId: Id<"spots">,
) {
  const rows = await ctx.db
    .query("likes")
    .withIndex("by_user_spot", (q) =>
      q.eq("userId", userId).eq("spotId", spotId),
    )
    .collect();
  return rows[0] ?? null;
}

async function appUserId(ctx: QueryCtx): Promise<Id<"users"> | null> {
  let authUser;
  try {
    authUser = await authComponent.getAuthUser(ctx);
  } catch (error) {
    if (error instanceof ConvexError && error.data === "Unauthenticated") {
      return null;
    }
    throw error;
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
    .unique();
  return user?._id ?? null;
}

export async function syncSpotLikes(ctx: MutationCtx, spotId: Id<"spots">) {
  const remaining = await likesOnSpot(ctx, spotId);
  const likeCount = remaining.length;
  const lastLikedAt =
    likeCount === 0
      ? 0
      : remaining.reduce(
          (latest, row) => Math.max(latest, row._creationTime),
          0,
        );
  await ctx.db.patch(spotId, { likeCount, lastLikedAt });
  return likeCount;
}

function asLikeRow(row: { userId: Id<"users">; spotId: Id<"spots"> }): LikeRow {
  return { userId: row.userId, spotId: row.spotId };
}

export const viewerLike = query({
  args: { spotId: v.id("spots") },
  handler: async (ctx, { spotId }) => {
    const spot = await ctx.db.get(spotId);
    const likeCount = spot?.likeCount ?? 0;
    const userId = await appUserId(ctx);
    if (!userId) {
      return { liked: false, likeCount };
    }
    const existing = await likeByUser(ctx, userId, spotId);
    return { liked: existing !== null, likeCount };
  },
});

/** The photo a new like credits; see `pickLikeCredit`. */
async function likeCredit(
  ctx: MutationCtx,
  input: {
    likerId: Id<"users">;
    spot: Doc<"spots">;
    photoId: Id<"photos"> | undefined;
  },
): Promise<Id<"photos"> | null> {
  const inView = input.photoId ? await ctx.db.get(input.photoId) : null;
  const hero =
    inView !== null || input.spot.photoId === undefined
      ? null
      : ((await photosOnSpot(ctx, input.spot._id)).find(
          (photo) => photo.storageId === input.spot.photoId,
        ) ?? null);
  const asCredit = (photo: Doc<"photos"> | null) =>
    photo && { id: photo._id, spotId: photo.spotId, uploadedBy: photo.uploadedBy };
  const credited = pickLikeCredit({
    likerId: input.likerId,
    spotId: input.spot._id,
    inView: asCredit(inView),
    hero: asCredit(hero),
  });
  return credited as Id<"photos"> | null;
}

/** Likes each photo on the spot brought it, for the gallery. */
export const likesBrought = query({
  args: { spotId: v.id("spots") },
  handler: async (ctx, { spotId }) => {
    const counts = likesBroughtByPhoto(await likesOnSpot(ctx, spotId));
    return [...counts].map(([photoId, count]) => ({
      photoId: photoId as Id<"photos">,
      count,
    }));
  },
});

export const toggle = mutation({
  args: {
    spotId: v.id("spots"),
    /** The gallery photo in view when the visitor tapped like. */
    photoId: v.optional(v.id("photos")),
  },
  handler: async (ctx, { spotId, photoId }) => {
    const spot = await ctx.db.get(spotId);
    if (!spot || spot.listingStatus !== "listed") {
      throw new ConvexError("spot-missing");
    }
    const user = await ensureAppUser(ctx);
    const mine = await ctx.db
      .query("likes")
      .withIndex("by_user_spot", (q) =>
        q.eq("userId", user._id).eq("spotId", spotId),
      )
      .collect();
    mine.sort((a, b) => a._creationTime - b._creationTime);
    const existing = mine[0] ?? null;
    const plan = planLikeToggle(existing ? asLikeRow(existing) : null);
    const next = applyLikeCommand(existing ? [asLikeRow(existing)] : [], {
      action: plan.action,
      userId: user._id,
      spotId,
    });
    if (next.length === 0) {
      for (const row of mine) {
        await ctx.db.delete(row._id);
      }
    } else if (mine.length === 0) {
      const viaPhotoId = await likeCredit(ctx, {
        likerId: user._id,
        spot,
        photoId,
      });
      await ctx.db.insert("likes", {
        userId: user._id,
        spotId,
        ...(viaPhotoId ? { viaPhotoId } : {}),
      });
    } else {
      for (const extra of mine.slice(1)) {
        await ctx.db.delete(extra._id);
      }
    }
    const likeCount = await syncSpotLikes(ctx, spotId);
    return { liked: plan.action === "like", likeCount };
  },
});

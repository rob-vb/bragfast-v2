import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import {
  applyPhotoDelete,
  backfillHeroPhotos,
  listSpotPhotoDocs,
} from "./model/photos";
import { ensureAppUser } from "./model/users";

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

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await authComponent.getAuthUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const listForSpot = query({
  args: { spotId: v.id("spots") },
  handler: async (ctx, { spotId }) => {
    const me = await appUserId(ctx);
    const rows = await listSpotPhotoDocs(ctx, spotId);
    const out: {
      id: Id<"photos">;
      url: string;
      mine: boolean;
      createdAt: number;
    }[] = [];
    for (const row of rows) {
      const url = await ctx.storage.getUrl(row.storageId);
      if (!url) {
        continue;
      }
      out.push({
        id: row._id,
        url,
        mine: me !== null && row.uploadedBy === me,
        createdAt: row.createdAt,
      });
    }
    return out;
  },
});

export const deleteOwn = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const user = await ensureAppUser(ctx);
    const result = await applyPhotoDelete(ctx, {
      photoId,
      userId: user._id,
    });
    if (result.action === "reject") {
      throw new ConvexError(result.reason);
    }
    return result;
  },
});

export const backfillFromHeroes = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await backfillHeroPhotos(ctx);
  },
});

import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { backfillHeroPhotos, deleteOwnPhoto } from "./model/photos";
import { ensureAppUser } from "./model/users";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await authComponent.getAuthUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const viewerId = query({
  args: {},
  handler: async (ctx): Promise<Id<"users"> | null> => {
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
  },
});

export const deleteOwn = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const user = await ensureAppUser(ctx);
    const result = await deleteOwnPhoto(ctx, {
      photoId,
      userId: user._id,
    });
    if (result.action === "reject") {
      throw new ConvexError(result.reason);
    }
    return result;
  },
});

export const backfillHeroes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const inserted = await backfillHeroPhotos(ctx);
    return { inserted };
  },
});

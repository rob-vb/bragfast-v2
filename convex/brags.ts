import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authComponent } from "./auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await authComponent.getAuthUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    spotId: v.id("spots"),
    storageId: v.id("_storage"),
    mediaType: v.union(v.literal("photo"), v.literal("video")),
  },
  handler: async () => {
    throw new ConvexError("In-app brags are retired");
  },
});

export const replace = mutation({
  args: {
    storageId: v.id("_storage"),
    mediaType: v.union(v.literal("photo"), v.literal("video")),
  },
  handler: async () => {
    throw new ConvexError("In-app brags are retired");
  },
});

export const remove = mutation({
  args: {},
  handler: async () => {
    throw new ConvexError("In-app brags are retired");
  },
});

export const report = mutation({
  args: { reason: v.string() },
  handler: async () => {
    throw new ConvexError("In-app brags are retired");
  },
});

export const mineOnSpot = query({
  args: { spotId: v.id("spots") },
  handler: async (): Promise<Id<"_storage">[]> => {
    return [];
  },
});

import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";
import { serializeMakerKey } from "../domain/makerKey";
import type { HostedMedia } from "../domain/post";
import { ensureAppUser, ensurePassport } from "./model/users";
import { applyVisiblePosts } from "./model/votes";

function parseHostedMedia(input: {
  storageId: Id<"_storage">;
  mediaType: "photo" | "video";
  replacedAt: number | null;
}): HostedMedia {
  return {
    storageId: input.storageId,
    mediaType: input.mediaType,
    replacedAt: input.replacedAt,
  };
}

async function requireOwnedPost(ctx: MutationCtx, postId: Id<"posts">) {
  const user = await ensureAppUser(ctx);
  const post = await ctx.db.get(postId);
  if (!post) {
    throw new ConvexError("Post not found");
  }
  const makerKey = serializeMakerKey({ kind: "user", userId: user._id });
  if (post.makerKey !== makerKey) {
    throw new ConvexError("Not your post");
  }
  return { user, post, makerKey };
}

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
  handler: async (ctx, args) => {
    const user = await ensureAppUser(ctx);
    const spot = await ctx.db.get(args.spotId);
    if (!spot) {
      throw new ConvexError("Spot not found");
    }
    if (spot.listingStatus === "gravestone") {
      throw new ConvexError("Closed spots cannot take brags");
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new ConvexError("Upload missing");
    }

    const media = parseHostedMedia({
      storageId: args.storageId,
      mediaType: args.mediaType,
      replacedAt: null,
    });
    const makerKey = serializeMakerKey({ kind: "user", userId: user._id });
    const postId = await ctx.db.insert("posts", {
      spotId: args.spotId,
      makerKey,
      createdAt: Date.now(),
      visibility: { kind: "visible" },
      body: { kind: "inApp", media },
    });
    await applyVisiblePosts(ctx, { spotId: args.spotId, makerKey });
    await ensurePassport(ctx, user._id);
    const authUser = await authComponent.getAuthUser(ctx);
    const email = typeof authUser.email === "string" ? authUser.email.trim() : "";
    if (email.length > 0) {
      await ctx.scheduler.runAfter(0, internal.notify.sendBragLive, {
        email,
        spotName: spot.name,
        path: `/nl/${spot.citySlug}/${spot.slug}`,
      });
    }
    return postId;
  },
});

export const replace = mutation({
  args: {
    postId: v.id("posts"),
    storageId: v.id("_storage"),
    mediaType: v.union(v.literal("photo"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    const { post } = await requireOwnedPost(ctx, args.postId);
    if (post.body.kind !== "inApp") {
      throw new ConvexError("Only in-app brags can be replaced");
    }
    if (post.visibility.kind !== "visible") {
      throw new ConvexError("Hidden brags cannot be replaced");
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new ConvexError("Upload missing");
    }

    const previous = post.body.media.storageId;
    const media = parseHostedMedia({
      storageId: args.storageId,
      mediaType: args.mediaType,
      replacedAt: Date.now(),
    });
    await ctx.db.patch(post._id, {
      body: { kind: "inApp", media },
    });
    if (previous !== args.storageId) {
      await ctx.storage.delete(previous);
    }
  },
});

export const remove = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const { post, makerKey } = await requireOwnedPost(ctx, args.postId);
    if (post.body.kind === "inApp") {
      await ctx.storage.delete(post.body.media.storageId);
    }
    await ctx.db.delete(post._id);
    await applyVisiblePosts(ctx, { spotId: post.spotId, makerKey });
  },
});

export const report = mutation({
  args: { postId: v.id("posts"), reason: v.string() },
  handler: async (ctx, args) => {
    await authComponent.getAuthUser(ctx);
    const reason = args.reason.trim();
    if (reason.length === 0 || reason.length > 280) {
      throw new ConvexError("Reason required");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }
    if (post.visibility.kind === "hidden") {
      return;
    }

    const reportId = await ctx.db.insert("reports", {
      target: { kind: "post", postId: post._id },
      reason,
      status: "open",
    });
    await ctx.db.patch(post._id, {
      visibility: {
        kind: "hidden",
        reason: "report",
        reportId,
        at: Date.now(),
      },
    });
    await applyVisiblePosts(ctx, {
      spotId: post.spotId,
      makerKey: post.makerKey,
    });
  },
});

export const mineOnSpot = query({
  args: { spotId: v.id("spots") },
  handler: async (ctx, args): Promise<Id<"posts">[]> => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
      .unique();
    if (!user) {
      return [];
    }

    const makerKey = serializeMakerKey({ kind: "user", userId: user._id });
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_maker_spot", (q) =>
        q.eq("makerKey", makerKey).eq("spotId", args.spotId),
      )
      .collect();
    return posts
      .filter((post) => post.visibility.kind === "visible")
      .map((post) => post._id);
  },
});

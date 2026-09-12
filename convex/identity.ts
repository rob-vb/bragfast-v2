import { v } from "convex/values";
import { query } from "./_generated/server";
import { DomainParseError, parseUserSlug } from "../domain/ids";
import type { PassportData } from "../domain/viewModels";
import { isOwnerEmail } from "../domain/moderation";
import { ownerEmail } from "./model/owner";
import { authComponent } from "./auth";

export const passportBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<PassportData | null> => {
    let slug;
    try {
      slug = parseUserSlug(args.slug);
    } catch (error) {
      if (error instanceof DomainParseError) {
        return null;
      }
      throw error;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_passport_slug", (q) => q.eq("passport.slug", slug))
      .unique();
    if (!user || user.passport === null) {
      return null;
    }

    return {
      slug,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      uniqueSpotCount: 0,
      postsThisWeek: 0,
      spots: [],
      weekPosts: [],
    };
  },
});

export const mine = query({
  args: {},
  handler: async (ctx): Promise<{ slug: string } | null> => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
      .unique();
    if (!user || user.passport === null) {
      return null;
    }
    return { slug: user.passport.slug };
  },
});

export const isOwner = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    return isOwnerEmail(authUser?.email, ownerEmail());
  },
});

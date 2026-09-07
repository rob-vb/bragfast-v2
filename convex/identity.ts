import { v } from "convex/values";
import { query } from "./_generated/server";
import { DomainParseError, parseCitySlug, parseSpotSlug, parseUserSlug } from "../domain/ids";
import { serializeMakerKey } from "../domain/makerKey";
import {
  POSTS_WEEK_MS,
  countPostsThisWeek,
} from "../domain/passport";
import type {
  PassportData,
  PassportSpotCard,
  PassportWeekPost,
} from "../domain/viewModels";
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

    const makerKey = serializeMakerKey({ kind: "user", userId: user._id });
    const now = Date.now();

    const votes = await ctx.db
      .query("makerVotes")
      .withIndex("by_maker", (q) => q.eq("makerKey", makerKey))
      .order("desc")
      .collect();

    const spots: PassportSpotCard[] = [];
    for (const vote of votes) {
      const spot = await ctx.db.get(vote.spotId);
      if (!spot) {
        continue;
      }
      spots.push({
        slug: parseSpotSlug(spot.slug),
        citySlug: parseCitySlug(spot.citySlug),
        name: spot.name,
        latestBragAt: vote.latestVisiblePostAt,
        geo: spot.geo,
        closed: spot.listingStatus === "gravestone",
      });
    }

    const postRows = await ctx.db
      .query("posts")
      .withIndex("by_maker_created", (q) => q.eq("makerKey", makerKey))
      .order("desc")
      .collect();

    const weekPosts: PassportWeekPost[] = [];
    for (const row of postRows) {
      if (row.visibility.kind !== "visible") {
        continue;
      }
      if (row.createdAt < now - POSTS_WEEK_MS) {
        break;
      }
      const spot = await ctx.db.get(row.spotId);
      if (!spot) {
        continue;
      }
      weekPosts.push({
        postId: row._id,
        createdAt: row.createdAt,
        spotSlug: parseSpotSlug(spot.slug),
        citySlug: parseCitySlug(spot.citySlug),
        name: spot.name,
      });
    }

    return {
      slug,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      uniqueSpotCount: spots.length,
      postsThisWeek: countPostsThisWeek(
        weekPosts.map((post) => post.createdAt),
        now,
      ),
      spots,
      weekPosts,
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

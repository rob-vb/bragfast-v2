import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  DomainParseError,
  parseCitySlug,
  parseSpotSlug,
  parseUserSlug,
} from "../domain/ids";
import { listAddedSpots } from "../domain/passport";
import type { PassportData, PassportSpotCard } from "../domain/viewModels";
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

    const rows = await ctx.db.query("spots").collect();
    const added: PassportSpotCard[] = [];
    for (const row of rows) {
      if (row.addedBy !== user._id) {
        continue;
      }
      try {
        added.push({
          slug: parseSpotSlug(row.slug),
          citySlug: parseCitySlug(row.citySlug),
          name: row.name,
          addedAt: row._creationTime,
          geo: row.geo,
          closed: row.listingStatus === "gravestone",
        });
      } catch (error) {
        if (error instanceof DomainParseError) {
          continue;
        }
        throw error;
      }
    }
    const spots = listAddedSpots(added);

    return {
      slug,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      uniqueSpotCount: spots.length,
      spots,
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

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import {
  DomainParseError,
  parseCitySlug,
  parseSpotSlug,
  parseUserSlug,
} from "../domain/ids";
import { listPassportPhotos } from "../domain/passport";
import type {
  PassportData,
  PassportPhoto,
  PassportPhotoSpot,
} from "../domain/viewModels";
import { isOwnerEmail } from "../domain/moderation";
import { ownerEmail } from "./model/owner";
import { authComponent } from "./auth";

export const passportPhotos = query({
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

    const rows = await ctx.db
      .query("photos")
      .withIndex("by_user", (q) => q.eq("uploadedBy", user._id))
      .collect();
    const spots = new Map<Id<"spots">, PassportPhotoSpot | null>();
    const photos: PassportPhoto[] = [];
    for (const row of rows) {
      if (row.hiddenAt !== undefined) {
        continue;
      }
      if (!spots.has(row.spotId)) {
        spots.set(row.spotId, await photoSpot(ctx, row.spotId));
      }
      const spot = spots.get(row.spotId);
      const url = await ctx.storage.getUrl(row.storageId);
      if (!spot || url === null) {
        continue;
      }
      photos.push({
        id: row._id,
        url,
        createdAt: row.createdAt,
        discovery: row.discovery === true,
        spot,
      });
    }

    let discoveredCount = 0;
    for (const spot of await ctx.db.query("spots").collect()) {
      if (spot.addedBy === user._id) {
        discoveredCount += 1;
      }
    }

    return {
      slug,
      discoveredCount,
      photos: listPassportPhotos(photos),
    };
  },
});

async function photoSpot(
  ctx: QueryCtx,
  spotId: Id<"spots">,
): Promise<PassportPhotoSpot | null> {
  const row = await ctx.db.get(spotId);
  if (!row) {
    return null;
  }
  try {
    return {
      slug: parseSpotSlug(row.slug),
      citySlug: parseCitySlug(row.citySlug),
      name: row.name,
      geo: row.geo,
      closed: row.listingStatus === "gravestone",
      likeCount: row.likeCount ?? 0,
    };
  } catch (error) {
    if (error instanceof DomainParseError) {
      return null;
    }
    throw error;
  }
}

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

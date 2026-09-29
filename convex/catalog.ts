import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { NL_CITIES } from "../domain/cities";
import {
  DomainParseError,
  parseCitySlug,
  parseSpotSlug,
  parseUserSlug,
  type UserSlug,
} from "../domain/ids";
import { searchWoonplaatsHits } from "../domain/searchMatch";
import { sortCityBoard } from "../domain/like";
import { parseSpot } from "../domain/spot";
import type {
  CityCard,
  CityPageData,
  CitySpotCard,
  LiveSpotRef,
  SearchHit,
  SpotPageData,
  SpotPagePhoto,
} from "../domain/viewModels";

function cityCard(row: Doc<"cities">): CityCard {
  return {
    slug: parseCitySlug(row.slug),
    nameNl: row.nameNl,
    nameEn: row.nameEn,
  };
}

function gazetteerCity(slug: string): CityCard | null {
  const row = NL_CITIES.find((city) => city.slug === slug);
  if (!row) {
    return null;
  }
  return {
    slug: parseCitySlug(row.slug),
    nameNl: row.nameNl,
    nameEn: row.nameEn,
  };
}

async function listedVisitorSpots(
  ctx: QueryCtx,
  citySlug: string,
): Promise<CitySpotCard[]> {
  const rows = await ctx.db
    .query("spots")
    .withIndex("by_city_slug", (q) => q.eq("citySlug", citySlug))
    .collect();
  const cards: CitySpotCard[] = [];
  for (const row of rows) {
    if (row.listingStatus !== "listed" || row.photoId === undefined) {
      continue;
    }
    const photoUrl = await ctx.storage.getUrl(row.photoId);
    if (!photoUrl) {
      continue;
    }
    cards.push({
      id: row._id,
      slug: parseSpotSlug(row.slug),
      citySlug: parseCitySlug(row.citySlug),
      name: row.name,
      address: row.address,
      hours: row.hours,
      spotType: row.spotType,
      geo: row.geo,
      photoUrl,
      likeCount: row.likeCount ?? 0,
      lastLikedAt: row.lastLikedAt ?? 0,
      addedAt: row._creationTime,
    });
  }
  return sortCityBoard(cards);
}

async function loadCityPage(
  ctx: QueryCtx,
  slug: ReturnType<typeof parseCitySlug>,
): Promise<CityPageData | null> {
  const city = await ctx.db
    .query("cities")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (!city) {
    return null;
  }
  return {
    city: cityCard(city),
    spots: await listedVisitorSpots(ctx, slug),
  };
}

export const searchCatalog = query({
  args: { q: v.string() },
  handler: async (_ctx, { q }): Promise<SearchHit[]> => {
    return searchWoonplaatsHits(q);
  },
});

export const cityPage = query({
  args: { citySlug: v.string() },
  handler: async (ctx, args): Promise<CityPageData | null> => {
    try {
      return await loadCityPage(ctx, parseCitySlug(args.citySlug));
    } catch (error) {
      if (error instanceof DomainParseError) {
        return null;
      }
      throw error;
    }
  },
});

export const listedSpotsByCity = query({
  args: { citySlug: v.string() },
  handler: async (ctx, args): Promise<CitySpotCard[]> => {
    try {
      return await listedVisitorSpots(ctx, parseCitySlug(args.citySlug));
    } catch (error) {
      if (error instanceof DomainParseError) {
        return [];
      }
      throw error;
    }
  },
});

/** The public passport slug, or null for an account without one. */
async function passportSlug(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<UserSlug | null> {
  const user = await ctx.db.get(userId);
  if (!user?.passport) {
    return null;
  }
  try {
    return parseUserSlug(user.passport.slug);
  } catch (error) {
    if (error instanceof DomainParseError) {
      return null;
    }
    throw error;
  }
}

export const spotPage = query({
  args: { citySlug: v.string(), spotSlug: v.string() },
  handler: async (ctx, args): Promise<SpotPageData | null> => {
    let citySlug;
    let spotSlug;
    try {
      citySlug = parseCitySlug(args.citySlug);
      spotSlug = parseSpotSlug(args.spotSlug);
    } catch (error) {
      if (error instanceof DomainParseError) {
        return null;
      }
      throw error;
    }
    const row = await ctx.db
      .query("spots")
      .withIndex("by_city_slug", (q) =>
        q.eq("citySlug", citySlug).eq("slug", spotSlug),
      )
      .unique();
    if (!row || row.listingStatus !== "listed") {
      return null;
    }
    const city = gazetteerCity(citySlug);
    if (!city) {
      return null;
    }
    const photoUrl = row.photoId
      ? await ctx.storage.getUrl(row.photoId)
      : null;
    const passports = new Map<Id<"users">, UserSlug | null>();
    const passportOf = async (
      userId: Id<"users"> | undefined,
    ): Promise<UserSlug | null> => {
      if (userId === undefined) {
        return null;
      }
      if (!passports.has(userId)) {
        passports.set(userId, await passportSlug(ctx, userId));
      }
      return passports.get(userId) ?? null;
    };
    const photoRows = await ctx.db
      .query("photos")
      .withIndex("by_spot_created", (q) => q.eq("spotId", row._id))
      .collect();
    photoRows.sort((a, b) => a.createdAt - b.createdAt);
    const photos: SpotPagePhoto[] = [];
    for (const photo of photoRows) {
      const url = await ctx.storage.getUrl(photo.storageId);
      if (!url) {
        continue;
      }
      photos.push({
        id: photo._id,
        url,
        uploadedBy: photo.uploadedBy,
        uploaderSlug: await passportOf(photo.uploadedBy),
        createdAt: photo.createdAt,
      });
    }
    const spot = parseSpot(row);
    return {
      id: spot.id,
      name: spot.name,
      address: spot.address,
      city,
      slug: spot.slug,
      geo: spot.geo,
      hours: spot.hours,
      spotType: spot.spotType,
      lifecycle: spot.lifecycle,
      licensedImage: photoUrl ? { url: photoUrl } : null,
      photos,
      canonicalPath: `/nl/${city.slug}/${spot.slug}`,
      likeCount: row.likeCount ?? 0,
      adderSlug: await passportOf(row.addedBy),
      addedAt: row._creationTime,
    };
  },
});

/** Every spot live on a board, for the sitemap, `llms.txt` and the woonplaats index. */
export const liveSpots = query({
  args: {},
  handler: async (ctx): Promise<LiveSpotRef[]> => {
    const rows = await ctx.db.query("spots").collect();
    const live: LiveSpotRef[] = [];
    for (const row of rows) {
      if (row.listingStatus !== "listed" || row.photoId === undefined) {
        continue;
      }
      try {
        live.push({
          citySlug: parseCitySlug(row.citySlug),
          slug: parseSpotSlug(row.slug),
          name: row.name,
          likeCount: row.likeCount ?? 0,
          lastLikedAt: row.lastLikedAt ?? 0,
          addedAt: row._creationTime,
        });
      } catch (error) {
        if (!(error instanceof DomainParseError)) {
          throw error;
        }
      }
    }
    return live;
  },
});

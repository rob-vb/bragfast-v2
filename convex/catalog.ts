import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { NL_CITIES } from "../domain/cities";
import { cityCentroid, nearestCity } from "../domain/geo";
import { DomainParseError, parseCitySlug, parseSpotSlug } from "../domain/ids";
import { searchWoonplaatsHits } from "../domain/searchMatch";
import { sortCityBoard } from "../domain/like";
import { parseSpot } from "../domain/spot";
import type {
  CityCard,
  CityPageData,
  CitySpotCard,
  HomepageData,
  NearbyData,
  SearchHit,
  SitemapEntry,
  SpotPageData,
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

export const homepage = query({
  args: {},
  handler: async (ctx): Promise<HomepageData> => {
    const rows = await ctx.db.query("cities").withIndex("by_featured").collect();
    const featured = rows
      .filter((row) => row.featuredOrder !== undefined)
      .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
      .map((row) => ({ ...cityCard(row), boardCount: 0 }));
    return { featured };
  },
});

export const nearby = query({
  args: { lat: v.number(), lng: v.number() },
  handler: async (ctx, { lat, lng }): Promise<NearbyData> => {
    const origin = { lat, lng };
    const cityRows = await ctx.db.query("cities").collect();
    const citiesWithCentroid = [];
    for (const row of cityRows) {
      const geo = cityCentroid(row.slug);
      if (!geo) {
        continue;
      }
      citiesWithCentroid.push({
        slug: parseCitySlug(row.slug),
        geo,
        nameNl: row.nameNl,
        nameEn: row.nameEn,
      });
    }
    const nearest = nearestCity(origin, citiesWithCentroid);
    return {
      nearestCity: nearest
        ? {
            slug: nearest.slug,
            nameNl: nearest.nameNl,
            nameEn: nearest.nameEn,
          }
        : null,
      spots: [],
    };
  },
});

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
      canonicalPath: `/nl/${city.slug}/${spot.slug}`,
      likeCount: row.likeCount ?? 0,
    };
  },
});

export const sitemapEntries = query({
  args: {},
  handler: async (ctx): Promise<SitemapEntry[]> => {
    const cities = await ctx.db.query("cities").collect();
    return [
      { path: "/" },
      ...cities.map((city) => ({ path: `/nl/${city.slug}` })),
    ];
  },
});

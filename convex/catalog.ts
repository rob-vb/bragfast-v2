import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { cityCentroid, nearestCity } from "../domain/geo";
import { DomainParseError, parseCitySlug } from "../domain/ids";
import { searchWoonplaatsHits } from "../domain/searchMatch";
import type {
  CityCard,
  CityPageData,
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
  return { city: cityCard(city), spots: [] };
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

export const spotPage = query({
  args: { citySlug: v.string(), spotSlug: v.string() },
  handler: async (): Promise<SpotPageData | null> => {
    return null;
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

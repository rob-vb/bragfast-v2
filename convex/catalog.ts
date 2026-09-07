import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  cityCentroid,
  haversineMeters,
  nearestCity,
  sortByDistance,
} from "../domain/geo";
import { DomainParseError, parseCitySlug, parseSpotSlug } from "../domain/ids";
import { serializeMakerKey } from "../domain/makerKey";
import type { MakerKey } from "../domain/makerKey";
import {
  parsePost,
  requireVisiblePost,
  createLicensedImage,
  type PostDoc,
} from "../domain/post";
import { parseSpot, type Spot, type SpotDoc } from "../domain/spot";
import { boardComparator, standingAsOf } from "../domain/ranking";
import type {
  CityCard,
  CityPageData,
  FeedItem,
  HomepageData,
  NearbyData,
  NearbySpotCard,
  RankedSpotCard,
  SearchHit,
  SeedSpotCard,
  SitemapEntry,
  SpotPageData,
} from "../domain/viewModels";

function asSpotDoc(row: Doc<"spots">): SpotDoc {
  return {
    _id: row._id,
    placeId: row.placeId,
    slug: row.slug,
    citySlug: row.citySlug,
    country: row.country,
    name: row.name,
    address: row.address,
    geo: row.geo,
    hours: row.hours,
    spotType: row.spotType,
    listingStatus: row.listingStatus,
    boardScore: row.boardScore,
    latestBragAt: row.latestBragAt,
    windowExpiresAt: row.windowExpiresAt,
    closedAt: row.closedAt,
    allTimeMakers: row.allTimeMakers,
  };
}

function asPostDoc(row: Doc<"posts">): PostDoc {
  return {
    _id: row._id,
    spotId: row.spotId,
    makerKey: row.makerKey,
    createdAt: row.createdAt,
    visibility: row.visibility,
    body: row.body,
  };
}

function cityCard(row: Doc<"cities">): CityCard {
  return {
    slug: parseCitySlug(row.slug),
    nameNl: row.nameNl,
    nameEn: row.nameEn,
  };
}

async function displayMaker(
  ctx: QueryCtx,
  maker: MakerKey,
): Promise<string> {
  if (maker.kind === "ig") {
    return "Instagram";
  }
  const user = await ctx.db.get(maker.userId);
  return user?.displayName ?? "Maker";
}

async function storageIsPlaceholder(
  ctx: QueryCtx,
  storageId: Id<"_storage">,
): Promise<boolean> {
  const meta = await ctx.db.system.get("_storage", storageId);
  return (meta?.size ?? 0) < 512;
}

function listedAsOfNow(spot: Spot): Spot {
  if (spot.lifecycle.kind !== "listed") {
    return spot;
  }
  return {
    ...spot,
    lifecycle: {
      kind: "listed",
      standing: standingAsOf(spot.lifecycle.standing, Date.now()),
    },
  };
}

function rankedCard(spot: Spot, rank: number): RankedSpotCard {
  return {
    slug: spot.slug,
    citySlug: spot.citySlug,
    name: spot.name,
    rank,
    score:
      spot.lifecycle.kind === "listed" && spot.lifecycle.standing
        ? spot.lifecycle.standing.score
        : 0,
    hours: spot.hours,
    spotType: spot.spotType,
    geo: spot.geo,
    address: spot.address,
  };
}

function seedCard(spot: Spot): SeedSpotCard {
  return {
    slug: spot.slug,
    citySlug: spot.citySlug,
    name: spot.name,
    address: spot.address,
    hours: spot.hours,
    spotType: spot.spotType,
    geo: spot.geo,
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

  const rows = await ctx.db
    .query("spots")
    .withIndex("by_city_slug", (q) => q.eq("citySlug", slug))
    .collect();

  const listed = rows
    .map((row) => listedAsOfNow(parseSpot(asSpotDoc(row))))
    .filter((spot) => spot.lifecycle.kind === "listed");

  const board = listed
    .filter(
      (spot) => spot.lifecycle.kind === "listed" && spot.lifecycle.standing !== null,
    )
    .sort((a, b) => {
      if (a.lifecycle.kind !== "listed" || b.lifecycle.kind !== "listed") {
        return 0;
      }
      if (!a.lifecycle.standing || !b.lifecycle.standing) {
        return 0;
      }
      return boardComparator(a.lifecycle.standing, b.lifecycle.standing);
    })
    .map((spot, index) => rankedCard(spot, index + 1));

  const tail = listed
    .filter(
      (spot) => spot.lifecycle.kind === "listed" && spot.lifecycle.standing === null,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "nl"))
    .map(seedCard);

  return { city: cityCard(city), board, tail };
}

export const homepage = query({
  args: {},
  handler: async (ctx): Promise<HomepageData> => {
    const [rows, spots] = await Promise.all([
      ctx.db.query("cities").withIndex("by_featured").collect(),
      ctx.db.query("spots").collect(),
    ]);
    const boardCountByCity = new Map<string, number>();
    for (const spot of spots) {
      if (spot.listingStatus !== "listed" || spot.boardScore === undefined) {
        continue;
      }
      boardCountByCity.set(
        spot.citySlug,
        (boardCountByCity.get(spot.citySlug) ?? 0) + 1,
      );
    }
    const citiesWithMakers = new Set(boardCountByCity.keys());
    const featured = rows
      .filter((row) => row.featuredOrder !== undefined)
      .sort((a, b) => {
        const aMakers = citiesWithMakers.has(a.slug) ? 0 : 1;
        const bMakers = citiesWithMakers.has(b.slug) ? 0 : 1;
        if (aMakers !== bMakers) {
          return aMakers - bMakers;
        }
        return (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0);
      })
      .map((row) => ({
        ...cityCard(row),
        boardCount: boardCountByCity.get(row.slug) ?? 0,
      }));
    return { featured };
  },
});

export const nearby = query({
  args: { lat: v.number(), lng: v.number() },
  handler: async (ctx, { lat, lng }): Promise<NearbyData> => {
    const origin = { lat, lng };
    const [cityRows, spotRows] = await Promise.all([
      ctx.db.query("cities").collect(),
      ctx.db.query("spots").collect(),
    ]);
    const citiesBySlug = new Map(cityRows.map((row) => [row.slug, row]));

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

    const listed = spotRows.filter((row) => row.listingStatus === "listed");
    const closest = sortByDistance(origin, listed).slice(0, 8);
    const spots: NearbySpotCard[] = [];
    for (const row of closest) {
      const city = citiesBySlug.get(row.citySlug);
      if (!city) {
        continue;
      }
      spots.push({
        slug: parseSpotSlug(row.slug),
        citySlug: parseCitySlug(row.citySlug),
        name: row.name,
        address: row.address,
        geo: row.geo,
        meters: haversineMeters(origin, row.geo),
        cityNameNl: city.nameNl,
        cityNameEn: city.nameEn,
      });
    }

    return {
      nearestCity: nearest
        ? {
            slug: nearest.slug,
            nameNl: nearest.nameNl,
            nameEn: nearest.nameEn,
          }
        : null,
      spots,
    };
  },
});

export const searchCatalog = query({
  args: { q: v.string() },
  handler: async (ctx, { q }): Promise<SearchHit[]> => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) {
      return [];
    }

    const cityRows = await ctx.db.query("cities").collect();
    const citiesBySlug = new Map(cityRows.map((row) => [row.slug, row]));

    const spotRows = await ctx.db
      .query("spots")
      .withSearchIndex("search_name", (search) =>
        search.search("name", q.trim()).eq("country", "nl"),
      )
      .take(20);

    const listed = await ctx.db.query("spots").collect();
    const byId = new Map(spotRows.map((row) => [row._id, row]));
    for (const row of listed) {
      if (
        row.listingStatus === "listed" &&
        row.name.toLowerCase().includes(needle) &&
        !byId.has(row._id)
      ) {
        byId.set(row._id, row);
      }
    }

    const spots: SearchHit[] = [];
    for (const row of byId.values()) {
      if (row.listingStatus !== "listed") {
        continue;
      }
      const city = citiesBySlug.get(row.citySlug);
      if (!city) {
        continue;
      }
      spots.push({
        kind: "spot",
        name: row.name,
        slug: parseSpotSlug(row.slug),
        citySlug: parseCitySlug(row.citySlug),
        cityNameNl: city.nameNl,
        cityNameEn: city.nameEn,
      });
    }

    const cities: SearchHit[] = cityRows
      .filter(
        (row) =>
          row.slug.includes(needle) ||
          row.nameNl.toLowerCase().includes(needle) ||
          row.nameEn.toLowerCase().includes(needle),
      )
      .map((row) => ({
        kind: "city" as const,
        slug: parseCitySlug(row.slug),
        nameNl: row.nameNl,
        nameEn: row.nameEn,
      }));

    return [...spots, ...cities];
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

    const city = await ctx.db
      .query("cities")
      .withIndex("by_slug", (q) => q.eq("slug", citySlug))
      .unique();
    if (!city) {
      return null;
    }

    const row = await ctx.db
      .query("spots")
      .withIndex("by_city_slug", (q) =>
        q.eq("citySlug", citySlug).eq("slug", spotSlug),
      )
      .unique();
    if (!row) {
      return null;
    }

    const spot = parseSpot(asSpotDoc(row));
    const cityData = await loadCityPage(ctx, citySlug);
    const ranked = cityData?.board.find((card) => card.slug === spot.slug);

    const postRows = await ctx.db
      .query("posts")
      .withIndex("by_spot_created", (q) => q.eq("spotId", spot.id))
      .order("desc")
      .take(40);

    const feed: FeedItem[] = [];
    for (const postRow of postRows) {
      const post = parsePost(asPostDoc(postRow));
      if (post.visibility.kind !== "visible") {
        continue;
      }
      const visible = requireVisiblePost(post);
      const makerName = await displayMaker(ctx, visible.maker);
      if (visible.kind === "social") {
        feed.push({
          postId: visible.id,
          createdAt: visible.createdAt,
          makerName,
          media: { kind: "embed", embed: visible.embed },
        });
        continue;
      }
      const url = await ctx.storage.getUrl(visible.media.storageId);
      if (!url) {
        continue;
      }
      feed.push({
        postId: visible.id,
        createdAt: visible.createdAt,
        makerName,
        media: {
          kind: "hosted",
          url,
          mediaType: visible.media.mediaType,
          placeholder: await storageIsPlaceholder(ctx, visible.media.storageId),
        },
      });
    }

    const licensedImage =
      feed
        .map((item) =>
          createLicensedImage(
            item.media.kind === "hosted"
              ? {
                  kind: "hosted",
                  url: item.media.url,
                  mediaType: item.media.mediaType,
                }
              : item.media,
          ),
        )
        .find((image) => image !== null) ?? null;

    return {
      id: spot.id,
      name: spot.name,
      address: spot.address,
      city: cityCard(city),
      slug: spot.slug,
      geo: spot.geo,
      hours: spot.hours,
      spotType: spot.spotType,
      lifecycle: spot.lifecycle,
      rankInCity: ranked?.rank ?? null,
      allTimeMakers: spot.allTimeMakers,
      feed,
      licensedImage,
      canonicalPath: `/nl/${spot.citySlug}/${spot.slug}`,
    };
  },
});

export const sitemapEntries = query({
  args: {},
  handler: async (ctx): Promise<SitemapEntry[]> => {
    const cities = await ctx.db.query("cities").collect();
    const spots = await ctx.db.query("spots").collect();
    const users = await ctx.db.query("users").collect();
    const passports: SitemapEntry[] = [];
    for (const user of users) {
      if (!user.passport) {
        continue;
      }
      const makerKey = serializeMakerKey({ kind: "user", userId: user._id });
      const vote = await ctx.db
        .query("makerVotes")
        .withIndex("by_maker", (q) => q.eq("makerKey", makerKey))
        .first();
      if (!vote) {
        continue;
      }
      passports.push({ path: `/nl/u/${user.passport.slug}` });
    }
    return [
      { path: "/" },
      ...cities.map((city) => ({ path: `/nl/${city.slug}` })),
      ...spots.map((spot) => ({ path: `/nl/${spot.citySlug}/${spot.slug}` })),
      ...passports,
    ];
  },
});

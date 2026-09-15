import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NL_CITIES } from "@/domain/cities";
import { isMissingConvexFunction } from "@/domain/convexQuery";
import { parseCitySlug } from "@/domain/ids";
import { sortCityBoard } from "@/domain/like";
import { boardFromListedSpots, type WoonplaatsBoard } from "@/domain/board";
import { planAppStores, planLocalFavorites } from "@/domain/homepage";
import { assignPlaceSlug } from "@/domain/woonplaatsen";
import type {
  CitySpotCard,
  HomepageData,
  LeaderboardData,
  PassportData,
  SitemapEntry,
  SpotPageData,
} from "@/domain/viewModels";
import { lookupGeoPoint, type GeoPointLookup } from "@/lib/geoip";

export function publicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://brag.fast";
}

export async function loadHomepage(
  ip: string | null,
  lookup: GeoPointLookup = lookupGeoPoint,
): Promise<HomepageData> {
  const stores = planAppStores({
    ios: process.env.IOS_APP_STORE_URL,
    android: process.env.ANDROID_PLAY_STORE_URL,
  });
  const omitted: HomepageData = {
    localFavorites: { kind: "omit" },
    stores,
  };
  if (ip === null) {
    return omitted;
  }
  const point = await lookup(ip);
  if (point === null) {
    return omitted;
  }
  const slug = assignPlaceSlug(point);
  if (slug === null) {
    return omitted;
  }
  const board = await loadCityPage(slug);
  if (!board || board.kind === "empty") {
    return omitted;
  }
  return {
    localFavorites: planLocalFavorites(board.city, board.spots),
    stores,
  };
}

export async function loadCityPage(
  citySlug: string,
): Promise<WoonplaatsBoard | null> {
  const gazetteer = NL_CITIES.find((row) => row.slug === citySlug);
  if (!gazetteer) {
    return null;
  }
  let spots: CitySpotCard[] = [];
  try {
    spots = sortCityBoard(
      (await fetchQuery(api.catalog.listedSpotsByCity, { citySlug })).map(
        (spot) => ({
          ...spot,
          likeCount: spot.likeCount ?? 0,
          lastLikedAt: spot.lastLikedAt ?? 0,
          addedAt: spot.addedAt ?? 0,
        }),
      ),
    );
  } catch (error) {
    if (!isMissingConvexFunction(error)) {
      throw error;
    }
    spots = [];
  }
  return boardFromListedSpots(
    {
      slug: parseCitySlug(gazetteer.slug),
      nameNl: gazetteer.nameNl,
      nameEn: gazetteer.nameEn,
    },
    spots,
  );
}

export async function loadSpotPage(
  citySlug: string,
  spotSlug: string,
): Promise<SpotPageData | null> {
  try {
    const page = await fetchQuery(api.catalog.spotPage, { citySlug, spotSlug });
    if (!page) {
      return null;
    }
    return { ...page, likeCount: page.likeCount ?? 0, photos: page.photos ?? [] };
  } catch (error) {
    if (!isMissingConvexFunction(error)) {
      throw error;
    }
    return null;
  }
}

export async function loadSitemap(): Promise<SitemapEntry[]> {
  return [
    { path: "/" },
    { path: "/nl/leaderboard" },
    ...NL_CITIES.map((city) => ({ path: `/nl/${city.slug}` })),
  ];
}

export async function loadLeaderboard(): Promise<LeaderboardData> {
  try {
    return { adders: await fetchQuery(api.leaderboard.rankedAdders, {}) };
  } catch (error) {
    if (!isMissingConvexFunction(error)) {
      throw error;
    }
    return { adders: [] };
  }
}

export async function loadPassport(slug: string): Promise<PassportData | null> {
  try {
    return await fetchQuery(api.identity.passportBySlug, { slug });
  } catch (error) {
    if (!isMissingConvexFunction(error)) {
      throw error;
    }
    return null;
  }
}

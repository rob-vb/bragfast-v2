import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NL_CITIES } from "@/domain/cities";
import { isMissingConvexFunction } from "@/domain/convexQuery";
import { parseCitySlug } from "@/domain/ids";
import { sortCityBoard } from "@/domain/like";
import { boardFromListedSpots, type WoonplaatsBoard } from "@/domain/board";
import { planAppStores, planLocalFavorites } from "@/domain/homepage";
import { boardIndex, llmsTxt, planSitemap } from "@/domain/seo";
import { standingOf } from "@/domain/leaderboard";
import { assignPlaceSlug } from "@/domain/woonplaatsen";
import type {
  AppStores,
  BoardIndexEntry,
  CitySpotCard,
  HomepageData,
  LeaderboardData,
  LiveSpotRef,
  PassportData,
  PassportPageData,
  SitemapEntry,
  SpotPageData,
} from "@/domain/viewModels";
import { lookupGeoPoint, type GeoPointLookup } from "@/lib/geoip";

export function publicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://brag.fast";
}

export function loadAppStores(): AppStores {
  return planAppStores({
    ios: process.env.IOS_APP_STORE_URL,
    android: process.env.ANDROID_PLAY_STORE_URL,
  });
}

export async function loadHomepage(
  ip: string | null,
  lookup: GeoPointLookup = lookupGeoPoint,
): Promise<HomepageData> {
  const stores = loadAppStores();
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
    // Tolerate a Convex deployment that predates a field
    return {
      ...page,
      likeCount: page.likeCount ?? 0,
      photos: (page.photos ?? []).map((photo) => ({
        ...photo,
        uploaderSlug: photo.uploaderSlug ?? null,
      })),
      adderSlug: page.adderSlug ?? null,
      addedAt: page.addedAt ?? 0,
    };
  } catch (error) {
    if (!isMissingConvexFunction(error)) {
      throw error;
    }
    return null;
  }
}

async function loadLiveSpots(): Promise<LiveSpotRef[]> {
  try {
    // Tolerate a Convex deployment that predates the name and like fields
    return (await fetchQuery(api.catalog.liveSpots, {})).map((spot) => ({
      ...spot,
      name: spot.name ?? spot.slug,
      likeCount: spot.likeCount ?? 0,
      lastLikedAt: spot.lastLikedAt ?? 0,
      addedAt: spot.addedAt ?? 0,
    }));
  } catch (error) {
    if (!isMissingConvexFunction(error)) {
      throw error;
    }
    return [];
  }
}

export async function loadSitemap(): Promise<SitemapEntry[]> {
  return planSitemap(await loadLiveSpots());
}

export async function loadLlmsTxt(): Promise<string> {
  return llmsTxt(publicSiteUrl(), await loadLiveSpots());
}

export async function loadBoardIndex(): Promise<BoardIndexEntry[]> {
  return boardIndex(await loadLiveSpots());
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
    return await fetchQuery(api.identity.passportPhotos, { slug });
  } catch (error) {
    if (!isMissingConvexFunction(error)) {
      throw error;
    }
    return null;
  }
}

/** The passport with the account's standing on the leaderboard. */
export async function loadPassportPage(
  slug: string,
): Promise<PassportPageData | null> {
  const [passport, { adders }] = await Promise.all([
    loadPassport(slug),
    loadLeaderboard(),
  ]);
  if (!passport) {
    return null;
  }
  return { ...passport, standing: standingOf(adders, passport.slug) };
}

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NL_CITIES } from "@/domain/cities";
import { isMissingConvexFunction } from "@/domain/convexQuery";
import { parseCitySlug } from "@/domain/ids";
import { sortCityBoard } from "@/domain/like";
import { searchWoonplaatsHits } from "@/domain/searchMatch";
import type {
  CityPageData,
  HomepageData,
  LeaderboardData,
  PassportData,
  SearchHit,
  SitemapEntry,
  SpotPageData,
} from "@/domain/viewModels";

export function publicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://77.42.31.66";
}

export async function loadHomepage(): Promise<HomepageData> {
  const featured = NL_CITIES.filter((city) => city.featuredOrder !== undefined)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
    .map((city) => ({
      slug: parseCitySlug(city.slug),
      nameNl: city.nameNl,
      nameEn: city.nameEn,
      boardCount: 0,
    }));
  return { featured };
}

export async function loadSearch(q: string): Promise<SearchHit[]> {
  return searchWoonplaatsHits(q);
}

export async function loadCityPage(citySlug: string): Promise<CityPageData | null> {
  const gazetteer = NL_CITIES.find((row) => row.slug === citySlug);
  if (!gazetteer) {
    return null;
  }
  let spots: CityPageData["spots"] = [];
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
  return {
    city: {
      slug: parseCitySlug(gazetteer.slug),
      nameNl: gazetteer.nameNl,
      nameEn: gazetteer.nameEn,
    },
    spots,
  };
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
    return { ...page, likeCount: page.likeCount ?? 0 };
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

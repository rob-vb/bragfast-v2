import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NL_CITIES } from "@/domain/cities";
import { parseCitySlug } from "@/domain/ids";
import { searchWoonplaatsHits } from "@/domain/searchMatch";
import type {
  CityPageData,
  HomepageData,
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
    spots = await fetchQuery(api.catalog.listedSpotsByCity, { citySlug });
  } catch {
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
    return await fetchQuery(api.catalog.spotPage, { citySlug, spotSlug });
  } catch {
    return null;
  }
}

export async function loadSitemap(): Promise<SitemapEntry[]> {
  return [
    { path: "/" },
    ...NL_CITIES.map((city) => ({ path: `/nl/${city.slug}` })),
  ];
}

export async function loadPassport(slug: string): Promise<PassportData | null> {
  const page = await fetchQuery(api.identity.passportBySlug, { slug });
  if (!page) {
    return null;
  }
  return {
    ...page,
    uniqueSpotCount: 0,
    postsThisWeek: 0,
    spots: [],
    weekPosts: [],
  };
}

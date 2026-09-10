import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NL_CITIES } from "@/domain/cities";
import { parseCitySlug } from "@/domain/ids";
import { searchWoonplaatsHits } from "@/domain/searchMatch";
import type { CityPageData, SearchHit } from "@/domain/viewModels";

export function publicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://77.42.31.66";
}

export const loadHomepage = () => fetchQuery(api.catalog.homepage, {});

export async function loadSearch(q: string): Promise<SearchHit[]> {
  const convexHits = await fetchQuery(api.catalog.searchCatalog, { q });
  const spots = convexHits.filter((hit) => hit.kind === "spot");
  return [...spots, ...searchWoonplaatsHits(q)];
}

export async function loadCityPage(citySlug: string): Promise<CityPageData | null> {
  const gazetteer = NL_CITIES.find((row) => row.slug === citySlug);
  if (!gazetteer) {
    return null;
  }
  const page = await fetchQuery(api.catalog.cityPage, { citySlug });
  if (page) {
    return page;
  }
  return {
    city: {
      slug: parseCitySlug(gazetteer.slug),
      nameNl: gazetteer.nameNl,
      nameEn: gazetteer.nameEn,
    },
    spots: [],
  };
}

export const loadSpotPage = (citySlug: string, spotSlug: string) =>
  fetchQuery(api.catalog.spotPage, { citySlug, spotSlug });

export const loadSitemap = () => fetchQuery(api.catalog.sitemapEntries, {});

export const loadPassport = (slug: string) =>
  fetchQuery(api.identity.passportBySlug, { slug });

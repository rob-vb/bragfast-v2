import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export function publicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://77.42.31.66";
}

export const loadHomepage = () => fetchQuery(api.catalog.homepage, {});
export const loadSearch = (q: string) => fetchQuery(api.catalog.searchCatalog, { q });
export const loadCityPage = (citySlug: string) =>
  fetchQuery(api.catalog.cityPage, { citySlug });
export const loadSpotPage = (citySlug: string, spotSlug: string) =>
  fetchQuery(api.catalog.spotPage, { citySlug, spotSlug });
export const loadSitemap = () => fetchQuery(api.catalog.sitemapEntries, {});
export const loadPassport = (slug: string) =>
  fetchQuery(api.identity.passportBySlug, { slug });

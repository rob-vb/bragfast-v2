import type { MetadataRoute } from "next";
import { loadSitemap, publicSiteUrl } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteUrl();
  return (await loadSitemap()).map(({ path }) => ({
    url: `${origin}${path}`,
    changeFrequency: "daily" as const,
  }));
}

import type { MetadataRoute } from "next";
import { loadSitemap, publicSiteUrl } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await loadSitemap();
  const origin = publicSiteUrl();
  return entries.map((entry) => ({
    url: `${origin}${entry.path}`,
    changeFrequency: "daily",
  }));
}

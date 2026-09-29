import type { MetadataRoute } from "next";
import { loadSitemap, publicSiteUrl } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteUrl();
  return (await loadSitemap()).map(({ path, lastModified }) => ({
    url: `${origin}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    changeFrequency: "daily" as const,
  }));
}

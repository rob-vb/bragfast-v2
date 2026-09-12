import type { MetadataRoute } from "next";
import { NL_CITIES } from "@/domain/cities";
import { publicSiteUrl } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteUrl();
  const paths = ["/", ...NL_CITIES.map((city) => `/nl/${city.slug}`)];
  return paths.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "daily" as const,
  }));
}

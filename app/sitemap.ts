import type { MetadataRoute } from "next";
import { NL_CITIES } from "@/domain/cities";
import { loadSitemap, publicSiteUrl } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const convexEntries = await loadSitemap();
  const origin = publicSiteUrl();
  const woonplaatsPaths = NL_CITIES.map((city) => `/nl/${city.slug}`);
  const rest = convexEntries.filter((entry) => {
    if (entry.path === "/") {
      return true;
    }
    if (entry.path.startsWith("/nl/u/")) {
      return true;
    }
    const parts = entry.path.split("/");
    return parts.length === 4 && parts[1] === "nl";
  });
  const seen = new Set<string>(["/", ...woonplaatsPaths]);
  const paths = ["/", ...woonplaatsPaths];
  for (const entry of rest) {
    if (!seen.has(entry.path)) {
      seen.add(entry.path);
      paths.push(entry.path);
    }
  }
  return paths.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "daily" as const,
  }));
}

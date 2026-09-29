import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/catalog";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${publicSiteUrl()}/sitemap.xml`,
  };
}

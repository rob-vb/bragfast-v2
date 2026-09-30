import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // scripts/deploy.sh serves a copied release dir while the next build writes .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["geoip-lite"],
  async redirects() {
    // Profiles left the country prefix: people post photos on holiday too
    return [{ source: "/nl/u/:slug", destination: "/u/:slug", permanent: true }];
  },
};

export default nextConfig;

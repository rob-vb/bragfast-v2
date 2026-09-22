import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // scripts/deploy.sh serves a copied release dir while the next build writes .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["geoip-lite"],
};

export default nextConfig;

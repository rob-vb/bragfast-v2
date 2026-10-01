import type { NextConfig } from "next";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");

const nextConfig: NextConfig = {
  // scripts/deploy.sh serves a copied release dir while the next build writes .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["geoip-lite"],
  images: {
    // Only our own deployment's photos, so the optimizer is no open proxy
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(convexUrl).hostname,
        pathname: "/api/storage/**",
        search: "",
      },
    ],
  },
  async redirects() {
    // Profiles left the country prefix: people post photos on holiday too
    return [
      { source: "/nl/u/:slug", destination: "/u/:slug", permanent: true },
      // Data deletion joined the privacy statement; old store and app links land on it
      {
        source: "/privacy/data-deletion",
        destination: "/privacy#delete-account",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

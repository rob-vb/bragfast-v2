"use client";

import dynamic from "next/dynamic";

export const CityMap = dynamic(
  () => import("@/components/city-map").then((mod) => mod.CityMap),
  { ssr: false },
);

import type { GenericId } from "convex/values";
import type { CitySlug, SpotSlug, UserSlug } from "./ids";
import type { AdderRow } from "./leaderboard";
import type { OpeningHours, SpotLifecycle, SpotType } from "./spot";

export type CitySpotCard = {
  id: GenericId<"spots">;
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  address: string;
  hours: OpeningHours | null;
  spotType: SpotType;
  geo: { lat: number; lng: number };
  photoUrl: string;
  likeCount: number;
  lastLikedAt: number;
  addedAt: number;
};

export type CityCard = {
  slug: CitySlug;
  nameNl: string;
  nameEn: string;
  boardCount?: number;
};

export type CityPageData = {
  city: CityCard;
  spots: CitySpotCard[];
};

export type SpotPageData = {
  id: GenericId<"spots">;
  name: string;
  address: string;
  city: CityCard;
  slug: SpotSlug;
  geo: { lat: number; lng: number };
  hours: OpeningHours | null;
  spotType: SpotType;
  lifecycle: SpotLifecycle;
  licensedImage: { url: string } | null;
  canonicalPath: string;
  likeCount: number;
};

export type SearchHit =
  | {
      kind: "spot";
      name: string;
      slug: SpotSlug;
      citySlug: CitySlug;
      cityNameNl: string;
      cityNameEn: string;
    }
  | {
      kind: "city";
      slug: CitySlug;
      nameNl: string;
      nameEn: string;
    };

export type HomepageData = {
  featured: CityCard[];
};

export type NearbySpotCard = {
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  meters: number;
  cityNameNl: string;
  cityNameEn: string;
};

export type NearbyData = {
  nearestCity: CityCard | null;
  spots: NearbySpotCard[];
};

export type AdminReportRow = {
  reportId: GenericId<"reports">;
  reason: string;
  spotName: string;
  spotPath: string;
};

export type AdminSpotRow = {
  spotId: GenericId<"spots">;
  name: string;
  citySlug: CitySlug;
  slug: SpotSlug;
  listingStatus: "listed" | "gravestone";
};

export type SitemapEntry = {
  path: string;
};

export type PassportSpotCard = {
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  addedAt: number;
  geo: { lat: number; lng: number };
  closed: boolean;
};

export type PassportData = {
  slug: UserSlug;
  displayName: string;
  avatarUrl: string | null;
  uniqueSpotCount: number;
  spots: PassportSpotCard[];
};

export type LeaderboardData = {
  adders: AdderRow[];
};

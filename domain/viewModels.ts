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

export type SpotPagePhoto = {
  id: GenericId<"photos">;
  url: string;
  uploadedBy: GenericId<"users">;
  createdAt: number;
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
  photos: SpotPagePhoto[];
  canonicalPath: string;
  likeCount: number;
};

export type SearchHit = {
  kind: "city";
  slug: CitySlug;
  nameNl: string;
  nameEn: string;
};

export type StoreButton =
  | { kind: "live"; href: string }
  | { kind: "comingSoon" };

export type AppStores = {
  ios: StoreButton;
  android: StoreButton;
};

export type LocalFavoriteCard = {
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  photoUrl: string;
  likeCount: number;
};

export type LocalFavorites =
  | { kind: "omit" }
  | {
      kind: "board";
      city: CityCard;
      spots: readonly [
        LocalFavoriteCard,
        LocalFavoriteCard,
        LocalFavoriteCard,
        ...LocalFavoriteCard[],
      ];
    };

export type HomepageData = {
  localFavorites: LocalFavorites;
  stores: AppStores;
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
  photoUrl: string | null;
};

export type PassportData = {
  slug: UserSlug;
  uniqueSpotCount: number;
  spots: PassportSpotCard[];
};

export type LeaderboardData = {
  adders: AdderRow[];
};

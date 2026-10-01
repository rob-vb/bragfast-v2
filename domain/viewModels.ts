import type { GenericId } from "convex/values";
import type { CitySlug, SpotSlug, UserSlug } from "./ids";
import type { AdderRow, LeaderboardStanding } from "./leaderboard";
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
  /** The uploader's passport, when they have one. */
  uploaderSlug: UserSlug | null;
  createdAt: number;
  /** Likes on the spot that came through this photo. */
  likesBrought: number;
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
  /** The passport of the account that added the spot, when it has one. */
  adderSlug: UserSlug | null;
  addedAt: number;
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
  /** Epoch ms of the last add or like the page shows; absent on pages that don't move with the catalog. */
  lastModified?: number;
};

/** A spot that is live on its board: listed, with a hosted photo. */
export type LiveSpotRef = {
  citySlug: CitySlug;
  slug: SpotSlug;
  name: string;
  likeCount: number;
  lastLikedAt: number;
  addedAt: number;
};

/** A woonplaats board that has at least one live spot. */
export type BoardIndexEntry = {
  city: CityCard;
  spotCount: number;
};

/** The spot a passport photo was taken at. */
export type PassportPhotoSpot = {
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  geo: { lat: number; lng: number };
  closed: boolean;
  likeCount: number;
};

/** One photo the account posted. `discovery` marks the photo that created the spot. */
export type PassportPhoto = {
  id: string;
  url: string;
  createdAt: number;
  discovery: boolean;
  spot: PassportPhotoSpot;
};

export type PassportData = {
  slug: UserSlug;
  /** Spots this account put on brag.fast with a first photo. */
  discoveredCount: number;
  /** Likes on spots this account added, plus likes through its photos elsewhere, each once. */
  likeCount: number;
  photos: PassportPhoto[];
};

export type PassportPageData = PassportData & {
  standing: LeaderboardStanding | null;
};

export type LeaderboardData = {
  adders: AdderRow[];
};

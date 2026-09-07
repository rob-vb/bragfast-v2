import type { GenericId } from "convex/values";
import type { CitySlug, SpotSlug, UserSlug } from "./ids";
import type { LicensedImage } from "./post";
import type { OpeningHours, SpotLifecycle, SpotType } from "./spot";

export type RankedSpotCard = {
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  rank: number;
  score: number;
  hours: OpeningHours | null;
  spotType: SpotType;
  geo: { lat: number; lng: number };
  address: string;
};

export type SeedSpotCard = {
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  address: string;
  hours: OpeningHours | null;
  spotType: SpotType;
  geo: { lat: number; lng: number };
};

export type CityCard = {
  slug: CitySlug;
  nameNl: string;
  nameEn: string;
  boardCount?: number;
};

export type CityPageData = {
  city: CityCard;
  board: RankedSpotCard[];
  tail: SeedSpotCard[];
};

export type FeedItem = {
  postId: GenericId<"posts">;
  createdAt: number;
  makerName: string;
  media:
    | {
        kind: "hosted";
        url: string;
        mediaType: "photo" | "video";
        placeholder: boolean;
      }
    | {
        kind: "embed";
        embed: {
          platform: "instagram" | "youtube";
          permalink: string;
          platformMediaId: string;
        };
      };
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
  rankInCity: number | null;
  allTimeMakers: number;
  feed: FeedItem[];
  licensedImage: LicensedImage | null;
  canonicalPath: string;
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
  postId: GenericId<"posts">;
  spotName: string;
  spotPath: string;
  hiddenAt: number;
};

export type AdminSpotRow = {
  spotId: GenericId<"spots">;
  name: string;
  citySlug: CitySlug;
  slug: SpotSlug;
  listingStatus: "listed" | "gravestone";
};

export type AdminMatchRow = {
  queueId: GenericId<"aiMatchQueue">;
  permalink: string;
  caption: string;
  proposedSpotName: string | null;
  proposedSpotPath: string | null;
};

export type AdminSpotAddRow = {
  queueId: GenericId<"spotAddQueue">;
  name: string;
  placeId: string;
  types: string[];
  citySlug: CitySlug;
};

export type SitemapEntry = {
  path: string;
};

export type PassportSpotCard = {
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  latestBragAt: number;
  geo: { lat: number; lng: number };
  closed: boolean;
};

export type PassportWeekPost = {
  postId: GenericId<"posts">;
  createdAt: number;
  spotSlug: SpotSlug;
  citySlug: CitySlug;
  name: string;
};

export type PassportData = {
  slug: UserSlug;
  displayName: string;
  avatarUrl: string | null;
  uniqueSpotCount: number;
  postsThisWeek: number;
  spots: PassportSpotCard[];
  weekPosts: PassportWeekPost[];
};

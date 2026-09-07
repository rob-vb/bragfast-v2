import type { GenericId } from "convex/values";
import { v } from "convex/values";
import { DomainParseError } from "./ids";
import { parseMakerKey, type MakerKey, type UserMakerKey } from "./makerKey";

export const socialEmbedValidator = v.object({
  platform: v.union(v.literal("instagram"), v.literal("youtube")),
  permalink: v.string(),
  platformMediaId: v.string(),
});

export const postVisibilityValidator = v.union(
  v.object({ kind: v.literal("visible") }),
  v.object({
    kind: v.literal("hidden"),
    reason: v.literal("report"),
    reportId: v.id("reports"),
    at: v.number(),
  }),
);

export const postBodyValidator = v.union(
  v.object({
    kind: v.literal("inApp"),
    media: v.object({
      mediaType: v.union(v.literal("photo"), v.literal("video")),
      storageId: v.id("_storage"),
      replacedAt: v.union(v.number(), v.null()),
    }),
  }),
  v.object({
    kind: v.literal("social"),
    embed: socialEmbedValidator,
  }),
);

export type HostedMedia = {
  mediaType: "photo" | "video";
  storageId: GenericId<"_storage">;
  replacedAt: number | null;
};

export type SocialEmbed = {
  platform: "instagram" | "youtube";
  permalink: string;
  platformMediaId: string;
};

export type PostVisibility =
  | { kind: "visible" }
  | { kind: "hidden"; reason: "report"; reportId: GenericId<"reports">; at: number };

export type Post = {
  id: GenericId<"posts">;
  spotId: GenericId<"spots">;
  createdAt: number;
  visibility: PostVisibility;
} & (
  | { kind: "inApp"; maker: UserMakerKey; media: HostedMedia }
  | { kind: "social"; maker: MakerKey; embed: SocialEmbed }
);

export type PostDoc = {
  _id: GenericId<"posts">;
  spotId: GenericId<"spots">;
  makerKey: string;
  createdAt: number;
  visibility: PostVisibility;
  body:
    | { kind: "inApp"; media: HostedMedia }
    | { kind: "social"; embed: SocialEmbed };
};

export function parsePost(doc: PostDoc): Post {
  const maker = parseMakerKey(doc.makerKey);
  const common = {
    id: doc._id,
    spotId: doc.spotId,
    createdAt: doc.createdAt,
    visibility: doc.visibility,
  };

  if (doc.body.kind === "social") {
    return { ...common, kind: "social", maker, embed: doc.body.embed };
  }

  if (maker.kind !== "user") {
    throw new Error("In-app posts require a user maker");
  }

  return { ...common, kind: "inApp", maker, media: doc.body.media };
}

export type LicensedImage = {
  url: string;
  source: "inApp";
};

export type FeedMedia =
  | { kind: "hosted"; url: string; mediaType: "photo" | "video" }
  | { kind: "embed"; embed: SocialEmbed };

export function createLicensedImage(media: FeedMedia): LicensedImage | null {
  if (media.kind === "embed" || media.mediaType !== "photo") {
    return null;
  }
  return { url: media.url, source: "inApp" };
}

export type VisiblePost = Post & { visibility: { kind: "visible" } };

export function requireVisiblePost(post: Post): VisiblePost {
  if (post.visibility.kind !== "visible") {
    throw new DomainParseError("VisiblePost", post.visibility.kind);
  }
  return post as VisiblePost;
}

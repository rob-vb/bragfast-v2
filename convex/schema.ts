import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  openingHoursValidator,
  spotTypeValidator,
} from "../domain/spot";
import {
  postBodyValidator,
  postVisibilityValidator,
  socialEmbedValidator,
} from "../domain/post";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    passport: v.union(
      v.null(),
      v.object({ slug: v.string(), since: v.number() }),
    ),
    igUserId: v.union(v.string(), v.null()),
    igAccessToken: v.optional(v.union(v.string(), v.null())),
    igTokenExpiresAt: v.optional(v.union(v.number(), v.null())),
  })
    .index("by_authId", ["authId"])
    .index("by_passport_slug", ["passport.slug"])
    .index("by_igUserId", ["igUserId"]),

  cities: defineTable({
    slug: v.string(),
    country: v.literal("nl"),
    nameNl: v.string(),
    nameEn: v.string(),
    featuredOrder: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["featuredOrder"]),

  spots: defineTable({
    placeId: v.string(),
    slug: v.string(),
    citySlug: v.string(),
    country: v.literal("nl"),
    name: v.string(),
    address: v.string(),
    geo: v.object({ lat: v.number(), lng: v.number() }),
    hours: openingHoursValidator,
    spotType: spotTypeValidator,
    listingStatus: v.union(v.literal("listed"), v.literal("gravestone")),
    boardScore: v.optional(v.number()),
    latestBragAt: v.optional(v.number()),
    windowExpiresAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
    allTimeMakers: v.number(),
    placesRaw: v.any(),
  })
    .index("by_placeId", ["placeId"])
    .index("by_city_slug", ["citySlug", "slug"])
    .index("by_city_board", [
      "citySlug",
      "listingStatus",
      "boardScore",
      "latestBragAt",
    ])
    .index("by_windowExpiresAt", ["windowExpiresAt"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["country"],
    }),

  posts: defineTable({
    spotId: v.id("spots"),
    makerKey: v.string(),
    createdAt: v.number(),
    visibility: postVisibilityValidator,
    body: postBodyValidator,
  })
    .index("by_spot_created", ["spotId", "createdAt"])
    .index("by_maker_spot", ["makerKey", "spotId", "createdAt"])
    .index("by_maker_created", ["makerKey", "createdAt"])
    .index("by_platform_media", ["body.embed.platformMediaId"]),

  makerVotes: defineTable({
    spotId: v.id("spots"),
    makerKey: v.string(),
    firstPostAt: v.number(),
    latestVisiblePostAt: v.number(),
  })
    .index("by_spot_maker", ["spotId", "makerKey"])
    .index("by_maker", ["makerKey", "latestVisiblePostAt"]),

  aiMatchQueue: defineTable({
    embed: socialEmbedValidator,
    makerKey: v.string(),
    caption: v.string(),
    proposedSpotId: v.union(v.id("spots"), v.null()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
  })
    .index("by_status", ["status"])
    .index("by_maker_status", ["makerKey", "status"]),

  spotAddQueue: defineTable({
    placeId: v.string(),
    name: v.string(),
    address: v.string(),
    geo: v.object({ lat: v.number(), lng: v.number() }),
    types: v.array(v.string()),
    citySlug: v.string(),
    submittedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
  })
    .index("by_status", ["status"])
    .index("by_placeId", ["placeId"]),

  oauthStates: defineTable({
    state: v.string(),
    authId: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    expiresAt: v.number(),
  }).index("by_state", ["state"]),

  placesQuota: defineTable({
    monthKey: v.string(),
    detailsCount: v.number(),
  }).index("by_monthKey", ["monthKey"]),

  ingestCursor: defineTable({
    key: v.string(),
    cityIndex: v.number(),
    citySlug: v.optional(v.string()),
  }).index("by_key", ["key"]),

  placesSeen: defineTable({
    placeId: v.string(),
    reason: v.optional(
      v.union(
        v.literal("fast-food"),
        v.literal("not-hospitality"),
        v.literal("unassigned"),
        v.literal("closed-unknown"),
        v.literal("invalid"),
      ),
    ),
    seenAt: v.optional(v.number()),
  }).index("by_placeId", ["placeId"]),

  reports: defineTable({
    target: v.union(
      v.object({ kind: v.literal("post"), postId: v.id("posts") }),
      v.object({ kind: v.literal("spot"), spotId: v.id("spots") }),
    ),
    reason: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
  }).index("by_status", ["status"]),
});

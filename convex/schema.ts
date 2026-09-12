import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  openingHoursValidator,
  spotTypeValidator,
} from "../domain/spot";

function leftoverTable() {
  return defineTable(v.any());
}

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
    addedBy: v.optional(v.id("users")),
    photoId: v.optional(v.id("_storage")),
    likeCount: v.optional(v.number()),
    lastLikedAt: v.optional(v.number()),
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

  posts: leftoverTable(),
  makerVotes: leftoverTable(),
  aiMatchQueue: leftoverTable(),
  spotAddQueue: leftoverTable(),
  placesQuota: leftoverTable(),
  ingestCursor: leftoverTable(),
  placesSeen: leftoverTable(),
  oauthStates: leftoverTable(),

  likes: defineTable({
    userId: v.id("users"),
    spotId: v.id("spots"),
  })
    .index("by_user_spot", ["userId", "spotId"])
    .index("by_spot", ["spotId"]),

  reports: defineTable({
    target: v.union(
      v.object({ kind: v.literal("post"), postId: v.id("posts") }),
      v.object({ kind: v.literal("spot"), spotId: v.id("spots") }),
    ),
    reason: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
  }).index("by_status", ["status"]),
});

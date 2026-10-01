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

  photos: defineTable({
    spotId: v.id("spots"),
    storageId: v.id("_storage"),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
    /** The photo whose publish created the spot. */
    discovery: v.optional(v.boolean()),
    /** Client that published it. Absent on photos from before 30 September 2026. */
    source: v.optional(v.union(v.literal("ios"), v.literal("web"))),
    /** Set while a report waits for owner review; hidden photos show nowhere. */
    hiddenAt: v.optional(v.number()),
    /** When the owner's moderation scan looked at it. */
    scannedAt: v.optional(v.number()),
  })
    .index("by_spot", ["spotId"])
    .index("by_scanned", ["scannedAt"])
    .index("by_spot_created", ["spotId", "createdAt"])
    .index("by_user", ["uploadedBy"]),

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
    /** The photo this like came through. Absent on likes from before 30 September 2026. */
    viaPhotoId: v.optional(v.id("photos")),
  })
    .index("by_user_spot", ["userId", "spotId"])
    .index("by_spot", ["spotId"])
    .index("by_photo", ["viaPhotoId"]),

  reports: defineTable({
    target: v.union(
      v.object({ kind: v.literal("post"), postId: v.id("posts") }),
      v.object({ kind: v.literal("spot"), spotId: v.id("spots") }),
      v.object({ kind: v.literal("photo"), photoId: v.id("photos") }),
    ),
    reason: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
    /** Who reported, while the report is open; cleared once it is handled. */
    reporterId: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_photo", ["target.photoId"])
    .index("by_reporter", ["reporterId"]),

  /** One viewer no longer sees another's photos in the app. */
  blocks: defineTable({
    userId: v.id("users"),
    blockedId: v.id("users"),
  })
    .index("by_user_blocked", ["userId", "blockedId"])
    .index("by_blocked", ["blockedId"]),
});

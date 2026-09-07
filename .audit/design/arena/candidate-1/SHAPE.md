# Shape

Stance: posts and votes are different tables. `Post` is a feed row. `MakerVote` is the unique (maker, spot) row that ranks. The vote is a materialization of visible posts, maintained by exactly one writer (`reconcileVote`) inside the same Convex transaction as every post write.

## The one invariant, stated once

> A `makerVotes` row for (makerKey, spotId) exists ⇔ at least one **visible** post by that maker on that spot exists.

Consequences, all derived rather than separately legislated:

- Extra posts from the same maker: vote already exists, reconcile keeps it. Feed rows only.
- Replacing in-app media: post patched in place, `createdAt` untouched, vote untouched.
- Deleting the last visible post: reconcile finds zero visible posts and **deletes the vote row** in the same transaction. The answer to "what happens to the vote" is: it follows the posts, always, with no grace period and no tombstone.
- Report hides the last visible post: same path, vote retracted; owner un-hide restores it.
- Instagram merge: rewrite post makers, reconcile both keys. Duplicate collapse is automatic.

## Domain types (`domain/`, pure TS, no framework imports beyond `convex/values` for validators)

```ts
// ─── domain/ids.ts ───────────────────────────────────────────────
// Branded slugs and keys, per type-system-discipline. Validate once at
// creation (parse* throws DomainParseError), trust downstream.
export type CitySlug  = string & { readonly __brand: "CitySlug" };
export type SpotSlug  = string & { readonly __brand: "SpotSlug" };
export type UserSlug  = string & { readonly __brand: "UserSlug" };
export type PlaceId   = string & { readonly __brand: "PlaceId" };

export function parseCitySlug(raw: string): CitySlug { throw new Error("not implemented"); }
export function parseSpotSlug(raw: string): SpotSlug { throw new Error("not implemented"); }
// ... same shape for the rest

// ─── domain/makerKey.ts ──────────────────────────────────────────
// Fork 4 stance: branded union in domain code, one serialized string
// column ("user:{id}" | "ig:{id}") in storage because Convex indexes
// need a flat field. parse/serialize are the only two functions that
// know the wire format.
export type MakerKey =
  | { kind: "user"; userId: Id<"users"> }
  | { kind: "ig";   igUserId: string };

export type UserMakerKey = Extract<MakerKey, { kind: "user" }>;

/** Serialized, indexable form. Only makerKey.ts constructs it. */
export type MakerKeyString = string & { readonly __brand: "MakerKeyString" };

export function serializeMakerKey(key: MakerKey): MakerKeyString { throw new Error("not implemented"); }
export function parseMakerKey(raw: string): MakerKey { throw new Error("not implemented"); }

// ─── domain/spot.ts ──────────────────────────────────────────────
// Fork 5 stance: lifecycle is a sum type. A gravestone cannot carry a
// board standing; a seed cannot carry a rank number; a standing cannot
// exist with score 0. All three illegal states are unrepresentable.
export type BoardStanding = {
  score: number;            // distinct makers in window, >= 1 by construction
  latestBragAt: number;     // tie-break: most recent visible post createdAt
  windowExpiresAt: number;  // earliest instant score can drop; drives the aging cron
};

export type SpotLifecycle =
  | { kind: "listed"; standing: BoardStanding | null } // null = seed ("Nog niet gebragd")
  | { kind: "gravestone"; closedAt: number };          // URL kept, dropped from lists

export type SpotType = "cafe" | "bakery" | "hotel" | "other"; // chip taxonomy, mapped from Places types

export type Spot = {
  id: Id<"spots">;
  placeId: PlaceId;
  slug: SpotSlug;
  citySlug: CitySlug;
  country: "nl";
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  hours: OpeningHours | null;      // parsed Places hours; null = unknown
  spotType: SpotType;
  lifecycle: SpotLifecycle;
  allTimeMakers: number;           // count of MakerVote rows; maintained by recomputeSpotStats
};

export function parseSpot(doc: SpotDoc): Spot { throw new Error("not implemented"); }
export const spotLifecycleValidator = /* v.union(listed, gravestone) — imported by schema.ts */ null as never;

// ─── domain/post.ts ──────────────────────────────────────────────
// Post body is a sum type. "In-app post with an embed" and "in-app post
// by an ig maker" are compile errors: the inApp variant only admits
// hosted media and a UserMakerKey. Source is derivable from the variant,
// so no separate `source` column can drift.
export type HostedMedia = {
  mediaType: "photo" | "video";
  storageId: Id<"_storage">;
  replacedAt: number | null;       // replace-in-place audit; createdAt stays
};

export type SocialEmbed = {
  platform: "instagram" | "youtube";
  permalink: string;               // embed + link to origin; we never host the bytes
  platformMediaId: string;         // idempotency key for ingest
};

export type PostVisibility =
  | { kind: "visible" }
  | { kind: "hidden"; reason: "report"; reportId: Id<"reports">; at: number };
// There is no "deleted" variant. AVG delete removes the row and the file.

export type Post = { id: Id<"posts">; spotId: Id<"spots">; createdAt: number; visibility: PostVisibility } & (
  | { kind: "inApp";  maker: UserMakerKey; media: HostedMedia }
  | { kind: "social"; maker: MakerKey;     embed: SocialEmbed }
);

export function parsePost(doc: PostDoc): Post { throw new Error("not implemented"); }

// ─── domain/vote.ts ──────────────────────────────────────────────
// The stance's core encoding. Vote presence is a *pure function* of the
// maker's visible posts on the spot. reconcileVote applies this function
// transactionally; nothing else writes makerVotes.
export type VoteStanding = {
  firstPostAt: number;             // oldest visible post
  latestVisiblePostAt: number;     // newest visible post; feeds window math + tie-break
};

/** Total function. Empty input → null → the vote row must not exist. */
export function desiredVote(visiblePostCreatedAts: readonly number[]): VoteStanding | null {
  throw new Error("not implemented");
}

export type VoteOutcome = "granted" | "kept" | "retracted" | "absent";

// ─── domain/ranking.ts ───────────────────────────────────────────
export const RANKING_WINDOW_MS = 90 * 24 * 60 * 60 * 1000; // the only place 90 appears

/** Pure. votes → standing (null when no vote is inside the window). */
export function computeStanding(votes: readonly VoteStanding[], now: number): BoardStanding | null {
  throw new Error("not implemented");
}

/** Board order: score desc, latestBragAt desc. Matches the by_city_board index order. */
export function boardComparator(a: BoardStanding, b: BoardStanding): number { throw new Error("not implemented"); }

// ─── domain/viewModels.ts ────────────────────────────────────────
// What public queries return. No Doc, no MakerKeyString, no storageId
// leaks: hosted media is pre-resolved to a URL inside the query.
export type FeedItem =
  | { kind: "hosted"; url: string; mediaType: "photo" | "video"; createdAt: number; makerLabel: MakerLabel }
  | { kind: "embed";  platform: "instagram" | "youtube"; permalink: string; createdAt: number; makerLabel: MakerLabel };

export type MakerLabel =
  | { kind: "user"; slug: UserSlug; displayName: string }   // links to passport
  | { kind: "ig";   handle: string };                        // unconnected, no passport link

export type RankedSpotCard = { rank: number; slug: SpotSlug; name: string; score: number; spotType: SpotType; openNow: boolean | null };
export type SeedSpotCard   = { slug: SpotSlug; name: string; spotType: SpotType; openNow: boolean | null };

export type CityPageData = { citySlug: CitySlug; cityName: string; board: RankedSpotCard[]; tail: SeedSpotCard[] };

export type SpotPageData = Spot & {
  lifecycle: // re-narrowed for the page: listed gains the city rank number
    | { kind: "listed"; standing: (BoardStanding & { rank: number }) | null }
    | { kind: "gravestone"; closedAt: number };
  feed: FeedItem[];
};

export type PassportData = {
  slug: UserSlug; displayName: string; avatarUrl: string | null;
  uniqueSpotCount: number; postsThisWeek: number;
  spots: Array<{ slug: SpotSlug; citySlug: CitySlug; name: string; latestBragAt: number }>;
};
```

## Convex schema (`convex/schema.ts`)

Validators are imported from `domain/*` so the schema and the domain types have one source (per encode-lessons-in-structure). Docs mirror the domain unions except `makerKey`, which is stored serialized for indexing.

```ts
export default defineSchema({
  users: defineTable({
    authId: v.string(),                       // Better Auth subject; component owns auth tables
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    passport: v.union(v.null(), v.object({ slug: v.string(), since: v.number() })), // null until brag 1 → noindex
    igUserId: v.union(v.string(), v.null()),  // set on Instagram link; triggers merge
  })
    .index("by_authId", ["authId"])
    .index("by_passport_slug", ["passport.slug"])
    .index("by_igUserId", ["igUserId"]),

  spots: defineTable({
    placeId: v.string(),
    slug: v.string(),
    citySlug: v.string(),
    country: v.literal("nl"),
    name: v.string(),
    address: v.string(),
    geo: v.object({ lat: v.number(), lng: v.number() }),
    hours: openingHoursValidator,             // from domain/spot.ts
    spotType: spotTypeValidator,
    lifecycle: spotLifecycleValidator,        // the union, verbatim
    allTimeMakers: v.number(),
    placesRaw: v.any(),                       // hygiene-job scratch, never read by app code
  })
    .index("by_placeId", ["placeId"])                               // idempotent upsert key
    .index("by_city_slug", ["citySlug", "slug"])                    // spot page lookup
    .index("by_city_board", ["citySlug", "lifecycle.kind",
            "lifecycle.standing.score", "lifecycle.standing.latestBragAt"]) // one desc scan = board + tail
    .index("by_windowExpiresAt", ["lifecycle.standing.windowExpiresAt"])    // aging cron
    .searchIndex("search_name", { searchField: "name", filterFields: ["country"] }),

  posts: defineTable({
    spotId: v.id("spots"),
    makerKey: v.string(),                     // MakerKeyString; parse at read
    createdAt: v.number(),                    // explicit: merges/ingest must not lean on _creationTime
    visibility: postVisibilityValidator,
    body: postBodyValidator,                  // { kind:"inApp", media } | { kind:"social", embed }
  })
    .index("by_spot_created", ["spotId", "createdAt"])              // spot feed, newest first
    .index("by_maker_spot", ["makerKey", "spotId", "createdAt"])    // reconcile + "my posts here"
    .index("by_maker_created", ["makerKey", "createdAt"])           // passport posts-this-week
    .index("by_platform_media", ["body.embed.platformMediaId"]),    // ingest idempotency

  makerVotes: defineTable({
    spotId: v.id("spots"),
    makerKey: v.string(),                     // MakerKeyString
    firstPostAt: v.number(),
    latestVisiblePostAt: v.number(),
  })
    .index("by_spot_maker", ["spotId", "makerKey"])                 // uniqueness enforced by reconcile through this index
    .index("by_maker", ["makerKey", "latestVisiblePostAt"]),        // passport unique spots

  aiMatchQueue: defineTable({
    embed: socialEmbedValidator,
    makerKey: v.string(),
    proposedSpotId: v.union(v.id("spots"), v.null()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  }).index("by_status", ["status"]),

  reports: defineTable({
    target: v.union(
      v.object({ kind: v.literal("post"), postId: v.id("posts") }),
      v.object({ kind: v.literal("spot"), spotId: v.id("spots") })),
    reason: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
  }).index("by_status", ["status"]),
});
```

Convex has no unique constraints; (spotId, makerKey) uniqueness holds because `reconcileVote` is the only writer and it upserts through `by_spot_maker` inside a serializable transaction.

## The single writer (`convex/model/votes.ts`, plain functions, not exposed)

```ts
/**
 * THE invariant enforcer. Reads visible posts for (maker, spot), applies
 * domain.desiredVote, and upserts or deletes the makerVotes row to match.
 * Then recomputes the spot's counters. Idempotent: safe to call after any
 * post write, twice, or after a crash; it converges (per
 * make-operations-idempotent). Every mutation that touches posts MUST call
 * this before returning.
 */
export async function reconcileVote(
  ctx: MutationCtx, makerKey: MakerKeyString, spotId: Id<"spots">,
): Promise<VoteOutcome> { throw new Error("not implemented"); }

/**
 * Recomputes lifecycle.standing (score, latestBragAt, windowExpiresAt) and
 * allTimeMakers from the spot's makerVotes rows. Never patches a gravestone's
 * lifecycle kind. Called by reconcileVote and by the aging cron.
 */
export async function recomputeSpotStats(ctx: MutationCtx, spotId: Id<"spots">): Promise<void> {
  throw new Error("not implemented");
}

/** Merge helper: repoint posts from one maker key to another. Returns touched spotIds. */
export async function rewritePostMakers(
  ctx: MutationCtx, args: { from: MakerKeyString; to: MakerKeyString },
): Promise<Set<Id<"spots">>> { throw new Error("not implemented"); }
```

## Public surface (what Next.js actually calls)

Queries run signed-out; mutations require Better Auth identity via `createAuth`/`ctx.auth` inside Convex.

```ts
// convex/catalog.ts ── public queries, return domain view models
export const cityPage = query({
  args: { citySlug: v.string() },
  returns: cityPageDataValidator, // nullable
  handler: async (ctx, { citySlug }): Promise<CityPageData | null> => {
    // TODO: one desc scan of by_city_board with eq(citySlug), eq(kind,"listed");
    // standing !== null → board (rank = position), standing === null → tail (sort by name);
    // parse docs → domain → cards. Zero-spot city → null → 404.
    throw new Error("not implemented");
  },
});

export const spotPage = query({
  args: { citySlug: v.string(), spotSlug: v.string() },
  handler: async (ctx, args): Promise<SpotPageData | null> => {
    // TODO: by_city_slug lookup; gravestone returns early with empty feed rules applied;
    // rank = 1 + count of city spots with greater (score, latestBragAt) via by_city_board;
    // feed = by_spot_created desc, visible only, hosted storageIds → ctx.storage.getUrl.
    throw new Error("not implemented");
  },
});

export const searchCatalog = query({ /* args: { q: string } */
  handler: async (): Promise<{ spots: SpotHit[]; cities: CityHit[] }> => { throw new Error("not implemented"); },
});

export const homepage = query({ // featured cities: maker-active first, majors always
  handler: async (): Promise<HomepageData> => { throw new Error("not implemented"); },
});

// convex/brags.ts ── authed mutations; each is post-write + reconcileVote in one transaction
export const createInApp = mutation({
  args: { spotId: v.id("spots"), storageId: v.id("_storage"), mediaType: v.union(v.literal("photo"), v.literal("video")) },
  handler: async (ctx, args): Promise<{ postId: Id<"posts">; vote: VoteOutcome }> => {
    // TODO: requireUser → makerKey user:{id}; reject gravestone spots at write time;
    // insert inApp post; reconcileVote; ensurePassport (create slug on brag 1).
    throw new Error("not implemented");
  },
});

export const replaceMedia = mutation({
  args: { postId: v.id("posts"), storageId: v.id("_storage"), mediaType: v.union(v.literal("photo"), v.literal("video")) },
  handler: async (ctx, args): Promise<void> => {
    // TODO: owner check; inApp variant check (embeds are not replaceable — compile-time
    // in domain, runtime at this boundary); delete old storage file; patch media,
    // set replacedAt; createdAt untouched so the vote and tie-break do not move.
    throw new Error("not implemented");
  },
});

export const remove = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args): Promise<{ vote: VoteOutcome }> => {
    // TODO: owner check; delete storage file if hosted (AVG: bytes go too);
    // delete post row; reconcileVote → "retracted" iff this was the last visible post.
    throw new Error("not implemented");
  },
});

export const report = mutation({ /* target, reason */ handler: async () => { throw new Error("not implemented"); } });

// convex/identity.ts ── merge + passport
export const linkInstagram = mutation({
  args: { igUserId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    // TODO: set users.igUserId; rewritePostMakers(ig:X → user:Y);
    // reconcile both keys per touched spot (see USAGE call site 4). Idempotent:
    // re-running finds no ig posts and no ig votes and changes nothing.
    throw new Error("not implemented");
  },
});

export const passportBySlug = query({
  args: { userSlug: v.string() },
  handler: async (ctx, args): Promise<PassportData | null> => {
    // TODO: by_passport_slug; uniqueSpots from makerVotes.by_maker; postsThisWeek from posts.by_maker_created.
    throw new Error("not implemented");
  },
});

// convex/spots.ts ── catalog writes
export const addByPlaceId = action({ /* signed-in user-add via Places autocomplete */
  handler: async (): Promise<{ spotId: Id<"spots">; live: boolean }> => {
    // TODO: Places details fetch (action); internal.spots.upsertFromPlaces (mutation).
    // Allowed hospitality types go live; anything else → owner queue, not live.
    throw new Error("not implemented");
  },
});

export const upsertFromPlaces = internalMutation({ /* idempotent by placeId; sets/clears gravestone; recomputeSpotStats after lifecycle change */
  handler: async () => { throw new Error("not implemented"); },
});

// convex/moderation.ts ── owner queue + reports
export const resolveReport = internalMutation({
  // TODO: hide → patch post visibility to hidden + reconcileVote (may retract);
  // unhide → visible + reconcileVote (may re-grant). Same single writer, no special case.
  handler: async () => { throw new Error("not implemented"); },
});

// convex/crons.ts
// nightly: spots with lifecycle.standing.windowExpiresAt <= now → recomputeSpotStats.
// Aging out of the 90-day window is the ONLY score change with no user write behind it.
// nightly: Places hygiene (hours, closed) via upsertFromPlaces.
```

## SSR wiring (fork 2 stance)

Public pages call `fetchQuery` from `convex/nextjs` in RSCs. They are crawlable documents; live subscriptions buy nothing signed-out and cost client bundle and connection state. `preloadQuery` is reserved for the one place SSR content must stay live after hydration (none in v1). Auth-gated islands use `useMutation`/`useQuery` under `ConvexBetterAuthProvider` with `initialToken` from `getToken()`, per the official wiring. `auth.api` calls stay inside Convex functions.

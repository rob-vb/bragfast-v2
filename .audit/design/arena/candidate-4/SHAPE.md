# Shape

Types, Convex schema, indexes, signatures. Bodies are `not implemented`. Derived from `USAGE.md`.

## The one-paragraph version

`bragEvents` is an append-only log and the only source of truth for votes and visibility. Two private projections are total functions of that log. `bragCurrent` holds each brag's folded current state and serves the feed and the passport. `boardEntry` holds each spot's standing and its city rank number, and serves the city board and the spot page in a single index read. Catalog spots live in `spots` and are never touched by ranking. A city page reads the board by index in rank order and never scans a brag.

## Naming convention used throughout

Convex indexes sort on flat field values, so a stored row cannot be a discriminated union on an indexed field. Every place that bites, the same pattern applies. Flatten for the index, parse for the reader.

- The stored row has flat optional fields shaped for the index.
- One constructor turns the domain sum type into those fields. Nothing else writes them.
- One parser turns the fields back into the sum type. Nothing else reads them raw.

Used for `SpotStatus`, `BoardStanding`, and `BragVisibility`. Three uses of one idea, not three hacks. The illegal field combinations are unconstructable because the constructor is the only writer, per `principle-type-system-discipline`.

```ts
// convex/domain/rows.ts
/** Flatten a domain sum type into indexable columns. The only writer of the pair. */
export type RowCodec<Domain, Row> = {
  toRow(value: Domain): Row;
  fromRow(row: Row): Domain;
};
```

## Branded ids and keys

```ts
// convex/domain/ids.ts
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type SpotId = Id<"spots">;          // derived from the schema, already branded by Convex
export type InstagramUserId = Brand<string, "InstagramUserId">;
export type CitySlug = Brand<string, "CitySlug">;
export type SpotSlug = Brand<string, "SpotSlug">;
export type UserSlug = Brand<string, "UserSlug">;
export type BragId = Brand<string, "BragId">;
export type Timestamp = Brand<number, "EpochMillis">;

/** Parse at the HTTP boundary. Lowercase, ascii, hyphenated. */
export function parseCitySlug(raw: string): CitySlug | null { throw new Error("not implemented"); }
export function parseSpotSlug(raw: string): SpotSlug | null { throw new Error("not implemented"); }
```

Spot ids come from Convex rather than a hand-rolled brand, per `principle-type-system-discipline` on deriving from the authoritative schema.

## Maker identity, and the type that prevents double counting

This is the load-bearing type trick in this design.

```ts
// convex/domain/maker.ts
export type MakerIdentity =
  | { platform: "bragfast"; userId: Id<"users"> }
  | { platform: "instagram"; igUserId: InstagramUserId };

/**
 * A maker key that has already been resolved through every merge that applies to it.
 * Only `foldBrag` and `resolveMakerAtAppend` produce one. Nothing else can construct it.
 */
export type CanonicalMakerKey = Brand<string, "CanonicalMakerKey">;

export function makerKey(identity: MakerIdentity): string { throw new Error("not implemented"); }
export function parseMakerKey(raw: string): MakerIdentity | null { throw new Error("not implemented"); }

/**
 * Boundary resolution for a brand-new event. Looks up whether this Instagram id is
 * already linked to a bragfast account, so new events land canonical from birth.
 */
export function resolveMakerAtAppend(
  identity: MakerIdentity,
  linkedUserId: Id<"users"> | null,
): CanonicalMakerKey { throw new Error("not implemented"); }
```

`tallySpot` accepts `CanonicalMakerKey` only. Counting an unresolved key, which is the exact bug that double-counts a person who has both an Instagram brag and an account brag on the same spot, does not compile. The merge rule from SPEC is enforced by the type system instead of by a collapse routine that someone has to remember to call, per `principle-encode-lessons-in-structure` picking the strongest rung available.

## The log

Every event carries `spotId` and `citySlug`, so an event locates its own reprojection target without reading any other row. That is what keeps the reprojection read set bounded.

```ts
// convex/domain/event.ts
type EventBase = {
  bragId: BragId;
  spotId: SpotId;
  citySlug: CitySlug;
  maker: CanonicalMakerKey;   // canonical as of append time; a remap event supersedes it
  at: Timestamp;
  /** `${platform}:${externalId}` for ingested posts. Absent for in-app events. */
  dedupeKey?: string;
};

export type BragEvent =
  | (EventBase & { kind: "created"; source: BragSource; media: BragMedia; occurredAt: Timestamp })
  | (EventBase & { kind: "media_replaced"; media: BragMedia })
  | (EventBase & { kind: "maker_remapped"; from: CanonicalMakerKey; to: CanonicalMakerKey })
  | (EventBase & { kind: "hidden"; reason: HideReason })
  | (EventBase & { kind: "unhidden" })
  | (EventBase & { kind: "erased" });

export type BragSource = "in_app" | "instagram" | "youtube_embed";
export type HideReason = "reported" | "owner_hidden" | "author_deleted";
```

Every `EventBase` field repeats in every variant of the stored validator, because a Convex index on a union table requires the field to exist on all variants. That is why `maker_remapped` carries `spotId` and `citySlug` even though a merge is about identity. It is also why merges are per-brag events rather than one global fact; a global fact has no spot to name and would force `spotId` to be nullable on every event, losing the guarantee that an event locates its own reprojection target.

```ts

export type BragMedia =
  | { kind: "photo"; storageId: Id<"_storage">; width: number; height: number }
  | { kind: "video"; storageId: Id<"_storage">; durationMs: number }
  | { kind: "embed"; platform: "instagram" | "youtube"; permalink: string; externalId: string };
```

`media_replaced` has no `occurredAt`. Replacing a photo cannot move the visit timestamp, so it cannot win a tie-break.

`erased` is terminal. It is the AVG path and it is the only event that removes data rather than adding a fact. The log itself stores no personal content beyond a maker key and a storage pointer, so erasure appends `erased`, deletes the storage file, and the reprojection drops the media and the maker from the projections. See the risks section in `RATIONALE.md`.

The payoff of per-brag remaps is that there is no alias table and no alias lookup in the ranking path. Folding one brag's events already yields its canonical maker.

## Domain shapes the caller sees

```ts
// convex/domain/spot.ts
export type SpotStatus =
  | { kind: "open" }
  | { kind: "closed_permanently"; since: Timestamp };

export type SpotKind = "cafe_lunch" | "bakery" | "hotel" | "other";

export type SpotFacts = {
  id: SpotId;
  slug: SpotSlug;
  citySlug: CitySlug;
  name: string;
  address: string;
  geo: LatLng;
  kind: SpotKind;
  hours: OpeningHours;
  status: SpotStatus;
};

/** Only constructable from an in-app upload. An embed permalink has no path to this type. */
export type LicensedImage = Brand<{ url: string; width: number; height: number }, "LicensedImage">;
export function licensedImageFrom(media: BragMedia, url: string): LicensedImage | null {
  throw new Error("not implemented"); // TODO returns null for kind === "embed"
}
```

```ts
// convex/domain/rank.ts
export type BoardStanding =
  | { kind: "ranked"; rank: number; citySlug: CitySlug; makers90d: number; lastBragAt: Timestamp }
  | { kind: "unranked"; reason: "window_empty" | "spot_closed" };

/**
 * A spot that is eligible for a board number. Constructing one requires an open spot
 * with at least one maker in the window, so `rankCity` cannot number a seed spot.
 */
export type RankInput = Brand<{
  spotId: SpotId;
  makers90d: number;      // >= 1 by construction
  lastBragAt: Timestamp;
}, "RankInput">;

export function rankInputFor(
  entry: { spotId: SpotId; makers90d: number; lastBragAt: Timestamp },
  status: SpotStatus,
): RankInput | null {
  throw new Error("not implemented"); // TODO null when closed or makers90d === 0
}

export function rankCity(inputs: readonly RankInput[]): readonly { spotId: SpotId; rank: number }[] {
  throw new Error("not implemented");
  // TODO makers90d desc, then lastBragAt desc, then spotId asc for a stable order.
  // Ranks are 1-based and dense. Product rule 6 holds because a seed cannot reach here.
}
```

`unranked.reason` is derived, never stored. `makers90d === 0` means the window emptied, anything else means the spot closed. Single source of truth per invariant, per `principle-minimize-reader-load`.

## Ranking window

```ts
// convex/domain/tally.ts
export const RANKING_WINDOW_DAYS = 90;

export type SpotTally = {
  makers90d: number;
  lastBragAt: Timestamp;
  /** When this row's count changes with no new event. Null iff makers90d === 0. */
  windowExpiresAt: Timestamp | null;
};

export function tallySpot(
  visibleInWindow: readonly { maker: CanonicalMakerKey; occurredAt: Timestamp }[],
  now: Timestamp,
): SpotTally {
  throw new Error("not implemented");
  // TODO group by maker, take each maker's latest occurredAt.
  // makers90d = group count.
  // lastBragAt = max occurredAt.
  // windowExpiresAt = min(per-maker latest) + 90d, because that maker leaves the window first.
}
```

`windowExpiresAt` is the answer to the hardest problem in a materialized design. A board row goes stale with no write when a brag ages out of the window. The row carries the exact instant its own count changes, so a cron finds only the rows that actually moved instead of rebuilding every city nightly. Cost is proportional to real change, per `principle-make-operations-idempotent`.

## Convex schema

```ts
// convex/schema.ts
export default defineSchema({
  cities: defineTable({
    slug: v.string(),
    country: v.literal("nl"),
    name: v.string(),
    geo: vLatLng,
    featured: v.boolean(),
  })
    .index("by_slug", ["country", "slug"])
    .index("by_featured", ["country", "featured", "name"]),

  spots: defineTable({
    placeId: v.string(),
    slug: v.string(),
    citySlug: v.string(),
    country: v.literal("nl"),
    name: v.string(),
    address: v.string(),
    geo: vLatLng,
    kind: vSpotKind,
    hours: vOpeningHours,
    // flatten-for-the-index pair; written only by spotStatusCodec.toRow
    status: v.union(v.literal("open"), v.literal("closed_permanently")),
    closedSince: v.optional(v.number()),
    refreshedAt: v.number(),
  })
    .index("by_place", ["placeId"])
    .index("by_city_slug", ["country", "citySlug", "slug"])
    .index("by_city_listable", ["citySlug", "status", "name"])
    .index("by_city_kind", ["citySlug", "status", "kind", "name"])
    .searchIndex("search_name", { searchField: "name", filterFields: ["citySlug", "status"] }),

  /** Raw Places payload. Separate table so returning a spot doc cannot leak a wire type. */
  spotSource: defineTable({
    spotId: v.id("spots"),
    provider: v.literal("google_places"),
    fetchedAt: v.number(),
    payload: v.any(),
  }).index("by_spot", ["spotId"]),

  bragEvents: defineTable(vBragEvent)
    .index("by_brag", ["bragId"])
    .index("by_maker_spot", ["maker", "spotId"])
    .index("by_city_time", ["citySlug", "at"])
    .index("by_dedupe", ["dedupeKey"]),

  /** Projection. Per-brag folded state. Private. */
  bragCurrent: defineTable({
    bragId: v.string(),
    spotId: v.id("spots"),
    citySlug: v.string(),
    maker: v.string(),
    source: vBragSource,
    media: v.optional(vBragMedia),        // absent iff visibility === "erased"
    occurredAt: v.number(),
    visibility: v.union(v.literal("visible"), v.literal("hidden"), v.literal("erased")),
    builtAt: v.number(),
  })
    .index("by_brag", ["bragId"])
    .index("by_spot_feed", ["spotId", "visibility", "occurredAt"])
    .index("by_maker_spot", ["maker", "visibility", "spotId"])
    .index("by_maker_time", ["maker", "visibility", "occurredAt"]),

  /** Projection. Per-spot standing and city rank. Private. */
  boardEntry: defineTable({
    spotId: v.id("spots"),
    citySlug: v.string(),
    rank: v.optional(v.number()),              // present iff ranked
    makers90d: v.number(),
    makersAllTime: v.number(),
    lastBragAt: v.number(),
    windowExpiresAt: v.optional(v.number()),   // present iff makers90d > 0
    builtAt: v.number(),                       // observability only, never read by logic
  })
    .index("by_spot", ["spotId"])
    .index("by_city_rank", ["citySlug", "rank"])
    .index("by_expiry", ["windowExpiresAt"]),

  users: defineTable({
    authUserId: v.string(),        // Better Auth subject
    slug: v.string(),
    displayName: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    igUserId: v.optional(v.string()),
    firstBragAt: v.optional(v.number()),   // absent means noindex the passport
  })
    .index("by_auth", ["authUserId"])
    .index("by_slug", ["slug"])
    .index("by_ig", ["igUserId"]),

  /**
   * Social posts with no hard place tag. Not events, so a pending match
   * cannot influence rank. Approval is the only path from here into the log.
   */
  aiMatchQueue: defineTable({
    post: vIngestedPost,
    proposedSpotId: v.optional(v.id("spots")),
    proposedBy: v.union(v.literal("ai"), v.literal("author")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    decidedAt: v.optional(v.number()),
  }).index("by_status", ["status", "_creationTime"]),

  reports: defineTable({
    target: v.union(
      v.object({ kind: v.literal("brag"), bragId: v.string() }),
      v.object({ kind: v.literal("spot"), spotId: v.id("spots") }),
    ),
    reason: vReportReason,
    reporterUserId: v.optional(v.id("users")),
    status: v.union(v.literal("open"), v.literal("upheld"), v.literal("dismissed")),
  }).index("by_status", ["status", "_creationTime"]),
});
```

### Index notes worth reading before touching them

`by_city_rank` with an optional `rank`. Convex sorts a missing field before every number, so the board query is `q.eq("citySlug", c).gte("rank", 1)` and unranked rows fall outside the range for free. One table serves both the ordered board and the spot page's standing lookup.

`by_expiry` has the same trap in the other direction. `lt("windowExpiresAt", now)` alone would match every row with the field missing. The sweep must bound both ends, `q.gte("windowExpiresAt", 1).lt("windowExpiresAt", now)`.

`by_spot_feed` serves two callers with one index. The feed takes the last 20 in descending order. The tally takes the range from `now - 90d` forward. Both filter `visibility === "visible"` inside the index rather than after it.

`by_dedupe` is what makes Instagram ingest idempotent. Hashtag polling is at-least-once by nature.

## Public read signatures

```ts
// convex/city.ts
export const page = query({
  args: {
    country: v.literal("nl"),
    citySlug: v.string(),
    kinds: v.optional(v.array(vSpotKind)),
    tail: v.object({ sort: v.union(v.literal("name"), v.literal("distance")), page: v.number() }),
  },
  returns: vCityPage,
  handler: async (ctx, args): Promise<CityPage> => {
    throw new Error("not implemented");
    // TODO 1. parse citySlug at this boundary, unknown city returns { kind: "unknown_city" }.
    // TODO 2. board = boardEntry.by_city_rank, eq(citySlug), gte(rank, 1). Already ordered. No brag is read.
    // TODO 3. hydrate the board's spot docs by id, parse status, drop any closed spot defensively.
    // TODO 4. tail = spots.by_city_listable (or by_city_kind when kinds is set), paginated,
    //         minus the spotIds already in the board.
    // TODO 5. hoursBySpot and pins are collected from the same spot docs, no extra reads.
  },
});
```

```ts
export type CityPage =
  | { kind: "unknown_city" }
  | {
      kind: "city";
      city: { slug: CitySlug; name: string; geo: LatLng };
      board: readonly BoardRow[];       // rank order, rank always present
      tail: { items: readonly TailRow[]; nextPage: number | null };
      hoursBySpot: Readonly<Record<string, OpeningHours>>;
      pins: readonly { spotId: SpotId; geo: LatLng; ranked: boolean }[];
    };

export type BoardRow = { rank: number; spot: SpotFacts; makers90d: number; lastBragAt: Timestamp };
export type TailRow = { spot: SpotFacts };   // deliberately has no rank field
```

`BoardRow` and `TailRow` are different types, which is how the two-block city page becomes a type-level fact rather than a CSS convention.

```ts
// convex/spot.ts
export const page = query({
  args: { country: v.literal("nl"), citySlug: v.string(), spotSlug: v.string() },
  returns: vSpotPage,
  handler: async (ctx, args): Promise<SpotPage> => {
    throw new Error("not implemented");
    // TODO spots.by_city_slug point read; boardEntry.by_spot point read; parse to BoardStanding.
    // TODO feed = bragCurrent.by_spot_feed desc, take 20.
    // TODO licensedImage = first visible in_app photo, via licensedImageFrom.
  },
});

export const feed = query({
  args: { spotId: v.id("spots"), cursor: v.union(v.string(), v.null()) },
  returns: vFeedPage,
  handler: async (ctx, args) => { throw new Error("not implemented"); },
});
```

```ts
export type SpotPage =
  | { kind: "unknown_spot" }
  | {
      kind: "spot";
      spot: SpotFacts;
      standing: BoardStanding;
      allTimeMakers: number;
      feed: FeedPage;
      licensedImage: LicensedImage | null;
    };

export type FeedItem = {
  bragId: BragId;
  occurredAt: Timestamp;
  maker: { slug: UserSlug; displayName: string } | { platform: "instagram"; handle: string | null };
  media:
    | { kind: "hosted_photo"; url: string; width: number; height: number }
    | { kind: "hosted_video"; url: string; durationMs: number }
    | { kind: "embed"; platform: "instagram" | "youtube"; permalink: string };
};
```

The feed's media type is a different type from `BragMedia`. Storage ids stay behind the boundary and the client gets urls, per `principle-boundary-discipline` on not re-exporting storage types.

```ts
// convex/passport.ts
export const page = query({
  args: { userSlug: v.string() },
  returns: vPassportPage,
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO uniqueSpots from bragCurrent.by_maker_spot, deduped by spotId.
    // TODO postsThisWeek from bragCurrent.by_maker_time with gte(startOfWeek).
    // TODO noindex when firstBragAt is absent. Both reads are bounded by this maker's brags,
    //      so the passport needs no projection of its own.
  },
});

// convex/search.ts
export const suggest = query({
  args: { q: v.string(), country: v.literal("nl") },
  returns: vSuggestions,
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO spots.search_name filtered to status open, then cities.by_slug prefix. Spots first.
    // TODO include the city name beside ambiguous spot names.
  },
});
```

## Public write signatures

The only path into the log.

```ts
// convex/brags.ts
export const create = mutation({
  args: { spotId: v.id("spots"), media: vBragMedia, occurredAt: v.optional(v.number()) },
  returns: v.object({ bragId: v.string(), wasExisting: v.boolean() }),
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO 1. maker = await requireMaker(ctx). No maker argument exists on purpose.
    // TODO 2. embed media is rejected here; embeds only enter through ingest.
    // TODO 3. bragEvents.by_maker_spot for an existing visible brag. If one exists, return it
    //         with wasExisting true. Idempotent, and it encodes "one maker, one vote".
    // TODO 4. append "created", then ctx.scheduler.runAfter(0, internal.project.applyBrag).
  },
});

export const replaceMedia = mutation({
  args: { bragId: v.string(), media: vBragMedia },
  returns: v.null(),
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO ownership check, append "media_replaced", schedule applyBrag.
    // The board does not move; occurredAt is not in this event's payload.
  },
});

export const remove = mutation({ /* appends "erased", deletes the storage file, schedules applyBrag */ });
export const report = mutation({ /* inserts a report and appends "hidden" with reason "reported" */ });
export const generateUploadUrl = mutation({ /* requireMaker, then ctx.storage.generateUploadUrl */ });
```

```ts
// convex/identity.ts
export const mergeInstagram = mutation({
  args: { igUserId: v.string() },
  returns: v.object({
    remappedBrags: v.number(),
    collapsedVotes: v.number(),
    reprojectedCities: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO 1. requireMaker, set users.igUserId so future ingest lands canonical at append.
    // TODO 2. bragEvents.by_maker_spot for maker "ig:{id}", collect distinct bragIds.
    // TODO 3. append one "maker_remapped" per brag. Already-canonical brags append nothing,
    //         which is what makes a second call a no-op.
    // TODO 4. schedule applyBrag per brag, then rerankCity once per affected city.
    //         Vote collapse needs no code; the tally counts distinct canonical makers.
  },
});
```

```ts
// convex/catalog.ts
export const addSpotFromPlaces = mutation({
  args: { placeId: v.string() },
  returns: v.object({ spotId: v.id("spots"), live: v.boolean() }),
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO requireMaker. Idempotent upsert by placeId via spots.by_place.
    // TODO classifyPlaceTypes decides live vs owner queue. Exhaustive over PlaceType.
  },
});

export const upsertFromPlaces = internalMutation({
  args: { place: vPlacesPayload },
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO parsePlace at this boundary into SpotFacts; payload goes to spotSource, never to spots.
    // TODO when status flips to closed_permanently, schedule rerankCity so the board drops it.
  },
});
```

## Projection (internal, private)

```ts
// convex/project.ts

/**
 * Reproject one brag and everything downstream of it.
 * Total function of (that brag's events, the spot's in-window brags, the city's entries, now).
 * Idempotent by full recompute. Convex transactions mean there is no partial state to reconcile,
 * so convergence under repeat is the only property needed.
 */
export const applyBrag = internalMutation({
  args: { bragId: v.string() },
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO 1. events = bragEvents.by_brag, eq(bragId).            bounded by one brag's history
    // TODO 2. state = foldBrag(events); write bragCurrent.        one patch
    // TODO 3. window = bragCurrent.by_spot_feed, eq(spotId), eq("visible"), gte(now - 90d)
    // TODO 4. tally = tallySpot(window, now)
    // TODO 5. allTime delta: by_maker_spot take 2 tells us whether this maker is new to the spot
    // TODO 6. patch boardEntry for the spot, then rerankCity(citySlug)
  },
});

/**
 * Renumber one city from its own entries. No brag is read.
 * Read set is bounded by spots-with-brags in the city, not by total brag volume.
 */
export const rerankCity = internalMutation({
  args: { citySlug: v.string() },
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO entries = boardEntry.by_city_rank, eq(citySlug), full range including unranked.
    // TODO inputs = entries.map(rankInputFor).filter(nonNull)  -- drops closed and empty-window
    // TODO patch only the rows whose rank actually changed. Most brags move nobody.
  },
});

/** Cron. Finds the rows whose count changed because time passed. */
export const sweepExpiredWindows = internalMutation({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO boardEntry.by_expiry, gte(windowExpiresAt, 1).lt(windowExpiresAt, now). Both bounds
    //      are required; a missing field sorts below every number.
    // TODO retally each spot, collect citySlugs, rerankCity once per city rather than once per spot.
  },
});

/** Rebuild both projections from the log. Run after changing the window or the fold. */
export const replay = internalAction({
  args: { fromCursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    throw new Error("not implemented");
    // TODO paginate distinct bragIds over bragEvents, applyBrag each, then rerankCity per city.
    // TODO safe under live traffic because every step converges instead of applying a delta.
  },
});
```

```ts
// convex/crons.ts
crons.interval("sweep expired ranking windows", { minutes: 15 },
  internal.project.sweepExpiredWindows, { limit: 200 });
crons.daily("catalog hygiene", { hourUTC: 3, minuteUTC: 0 }, internal.ingest.refreshCatalog, {});
```

## Ingest routing, compiler-enforced

```ts
// convex/domain/ingest.ts
export type IngestedPost = {
  platform: "instagram" | "youtube";
  externalId: string;
  permalink: string;
  authorPlatformId: string;
  caption: string;
  placeTag: { kind: "hard"; placeId: string } | { kind: "none" };
};

export type IngestRoute =
  | { kind: "append_brag"; placeId: string }
  | { kind: "owner_queue"; proposedPlaceId: string | null };

export function routePost(post: IngestedPost): IngestRoute {
  throw new Error("not implemented");
  // TODO hard tag goes straight to the log. Everything else goes to the queue.
  // Exhaustive switch on placeTag.kind, so a third tag variant breaks the build here.
}
```

A pending queue row is not an event, so it cannot influence rank. SPEC step 5's acceptance criterion holds structurally rather than by a status check in the ranking code, per `principle-model-the-domain`.

## Auth and locale boundaries

```ts
// convex/lib/auth.ts
/** The single place a session becomes a maker. Public queries never call it. */
export async function requireMaker(ctx: MutationCtx): Promise<{
  userId: Id<"users">;
  maker: CanonicalMakerKey;
}> { throw new Error("not implemented"); }
```

```ts
// convex/domain/i18n.ts
export type MessageKey = keyof typeof nl;
export type UserText = Brand<string, "UserText">;   // captions, bios, spot names from Places

export function t(key: MessageKey, vars?: Record<string, string>): string {
  throw new Error("not implemented");
}
```

`t` accepts `MessageKey` only, so passing a caption to the translator does not compile. SPEC's "UGC never machine-translated" becomes a build error rather than a rule in a document.

## What this design deliberately does not do

- No board computation on a page request. A city page reads `boardEntry` by index and never touches `bragEvents` or `bragCurrent`.
- No nightly full rebuild. `windowExpiresAt` makes the sweep proportional to actual change.
- No alias table and no alias lookup during ranking. Merges append per-brag remap events instead.
- No `preloadQuery` on public pages. Public pages are static and cacheable; only the signed-in brag panel subscribes live.
- No lock anywhere. Two concurrent reprojections of the same city both write the same rows, Convex's serializable transactions order them, and both compute the same answer from the log. The sharing is real but the write is a total function, so serialization is the database's job and not the design's, per `principle-separate-before-serializing-shared-state`.

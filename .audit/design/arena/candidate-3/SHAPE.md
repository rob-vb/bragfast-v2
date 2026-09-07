# Shape

Derived from `USAGE.md`. If a signature here disagrees with a call site there, change this file.

## Load-bearing types

Three names carry the product rules.

`Maker` is the identity document. A brag points at `MakerId`. Ranking counts distinct `MakerId` values. There is no `maker_key` string and no `user:` or `ig:` parser.

`MakerVote` is the ranking fact. Unique pair `(makerId, spotId)`. Extra brags from the same maker do not add rows here.

`SpotListing` is how a spot appears in the world. Listed spots have hours and can take new brags. Gravestones do not appear in city lists and reject new brags.

```ts
import type { Id } from "../convex/_generated/dataModel"

export type MakerId = Id<"makers">
export type SpotId = Id<"spots">
export type BragId = Id<"brags">
export type VoteId = Id<"makerVotes">

export type UserId = string & { readonly __brand: "UserId" }
export type InstagramUserId = string & { readonly __brand: "InstagramUserId" }
export type CitySlug = string & { readonly __brand: "CitySlug" }
export type SpotSlug = string & { readonly __brand: "SpotSlug" }
export type CountryCode = "nl"

export function parseUserId(raw: string): UserId {
	throw new Error("not implemented")
}

export function parseInstagramUserId(raw: string): InstagramUserId {
	throw new Error("not implemented")
}
```

Parse `UserId` at the Better Auth boundary. Parse `InstagramUserId` at the Instagram callback and ingest boundary. Interior code takes the branded types.

### Maker

```ts
export type PassportIdentity = {
	slug: string
	bio?: string
}

export type UserMaker = {
	kind: "user"
	id: MakerId
	userId: UserId
	instagramId?: InstagramUserId
	displayName: string
	avatarUrl?: string
	passport: PassportIdentity | null
}

export type InstagramMaker = {
	kind: "instagram_only"
	id: MakerId
	instagramId: InstagramUserId
	displayName: string
	avatarUrl?: string
}

export type Maker = UserMaker | InstagramMaker
```

A maker has at least one linked account. `InstagramMaker` cannot carry a passport slug, so an unconnected Instagram poster cannot occupy `/nl/u/{slug}`. `UserMaker.passport` stays `null` until the first live brag. After that the slug is stable.

`connectInstagram` never creates a second maker for a user. It either stamps `instagramId` onto the caller or absorbs an `InstagramMaker` into the caller.

### MakerVote

```ts
export type MakerVote = {
	id: VoteId
	makerId: MakerId
	spotId: SpotId
	citySlug: CitySlug
	firstBraggedAt: number
	lastBraggedAt: number
}
```

A row exists only while that maker has at least one live brag on that spot. `lastBraggedAt` is the newest live brag timestamp. The 90-day window is not a field. Board membership is `lastBraggedAt > nowMs - RANKING_WINDOW_MS` at read time.

`citySlug` is copied from the spot at upsert. City board is the dominant read. It must not scan every vote in the country and then join.

### Brag

```ts
export type HostedMedia = {
	kind: "hosted"
	storageId: Id<"_storage">
	contentType: "image" | "video"
}

export type EmbedMedia = {
	kind: "embed"
	platform: "instagram" | "youtube"
	permalink: string
}

export type BragMedia = HostedMedia | EmbedMedia

export type LiveBrag = {
	kind: "live"
	id: BragId
	makerId: MakerId
	spotId: SpotId
	source: "in_app" | "instagram" | "youtube_embed"
	media: BragMedia
	createdAt: number
	replacedAt?: number
}

export type HiddenBrag = {
	kind: "hidden"
	id: BragId
	makerId: MakerId
	spotId: SpotId
	source: "in_app" | "instagram" | "youtube_embed"
	media: BragMedia
	createdAt: number
	replacedAt?: number
	hiddenAt: number
	hiddenReason: "report_pending" | "owner_hide"
}

export type StoredBrag = LiveBrag | HiddenBrag
```

Deleted brags are deleted. AVG does not leave a tombstone in this table. Public queries return `LiveBrag` only. A hidden brag cannot leak into JSON-LD or the spot feed because those functions do not accept `StoredBrag`.

In-app rule: at most one live `source: "in_app"` brag per `(makerId, spotId)`. Replace patches that row. Instagram and YouTube may add many live rows for the same pair. All of them share one `MakerVote`.

### SpotListing

```ts
export type SpotType = "cafe_lunch" | "bakery" | "hotel" | "other"

export type Hours = {
	weekly: unknown
	timeZone: string
}

export type ListedSpot = {
	listing: "listed"
	id: SpotId
	placeId: string
	slug: SpotSlug
	citySlug: CitySlug
	country: CountryCode
	name: string
	address: string
	geo: { lat: number; lng: number }
	types: SpotType[]
	hours: Hours
}

export type GravestoneSpot = {
	listing: "gravestone"
	id: SpotId
	placeId: string
	slug: SpotSlug
	citySlug: CitySlug
	country: CountryCode
	name: string
	address: string
	geo: { lat: number; lng: number }
	types: SpotType[]
	closedAt: number
}

export type SpotListing = ListedSpot | GravestoneSpot
export type Spot = SpotListing

export function isOpenAt(hours: Hours, nowMs: number): boolean {
	throw new Error("not implemented")
}
```

Temporarily closed follows `Hours`. It is not a listing variant. Permanently closed is `GravestoneSpot`. `hours` does not exist on that variant, so "open now" cannot be asked of a gravestone.

## Page DTOs

These are what `preloadQuery` returns. They are the public API.

```ts
export const RANKING_WINDOW_MS = 90 * 24 * 60 * 60 * 1000

export type BoardEntry = {
	rank: number
	spot: ListedSpot
	makersInWindow: number
	lastBragAt: number
}

export type TailEntry = {
	spot: ListedSpot
}

export type CityPage = {
	city: { slug: CitySlug; name: string; country: CountryCode }
	board: BoardEntry[]
	tail: TailEntry[]
}

export type RankInCity = { n: number } | { unranked: true }

export type FeedItem = {
	brag: LiveBrag
	maker: { id: MakerId; displayName: string; passportSlug?: string }
}

export type ListedSpotPage = {
	kind: "listed"
	spot: ListedSpot
	rank: RankInCity
	allTimeMakers: number
	feed: FeedItem[]
}

export type GravestoneSpotPage = {
	kind: "gravestone"
	spot: GravestoneSpot
	allTimeMakers: number
	feed: FeedItem[]
}

export type SpotPage = ListedSpotPage | GravestoneSpotPage

export type PassportPage = {
	maker: UserMaker
	uniqueSpotCount: number
	postsThisWeek: number
	spots: Array<{
		spot: Spot
		recommendable: boolean
		lastBragAt: number
	}>
}
```

`BoardEntry.rank` starts at 1. `makersInWindow` is at least 1. `rankCity` in `src/domain/ranking.ts` is the only function that builds `BoardEntry`. A gravestone has no `rank` field.

`FeedItem.passportSlug` is set only for a `UserMaker` with a non-null passport. Instagram-only makers render as a display name next to the embed.

Passport `recommendable` is false for gravestones. They stay on the map as history.

## Ranking, pure

```ts
export function rankCity(
	listed: ListedSpot[],
	votes: MakerVote[],
	nowMs: number,
	filters: {
		openNow?: boolean
		hasBrags?: boolean
		type?: SpotType
	},
): { board: BoardEntry[]; tail: TailEntry[] } {
	throw new Error("not implemented")
}
```

Implementation sketch:

1. Filter listed spots by `type` and `openNow` first, so ranks are among the visible set, not the unfiltered city with holes.
2. Keep votes whose `lastBraggedAt > nowMs - RANKING_WINDOW_MS` and whose `spotId` is still in that set.
3. Group those votes by `spotId`. Count makers. Take max `lastBraggedAt`.
4. Board is surviving spots with count ≥ 1, sorted by count desc, then `lastBraggedAt` desc. Assign rank 1..n.
5. Tail is the remaining surviving spots.
6. If `hasBrags`, drop the tail.

Seeds never receive a rank. A listed spot with zero in-window votes can only land in `tail`.

All-time maker count on a spot page is `makerVotes` rows for that `spotId`, window ignored.

## Vote writes, not a public API

```ts
export async function upsertVoteFromLiveBrag(args: {
	makerId: MakerId
	spotId: SpotId
	citySlug: CitySlug
	braggedAt: number
}): Promise<MakerVote> {
	throw new Error("not implemented")
}

export async function recomputeVoteForPair(args: {
	makerId: MakerId
	spotId: SpotId
}): Promise<MakerVote | null> {
	throw new Error("not implemented")
}

export async function absorbMakerVotes(args: {
	from: MakerId
	into: MakerId
}): Promise<{ collapsedSpotIds: SpotId[] }> {
	throw new Error("not implemented")
}
```

`upsertVoteFromLiveBrag` looks up `pairKey = makerId + "|" + spotId`. If a row exists, patch `lastBraggedAt` to `max(existing, braggedAt)`. If not, insert with `firstBraggedAt = lastBraggedAt = braggedAt`. Convex OCC retries make a double insert of the same pair converge to one row.

`recomputeVoteForPair` loads live brags for the pair. No live brags means delete the vote. Otherwise set `lastBraggedAt` to the max live timestamp. Hide, owner-hide, and delete all go through this. They do not patch `lastBraggedAt` by hand.

`absorbMakerVotes` runs inside `connectInstagram`. For each vote on `from`, if `into` already has that `spotId`, keep `into`, set `lastBraggedAt` to the max of the two, delete `from`'s row. If not, retarget `from`'s row onto `into` by rewriting `makerId` and `pairKey`.

## Convex schema

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	makers: defineTable({
		kind: v.union(v.literal("user"), v.literal("instagram_only")),
		userId: v.optional(v.string()),
		instagramId: v.optional(v.string()),
		displayName: v.string(),
		avatarUrl: v.optional(v.string()),
		slug: v.optional(v.string()),
		bio: v.optional(v.string()),
	})
		.index("by_userId", ["userId"])
		.index("by_instagramId", ["instagramId"])
		.index("by_slug", ["slug"]),

	spots: defineTable({
		placeId: v.string(),
		slug: v.string(),
		citySlug: v.string(),
		country: v.literal("nl"),
		name: v.string(),
		address: v.string(),
		geo: v.object({ lat: v.number(), lng: v.number() }),
		types: v.array(
			v.union(
				v.literal("cafe_lunch"),
				v.literal("bakery"),
				v.literal("hotel"),
				v.literal("other"),
			),
		),
		listing: v.union(v.literal("listed"), v.literal("gravestone")),
		hours: v.optional(v.any()),
		closedAt: v.optional(v.number()),
		placesRaw: v.optional(v.any()),
	})
		.index("by_placeId", ["placeId"])
		.index("by_city_listing", ["country", "citySlug", "listing"])
		.index("by_city_slug", ["country", "citySlug", "slug"]),

	makerVotes: defineTable({
		pairKey: v.string(),
		makerId: v.id("makers"),
		spotId: v.id("spots"),
		citySlug: v.string(),
		firstBraggedAt: v.number(),
		lastBraggedAt: v.number(),
	})
		.index("by_pairKey", ["pairKey"])
		.index("by_maker_spot", ["makerId", "spotId"])
		.index("by_city_last", ["citySlug", "lastBraggedAt"])
		.index("by_spot", ["spotId"])
		.index("by_maker", ["makerId"]),

	brags: defineTable({
		makerId: v.id("makers"),
		spotId: v.id("spots"),
		source: v.union(
			v.literal("in_app"),
			v.literal("instagram"),
			v.literal("youtube_embed"),
		),
		mediaKind: v.union(v.literal("hosted"), v.literal("embed")),
		storageId: v.optional(v.id("_storage")),
		contentType: v.optional(v.union(v.literal("image"), v.literal("video"))),
		platform: v.optional(v.union(v.literal("instagram"), v.literal("youtube"))),
		permalink: v.optional(v.string()),
		createdAt: v.number(),
		replacedAt: v.optional(v.number()),
		status: v.union(v.literal("live"), v.literal("hidden")),
		hiddenAt: v.optional(v.number()),
		hiddenReason: v.optional(
			v.union(v.literal("report_pending"), v.literal("owner_hide")),
		),
	})
		.index("by_spot_created", ["spotId", "createdAt"])
		.index("by_maker_spot", ["makerId", "spotId"])
		.index("by_maker", ["makerId"])
		.index("by_maker_spot_source_status", ["makerId", "spotId", "source", "status"]),

	cities: defineTable({
		slug: v.string(),
		name: v.string(),
		country: v.literal("nl"),
		featuredOrder: v.optional(v.number()),
	}).index("by_country_slug", ["country", "slug"]),

	aiMatchQueue: defineTable({
		instagramMediaId: v.string(),
		makerId: v.id("makers"),
		proposedSpotId: v.optional(v.id("spots")),
		caption: v.string(),
		permalink: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("approved"),
			v.literal("rejected"),
		),
	}).index("by_status", ["status"]),

	reports: defineTable({
		bragId: v.optional(v.id("brags")),
		spotId: v.optional(v.id("spots")),
		reason: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("resolved"),
			v.literal("rejected"),
		),
	}).index("by_status", ["status"]),
})
```

Storage uses optional fields for media and listing variants. `fromDoc` in `convex/lib/fromDoc.ts` is the parse boundary. It rejects `listing: "listed"` without `hours`, `status: "hidden"` without `hiddenAt`, hosted media without `storageId`, and embed media without `permalink`. Queries return domain objects. They do not return raw docs.

Convex does not give a unique constraint besides `_id`. Uniqueness of `(makerId, spotId)` is the `pairKey` lookup plus upsert inside one mutation. Uniqueness of `userId` and `instagramId` is the same pattern on `makers`. If Convex unique indexes exist when this is built, add them on `pairKey`, `userId`, `instagramId`, `slug`, and `placeId`. The mutation shape does not change.

`placesRaw` never leaves Convex.

## Public Convex signatures

Bodies throw until Phase D.

```ts
// convex/catalog.ts
export const cityPage = query({
	args: {
		country: v.literal("nl"),
		citySlug: v.string(),
		nowMs: v.number(),
		openNow: v.optional(v.boolean()),
		hasBrags: v.optional(v.boolean()),
		type: v.optional(
			v.union(
				v.literal("cafe_lunch"),
				v.literal("bakery"),
				v.literal("hotel"),
				v.literal("other"),
			),
		),
	},
	handler: async (ctx, args): Promise<CityPage | null> => {
		throw new Error("not implemented")
		// load city
		// load listed spots by_city_listing
		// load votes by_city_last where lastBraggedAt > nowMs - RANKING_WINDOW_MS
		// return { city, ...rankCity(listed, votes, nowMs, filters) }
	},
})

export const spotPage = query({
	args: {
		country: v.literal("nl"),
		citySlug: v.string(),
		spotSlug: v.string(),
		nowMs: v.number(),
	},
	handler: async (ctx, args): Promise<SpotPage | null> => {
		throw new Error("not implemented")
		// listed vs gravestone chooses the DTO variant
		// rank from in-window vote count among listed spots in that city
		// feed: live brags by_spot_created desc
		// allTimeMakers: count makerVotes by_spot
	},
})

export const search = query({
	args: { country: v.literal("nl"), q: v.string() },
	handler: async (ctx, args): Promise<{
		spots: ListedSpot[]
		cities: Array<{ slug: CitySlug; name: string }>
	}> => {
		throw new Error("not implemented")
	},
})

export const homepage = query({
	args: { country: v.literal("nl"), nowMs: v.number() },
	handler: async (ctx, args): Promise<{
		featuredCities: Array<{ slug: CitySlug; name: string; hasMakers: boolean }>
	}> => {
		throw new Error("not implemented")
	},
})
```

```ts
// convex/brags.ts
export const myLiveInAppAtSpot = query({
	args: { spotId: v.id("spots") },
	handler: async (ctx, args): Promise<LiveBrag | null> => {
		throw new Error("not implemented")
		// require auth, load UserMaker by userId, find live in_app brag for pair
	},
})

export const inApp = mutation({
	args: {
		spotId: v.id("spots"),
		storageId: v.id("_storage"),
		contentType: v.union(v.literal("image"), v.literal("video")),
	},
	handler: async (ctx, args): Promise<LiveBrag> => {
		throw new Error("not implemented")
		// require auth
		// load UserMaker by userId, create on first session if missing
		// load spot; if gravestone, throw
		// if live in_app brag exists for pair, throw "use replace"
		// insert live hosted brag
		// upsertVoteFromLiveBrag
		// if UserMaker.passport is null, assign slug
	},
})

export const replace = mutation({
	args: {
		bragId: v.id("brags"),
		storageId: v.id("_storage"),
		contentType: v.union(v.literal("image"), v.literal("video")),
	},
	handler: async (ctx, args): Promise<LiveBrag> => {
		throw new Error("not implemented")
		// caller must own the brag, source must be in_app, status live
		// patch media and replacedAt
		// upsertVoteFromLiveBrag with now
	},
})

export const remove = mutation({
	args: { bragId: v.id("brags") },
	handler: async (ctx, args): Promise<void> => {
		throw new Error("not implemented")
		// caller owns it; delete storage if hosted; delete row; recomputeVoteForPair
	},
})

export const report = mutation({
	args: { bragId: v.id("brags"), reason: v.string() },
	handler: async (ctx, args): Promise<void> => {
		throw new Error("not implemented")
		// insert reports row; set brag hidden / report_pending; recomputeVoteForPair
	},
})
```

```ts
// convex/makers.ts
export const connectInstagram = mutation({
	args: { instagramUserId: v.string() },
	handler: async (
		ctx,
		args,
	): Promise<
		| { kind: "already_linked" }
		| { kind: "linked" }
		| { kind: "merged"; absorbedMakerId: MakerId }
	> => {
		throw new Error("not implemented")
		// parseInstagramUserId at this boundary
		// load caller UserMaker by auth userId
		// if caller.instagramId === id, return already_linked
		// if caller.instagramId is some other id, throw
		// lookup makers.by_instagramId
		// none: patch caller.instagramId, return linked
		// found self: already_linked
		// found InstagramMaker:
		//   rewrite brags.makerId from absorbed to caller
		//   absorbMakerVotes
		//   delete absorbed maker
		//   patch caller.instagramId
		//   if caller.passport is null and caller now has any live brag, assign slug
		//   return merged
		// found UserMaker that is not the caller: throw, unique instagramId invariant broken
	},
})

export const passportBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args): Promise<PassportPage | null> => {
		throw new Error("not implemented")
		// null when no maker, when instagram_only, or when passport is null
	},
})
```

```ts
// convex/spots.ts
export const addFromPlace = mutation({
	args: { placeId: v.string() },
	handler: async (ctx, args): Promise<ListedSpot | { queued: true }> => {
		throw new Error("not implemented")
		// signed-in; allowed hospitality types insert listed; others owner-queue
	},
})
```

`ensureUserMaker` runs from the Better Auth user-create hook and from `inApp` if the hook was skipped. Lookup `by_userId`, insert `kind: "user"` if missing. Same end state if it runs twice.

Instagram ingest, step 5, uses the same helpers. Hard place tag: find or create `InstagramMaker` by `instagramId`, insert embed `LiveBrag`, `upsertVoteFromLiveBrag`. Caption-only writes `aiMatchQueue` and does not insert a brag or a vote.

## SSR rule

Public pages use `preloadQuery` in the RSC plus `preloadedQueryResult` to build HTML. Client islands take the `Preloaded` object. Sitemap and other non-hydrated documents may use `fetchQuery`. Do not fetch Convex over HTTP from the app. Do not load the city board from a client `useQuery` on mount. That would empty `view-source`.

Pass `getToken()` into `preloadQuery` only for queries that read the caller. Catalog queries omit the token.

## Illegal states this shape refuses

- A maker with no account.
- An `InstagramMaker` with a passport slug.
- Two `MakerVote` rows for one `(makerId, spotId)`.
- A `MakerVote` with no live brag.
- A `BoardEntry` for a spot with zero in-window votes.
- A gravestone in `CityPage.board` or `CityPage.tail`.
- A new brag on a gravestone.
- A hidden brag in `FeedItem`.
- `listing: "listed"` without hours, after `fromDoc`.
- Next.js importing `Doc<"makers">` or a `maker_key` helper.

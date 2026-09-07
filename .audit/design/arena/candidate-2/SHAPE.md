# Shape

## Load-bearing types

`MakerKey`, `BragDocument`, and `RankingWindow` carry the ranking rules. Constructors stay inside the domain modules.

```ts
declare const makerKeyBrand: unique symbol;

export type UserMakerKey =
	& `user:${string}`
	& { readonly [makerKeyBrand]: "user" };

export type InstagramMakerKey =
	& `ig:${string}`
	& { readonly [makerKeyBrand]: "instagram" };

export type MakerKey = UserMakerKey | InstagramMakerKey;

export function userMakerKey(userId: AuthUserId): UserMakerKey {
	throw new Error("not implemented");
}

export function instagramMakerKey(
	instagramUserId: InstagramUserId,
): InstagramMakerKey {
	throw new Error("not implemented");
}

export function parseMakerKey(raw: string): MakerKey {
	throw new Error("not implemented");
}
```

Callers cannot construct a valid `MakerKey` from an arbitrary string. Auth creates `UserMakerKey`. Instagram ingest creates `InstagramMakerKey`.

```ts
type HostedSource = {
	kind: "hosted";
	ownerUserId: AuthUserId;
	media:
		| { kind: "photo"; storageId: StorageId }
		| { kind: "video"; storageId: StorageId };
};

type InstagramSource = {
	kind: "instagram";
	externalPostId: InstagramPostId;
	embedUrl: HttpsUrl;
	permalink: HttpsUrl;
};

type BragBase = {
	spotId: SpotId;
	cityKey: CityKey;
	makerKey: MakerKey;
	source: HostedSource | InstagramSource;
	publishedAt: PublishedAtMs;
	replacedAt?: ReplacedAtMs;
};

type VisibleAnchorBrag = BragBase & {
	visibility: "visible";
	role: "maker_anchor";
};

type VisibleAdditionalBrag = BragBase & {
	visibility: "visible";
	role: "additional_post";
	anchorBragId: BragId;
};

type HiddenBrag = BragBase & {
	visibility: "hidden";
	role: "hidden";
	hidden: {
		at: HiddenAtMs;
		by: AuthUserId | "system";
		reason: "pending_report" | "owner_moderation";
	};
};

export type BragDocument =
	| VisibleAnchorBrag
	| VisibleAdditionalBrag
	| HiddenBrag;
```

A visible maker and spot pair has exactly one `maker_anchor`. Other visible posts point to that anchor. The anchor does not contain a score or a vote counter. A vote exists when at least one visible `BragDocument` exists for a distinct `makerKey` and `spotId`.

Hiding an anchor promotes the newest remaining visible post in the same mutation. Hiding an additional post changes no other document. Deleting a brag uses the same promotion rule before removing the document and any hosted file.

```ts
declare const rankingWindowBrand: unique symbol;

export type RankingWindow = {
	readonly asOf: TimestampMs;
	readonly startsAt: TimestampMs;
	readonly [rankingWindowBrand]: true;
};

export function currentRankingWindow(clock: Clock): RankingWindow {
	throw new Error("not implemented");
}
```

`currentRankingWindow` always derives `startsAt` as 90 days before `asOf`. No API accepts an arbitrary ranking duration. No document stores `isInRankingWindow`, so a vote cannot become stale when time passes.

## Spot state

```ts
type OpenSpot = {
	lifecycle: "open";
	id: SpotId;
	placeId: GooglePlaceId;
	cityKey: CityKey;
	slug: SpotSlug;
	name: string;
	address: PostalAddress;
	geo: GeoPoint;
	hours: OpeningHours;
	types: readonly SpotType[];
};

type ClosedSpot = Omit<OpenSpot, "lifecycle"> & {
	lifecycle: "closed_permanently";
	closedAt: TimestampMs;
};

export type SpotDocument = OpenSpot | ClosedSpot;

export function requireOpenSpot(spot: SpotDocument): OpenSpot {
	throw new Error("not implemented");
}
```

Brag mutations load the spot and call `requireOpenSpot` before they write. Closed spots keep their URL and historical brags. Board and catalog constructors accept only `OpenSpot`, so a closed spot cannot enter a city listing.

## Convex schema sketch

The schema uses discriminated unions for spot and brag state. Indexes narrow each mutation to one conflict range.

```ts
spots: defineTable(spotDocumentValidator)
	.index("by_place_id", ["placeId"])
	.index("by_route", ["countryCode", "citySlug", "slug"])
	.index("by_city_lifecycle_name", [
		"countryCode",
		"citySlug",
		"lifecycle",
		"nameSortKey",
	]),

brags: defineTable(bragDocumentValidator)
	.index("by_spot_visible_published", [
		"spotId",
		"visibility",
		"publishedAt",
	])
	.index("by_city_visible_published", [
		"cityKey",
		"visibility",
		"publishedAt",
	])
	.index("by_spot_maker_visible_role", [
		"spotId",
		"makerKey",
		"visibility",
		"role",
	])
	.index("by_maker_visible_published", [
		"makerKey",
		"visibility",
		"publishedAt",
	])
	.index("by_maker", ["makerKey"])
	.index("by_hosted_owner_spot", [
		"source.ownerUserId",
		"spotId",
		"source.kind",
	])
	.index("by_instagram_post", [
		"source.externalPostId",
		"source.kind",
	]),

profiles: defineTable(profileValidator)
	.index("by_auth_user", ["authUserId"])
	.index("by_slug", ["slug"])
	.index("by_instagram_user", ["instagramUserId"]),

aiMatchQueue: defineTable(aiMatchValidator)
	.index("by_status_created", ["status", "createdAt"])
	.index("by_instagram_post", ["instagramPostId"]),

reports: defineTable(reportValidator)
	.index("by_status_created", ["status", "createdAt"])
	.index("by_brag", ["bragId"]),
```

Convex indexes are not unique indexes. Each mutation reads the exact indexed range before it writes. Convex tracks that range in the transaction. If concurrent mutations read the same empty range and insert anchors, one transaction retries against the committed result. The retried mutation inserts an `additional_post`, not a second anchor.

`cityKey` is copied from the checked `OpenSpot` when a brag is written. Callers never provide it. Catalog code treats a spot's city as immutable after its first brag. A future city correction needs a dedicated migration that rewrites the spot and its brags together.

## Public read models

```ts
export type CityPageRequest = {
	countryCode: CountryCode;
	citySlug: CitySlug;
	filters: CityFilters;
};

export type CityPage = {
	city: CitySummary;
	board: readonly NumberedBoardSpot[];
	catalogTail: readonly CatalogSpot[];
	mapPins: readonly SpotMapPin[];
};

export type SpotPageRequest = {
	country: string;
	city: string;
	spot: string;
};

export type SpotPage = {
	spot: PublicSpot;
	hours: PublicOpeningHours;
	rank: CityRank | null;
	allTimeMakerCount: number;
	feed: CursorPage<PublicBrag>;
	jsonLd: FoodEstablishmentJsonLd;
};

export interface PublicCatalog {
	cityPage(input: CityPageRequest): Promise<CityPage>;
	spotPage(input: SpotPageRequest): Promise<SpotPage>;
}
```

The server-only `PublicCatalog` implementation adds the server clock, locale, and Convex transport arguments. It calls `fetchQuery` and parses the result into these models. Next.js pages do not import database documents or generated Convex `Doc` types.

## Convex function signatures

```ts
export const getCityPage = query({
	args: cityPageArgsValidator,
	returns: cityPageValidator,
	handler: async (ctx, args): Promise<CityPage> => {
		throw new Error("not implemented");
	},
});

export const getSpotPage = query({
	args: spotPageArgsValidator,
	returns: spotPageValidator,
	handler: async (ctx, args): Promise<SpotPage> => {
		throw new Error("not implemented");
	},
});

export const submitInApp = mutation({
	args: submitInAppArgsValidator,
	returns: bragWriteResultValidator,
	handler: async (ctx, args): Promise<BragWriteResult> => {
		throw new Error("not implemented");
	},
});

export const replaceInApp = mutation({
	args: replaceInAppArgsValidator,
	returns: bragWriteResultValidator,
	handler: async (ctx, args): Promise<BragWriteResult> => {
		throw new Error("not implemented");
	},
});

export const hide = mutation({
	args: hideBragArgsValidator,
	returns: hideBragResultValidator,
	handler: async (ctx, args): Promise<HideBragResult> => {
		throw new Error("not implemented");
	},
});

export const removeOwn = mutation({
	args: removeOwnBragArgsValidator,
	returns: removeBragResultValidator,
	handler: async (ctx, args): Promise<RemoveBragResult> => {
		throw new Error("not implemented");
	},
});

export const importInstagram = internalMutation({
	args: importInstagramArgsValidator,
	returns: bragWriteResultValidator,
	handler: async (ctx, args): Promise<BragWriteResult> => {
		throw new Error("not implemented");
	},
});

export const mergeInstagram = internalMutation({
	args: mergeInstagramMakerArgsValidator,
	returns: makerMergeResultValidator,
	handler: async (ctx, args): Promise<MakerMergeResult> => {
		throw new Error("not implemented");
	},
});
```

## Write rules

`submitInApp` authenticates the user, loads an `OpenSpot`, and derives `UserMakerKey`. It rejects a second hosted document for the same owner and spot. The caller must use `replaceInApp` for that case.

`replaceInApp` checks ownership and patches only the media and `replacedAt` fields. It preserves `_id`, `publishedAt`, `makerKey`, `spotId`, and `role`. Replacing media does not refresh board recency.

`importInstagram` first reads `by_instagram_post`. A repeated import returns the existing brag. A new post reads `by_spot_maker_visible_role`. It inserts an anchor when the range has none and an additional post otherwise.

`hide` and `removeOwn` reconcile the anchor before they finish. If visible posts remain, exactly one becomes the anchor. If none remain, the maker no longer contributes to the spot.

`mergeInstagram` reads all brags for both maker keys. It groups them by spot, rewrites the Instagram key to the user key, and picks one visible anchor per group. The newest visible brag wins, with document ID as the final deterministic tie-break. Repeating the mutation makes no further changes.

## Board derivation

`getCityPage` reads visible brags in the `RankingWindow` through `by_city_visible_published`. It groups by `spotId` and then by `makerKey`. Each maker contributes one count, whether the group contains an anchor alone or many posts. The most recent `publishedAt` in the spot group supplies the tie-break.

The query removes permanently closed spots before sorting. Spots with at least one distinct maker form the numbered board. All other open spots from `by_city_lifecycle_name` form the unnumbered catalog tail.

`getSpotPage` uses `by_spot_visible_published` for the feed. It groups all visible results by `makerKey` for the all-time count. The 90-day city rank uses the same board function as the city page, so the two pages cannot disagree.

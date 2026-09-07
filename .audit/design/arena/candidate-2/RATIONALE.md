# Rationale

## Problem

brag.fast ranks a spot by distinct makers with visible brags in the last 90 days, while the feed can hold many posts from one maker. Convex has serializable mutations and indexes, but it has no declarative unique index. The design must also merge Instagram identities, hide reported posts, keep closed pages as gravestones, and render public pages as HTML without turning a stored counter into a second source of truth.

## Usage (caller's view)

A city route requests a finished directory model.

```ts
const page = await publicCatalog.cityPage({
	countryCode: "nl",
	citySlug: "haarlem",
	filters,
});
```

A spot route requests its page model, including rank, feed, and JSON-LD.

```ts
const page = await publicCatalog.spotPage({
	country: "nl",
	city: "haarlem",
	spot: "de-bakkerswinkel",
});
```

The in-app flow creates one hosted post and replaces that same document later.

```ts
const created = await submitInApp({ spotId, uploadId, mediaKind: "photo" });
const replaced = await replaceInApp({
	bragId: created.bragId,
	uploadId: replacementUploadId,
	mediaKind: "video",
});
```

The routes do not pass a ranking window, count makers, or inspect Convex documents.

## Shape

`BragDocument` is the only post record and the source for feed and rank. Each visible maker and spot group has one `maker_anchor`. Later posts are `additional_post` documents that point to the anchor. Indexed reads inside each write transaction prevent two anchors from committing for the same maker and spot. Board queries still group visible documents by `MakerKey`, so rank does not depend on the anchor marker. This follows `principle-model-the-domain`.

`MakerKey` is a branded union of `UserMakerKey` and `InstagramMakerKey`. Boundary constructors create the variants from Better Auth or validated Instagram data. Provider strings and generated Convex documents stay private. This follows `principle-type-system-discipline` and `principle-boundary-discipline`.

`RankingWindow` has one constructor that derives a 90-day range from the server clock. No row stores an expiring `countsNow` flag. `SpotDocument` and `BragDocument` are discriminated unions, so closed, hidden, visible-anchor, and visible-additional states have distinct required fields. This follows `principle-foundational-thinking`.

`PublicCatalog` has two public page methods. It hides `fetchQuery`, clock arguments, return validation, joins, ranking, media licensing, and JSON-LD construction. Callers still choose route keys and filters because those are product inputs. The interface is small relative to the policy it hides, and the call chain remains three files or fewer. This follows `principle-minimize-reader-load`.

The system deliberately stores no `MakerVote`, rank row, score, or 90-day membership flag. A vote is derived from visible `BragDocument` values. Write operations reconcile the anchor group and converge when retried. This follows `principle-make-operations-idempotent`.

## Synthesis decision

orchestrator fills this

## Tradeoffs accepted

- We accept grouping visible brags at read time in exchange for one source of truth for both the feed and the board.
- We accept one denormalized `cityKey` on each brag in exchange for an indexed city-board query without a table scan.
- We accept a dedicated migration for a spot's city correction after its first brag in exchange for keeping normal writes and reads small.
- We accept one transaction that may hit Convex mutation limits for a very large maker merge in exchange for atomic rank correctness in v1.
- We accept an internal anchor role in exchange for an enforceable single representative per maker and spot without a vote table.

## Alternatives considered

A `MakerVote` table lost because every brag mutation, hide, delete, and identity merge would have to synchronize a second record. It can make board reads cheaper, but it creates two writable representations of whether a maker counts.

A pure post model with no anchor role lost because grouping would keep rank correct but write-time inspection could not prove that a maker and spot has one canonical representative. The design would rely only on every future query remembering `distinct makerKey`.

A single mutable brag per maker and spot lost because it cannot preserve multiple social posts in the feed. It hides vote uniqueness but exposes content loss to users and import code.

## Open questions and risks

- At what maker-post count should `mergeInstagram` move from one atomic mutation to an explicit maintenance workflow?
- Does replacing hosted media preserve the original `publishedAt`, as this design assumes, or does the product treat replacement as a new visit?
- Must an admin city correction remain unavailable after a spot has brags until the dedicated rewrite migration exists?
- What retention period applies to hidden social posts and moderation evidence after a report closes?

## Next implementation step

Define the branded IDs, the `SpotDocument` and `BragDocument` validators, and the named indexes in `convex/schema.ts` before writing any page or mutation body.

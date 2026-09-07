# Rejected alternatives

Whole shapes, not variations. Each entry names what it hides from callers, what it exposes, and the access pattern or failure mode that killed it.

## 1. Scan brags on every city page request

The naive shape. `api.city.page` reads brags for the city, groups by maker, filters to 90 days, sorts, numbers.

What it hides. The same thing my shape hides, which is why this is the honest baseline. The caller still gets ordered board rows.

What killed it.

Read cost scales with total brag volume in the city, not with catalog size. A city with 200 spots and 3000 brags in the window reads 3000 documents per page view. Convex's per-transaction limit is around 16k documents, so Amsterdam at a few thousand brags a quarter is inside the limit but reads megabytes per request, and the design degrades exactly as the product succeeds. That is backwards.

The query depends on `now`, so the page cannot be statically rendered or ISR-cached. For a product whose entire distribution argument is crawlable server-rendered HTML, forfeiting caching is not a performance detail.

The spot page needs the spot's rank within its city, which under this shape means recomputing the whole city to answer a single-spot question.

Grounding explicitly rules it out for this candidate, and I agree with the ruling on the access-pattern trace alone.

## 2. Explicit `makerVote` table written alongside each brag

The strongest loser, and the shape SPEC names first. One row per (maker, spot) with a unique index. A brag insert also inserts or touches a vote row. Board reads aggregate vote rows.

What it hides. One-maker-one-vote becomes a storage invariant rather than a computation, which is genuinely better than deriving it. Fewer moving parts than a log plus projections.

What killed it.

Three operations the product has already committed to become manual reconciliation at every write site.

A merge must find the `ig:{id}` vote rows, detect collisions with the user's own rows on the same spot, delete the loser, and pick which timestamp survives. That logic exists in exactly one place today and will be copied the first time a second merge path appears.

Unhiding a reported brag must decide whether to resurrect a vote, which requires knowing whether the maker has another visible brag on the spot. That is a query the vote table cannot answer, so it needs the brags anyway.

Changing the window from 90 days to 60 is a data migration, because the vote row encodes a decision made under the old rule.

Underneath all three is one fact stored twice, in the brag and in the vote, kept in sync by hand. That is the information leakage the red-flag list names. My shape pays one extra write per brag and buys all three operations as recomputations.

Worth saying plainly. If the ranking rule were frozen forever and there were no merge, this would be the better design and my log would be over-engineering.

## 3. One serialized board document per city

`cityBoard` holds a single document per city with the ordered array of entries. One read per page, no index range, tiny table.

What it hides. Everything, behind one document read. Cheapest possible read path.

What killed it.

The spot page needs one spot's standing. Under this shape it loads the entire city document and scans the array, so a point question costs a whole-city read.

Every brag in a city rewrites the same document. Convex detects the write-write conflict and retries, so concurrent brags in a busy city serialize into a queue on one row. That is `principle-separate-before-serializing-shared-state` failing at step one, and the fix is exactly the per-spot rows I already have.

`windowExpiresAt` cannot be indexed per spot, so expiry becomes a full scan of every city document instead of a range query over the rows that actually moved.

## 4. Convex documents as the domain model

Delete `convex/domain/`. Return `Doc<"boardEntry">` and `Doc<"spots">` from queries. Let React components read the fields.

What it hides. Nothing, and that is the point of the proposal. It is the smallest possible design and it removes nine files.

What killed it.

The stored shape is chosen to satisfy Convex indexes, not readers. `rank?: number` exists because a missing field sorts below every number, which is how the board query drops unranked rows. Under this shape that index artifact travels to a component, and every consumer independently learns that a missing rank means unranked, plus the two different reasons a rank can be missing. The next reader has to know the index design to render a badge.

`status: "open" | "closed_permanently"` plus `closedSince?: number` admits a closed spot with no date. With a parse layer that combination is unconstructable. Without one it is a comment.

`Doc<"spots">` would carry a Places payload reference into the client if the payload ever moved back onto the spot row.

Most concretely, `BoardRow` and `TailRow` could no longer be different types, so nothing would stop a component rendering `#12` next to a seed spot, which is a product rule SPEC calls out by name.

Nine small pure files, all unit-testable without a database, in exchange for four classes of illegal render becoming build errors. The parse layer wins on interface depth even though it loses on line count.

## 5. Global identity table with alias resolution at ranking time

One row per merge in a `makerAlias` table, `alias -> canonical`. The tally resolves each maker key through it before counting.

What it hides. Merges become one write regardless of how many brags the identity has.

What killed it.

Ranking gains an alias lookup per distinct maker in the window. For a city rebuild that is hundreds of point reads on the write path, and they are pure overhead in the common case where nobody merged anything.

The alias table is a third piece of derived state with its own staleness. A partially built alias map silently produces wrong counts, and wrong counts are the one bug this product cannot tolerate, because the board is the product.

Per-brag `maker_remapped` events cost N writes once, at merge time, and then the ranking path never thinks about identity again. I would rather pay once at the rare event than forever on the common one.

## 6. Two-tier projection with a separate `spotTally` table

`spotTally` per spot holds the counts, `cityBoard` per (city, spot) holds the rank. This is what I designed first.

What it hides. Same surface as the chosen shape.

What killed it, and I killed it during the sketch rather than in review. The only field `cityBoard` added over `spotTally` was `rank`, and `citySlug` denormalizes onto the tally trivially. Merging them gave one table that serves the ordered board via `by_city_rank` and the spot page's standing via `by_spot`, with one fewer derivation step and one fewer sync point. Per `principle-laziness-protocol`, the table that added a field and a hop did not earn its place.

## 7. A `spotMaker` vote-projection table between brags and the board

One row per (spot, maker) with that maker's latest brag time, derived from the log. Makes `windowExpiresAt` a single index read (the first row in range) instead of an in-memory minimum, and makes one-maker-one-vote structural again.

What killed it. The in-memory pass it replaces is over one spot's in-window brags, which is small for any realistic spot, and it computes the maker dedupe, the window minimum, and `lastBragAt` in the same pass. A third projection to save an in-memory `Math.min` over tens of items is not a trade I would defend to a maintainer.

If a single spot ever collects thousands of brags in a window, the right answer is the `@convex-dev/aggregate` component on the existing index, not a hand-rolled table. Noted and not built.

## 8. `preloadQuery` for public pages

The pattern Convex's Next.js guide leads with. `preloadQuery` in the RSC, `usePreloadedQuery` in a client component, live updates for free.

What killed it. It serializes a subscription token into the client payload and makes the route dynamic. A signed-out city page has nothing worth subscribing to, since board changes arrive minutes apart at best, and it has everything to gain from being cacheable HTML. `fetchQuery` plus `revalidate` gives real static output and honest `view-source` content.

The freshness objection is real for exactly one user, the person who just uploaded, and `BragHerePanel` solves it by subscribing live as a signed-in child of a static page. Best of both, and the split falls out of who needs live data rather than which API the guide showed first.

## 9. A monotonic watermark on board rows to guard against out-of-order rebuilds

Store the maximum event timestamp each rebuild considered, and skip a rebuild whose watermark is not newer.

What killed it. It guards against something Convex already prevents. A rebuild reads the board rows it patches, so a concurrent rebuild that wrote them puts them in the first transaction's read set, and Convex's OCC retries with fresh reads. Adding a belt against a documented transactional guarantee is re-validating inside the system, which `principle-boundary-discipline` says not to do, and the field would read as load-bearing to the next person.

`builtAt` survives on the row for observability, and `SHAPE.md` says in the schema that no logic reads it.

## 10. A national brag feed table to make the homepage lively

Not really a design alternative. Noting it because an event log makes it a two-line query and that is exactly the temptation. SPEC rule 1 forbids it and grounding lists it as closed. The log's `by_city_time` index would serve it, which is why the rule needs to stay written down rather than relying on the schema making it awkward.

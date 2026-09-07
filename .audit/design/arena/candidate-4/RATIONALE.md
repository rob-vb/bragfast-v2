# Rationale

## Problem

brag.fast needs a crawlable city page that renders a numbered board of breakfast spots, where the number is earned by distinct makers who bragged in the last 90 days, tie-broken by the most recent brag. The obvious implementation counts brags on every request, and that fails three ways at once. It scales with total brag volume rather than catalog size, it makes the page uncacheable, and it puts the ranking rule in a query handler where the next feature quietly forks it. Two constraints make the shape non-obvious. First, the 90-day window means a spot's rank changes with no write at all, so any stored answer goes stale on a clock rather than on an event. Second, SPEC requires that connecting Instagram rewrites `ig:{id}` votes to `user:{id}` and collapses duplicates, which is a retroactive change to how past facts count. Grounding fixes the stack (Convex, not Postgres; Better Auth's official Convex component; same-URL i18n) and forbids a national live feed, so this is a read-heavy directory with a write path that must not slow it down.

## Usage (caller's view)

Full version in `USAGE.md`. The short form.

A city page is one call. It returns board rows in rank order and tail rows that have no `rank` field, so the two-block layout is a type-level fact and a component cannot badge a seed spot with a fake number.

```tsx
const page = await fetchQuery(api.city.page, {
  country, citySlug: city, kinds, tail: { sort, page: 1 },
});
// page.board: BoardRow[]  (rank: number, always present)
// page.tail:  TailRow[]   (no rank field exists)
```

A spot page is one call, and the standing is a sum type the compiler makes you branch on.

```tsx
switch (page.standing.kind) {
  case "ranked":   return <p>#{page.standing.rank} in {page.standing.citySlug}</p>;
  case "unranked": return <p>Nog niet op de board</p>;
}
```

Bragging takes no maker argument. The session supplies it, so a caller cannot brag as someone else.

```ts
await create({ spotId, media: { kind: "photo", storageId } });
await replaceMedia({ bragId, media });   // still one vote, board does not move
```

Merging is one call with no collapse routine to remember.

```ts
await mergeInstagram({ igUserId });
// { remappedBrags: 12, collapsedVotes: 2, reprojectedCities: ["haarlem"] }
```

Changing the window is an edit plus `npx convex run project:replay '{}'`, not a migration.

## Shape

**The log is the truth, projections are the answers.** `bragEvents` is append-only and is the only source of truth for votes and visibility. Two private projections are total functions of it. `bragCurrent` holds each brag's folded state and serves the feed and both passport boards. `boardEntry` holds each spot's standing plus its city rank number. A city page reads `boardEntry` by the `by_city_rank` index and never touches a brag. Catalog spots live in `spots`, which ranking never writes, so the two-block city page is literally a read from two tables.

**Every event carries `spotId` and `citySlug`.** That single denormalization is what bounds the write path. An event locates its own reprojection target without reading anything else, so `applyBrag` reads one brag's history, one spot's in-window brags, and one city's board rows. The read set scales with spots-per-city, not with brags-per-city. That distinction is the whole argument for materializing, and I traced it before choosing the tables, per `principle-foundational-thinking` on tracing every access pattern before writing logic.

**A merge appends one `maker_remapped` event per affected brag.** This is the decision I would defend hardest. The alternative shape, a global identity fact plus an alias table consulted during ranking, puts an alias lookup on the hot path and adds a table whose staleness is a second failure mode. Per-brag remap events mean the fold of one brag's history already yields its canonical maker, so there is no alias table, no lookup, and no collapse routine. SPEC's "collapse duplicate votes on the same spot to one" needs zero lines of code, because the tally counts distinct canonical makers and after the remap both brags resolve to the same one. Choosing the structure deleted the branch, per `principle-model-the-domain`.

**`windowExpiresAt` on each board row.** The hard problem with any stored ranking is a count that changes when nothing happened. Each row stores the exact instant its own count would change, which is the minimum over counted makers of that maker's latest brag plus 90 days. A 15-minute cron queries `by_expiry` and reprojects only the rows that actually moved. No nightly full rebuild, and cost is proportional to real change. Both the event path and the cron path funnel into the same `applyBrag`, which is a full recompute rather than a delta, so running it twice or after a crash converges, per `principle-make-operations-idempotent`. Convex transactions remove partial states entirely, so convergence under repeat is the only property the operation needs.

**Illegal states, four of them, made unconstructable.** `CanonicalMakerKey` is a distinct brand from a raw maker key, and `tallySpot` accepts only the former, so double-counting a merged identity does not compile. `RankInput` requires an open spot with at least one in-window maker, so `rankCity` cannot number a seed spot; SPEC rule 6 is enforced by a constructor returning null. `LicensedImage` has no constructor that accepts an embed permalink, so an Instagram photo cannot leak into our JSON-LD; that one is a legal risk closed by a type. `t()` accepts `MessageKey` only, so passing a caption to the translator is a build error, which is SPEC's "UGC never machine-translated" as a mechanism instead of a sentence. Each of these is the strongest available rung, per `principle-encode-lessons-in-structure`, and each replaces a runtime check I would otherwise have written.

**Flatten for the index, parse for the reader.** Convex indexes sort flat field values, so a stored row cannot discriminate on an indexed union. Rather than three ad hoc workarounds, one named convention. The row has flat optional fields, one codec writes them, one codec reads them back into the sum type. Applied to `SpotStatus`, `BoardStanding`, and `BragVisibility`. `boardEntry.rank` is optional and the board query is `gte("rank", 1)`, because Convex sorts a missing field below every number, which drops unranked rows from the range for free. That is where validation lives, at the storage boundary, and internal code trusts the parsed sum type without rechecking, per `principle-boundary-discipline`.

**Derive, do not store, whatever is free.** `BoardStanding.unranked.reason` is not a column. `makers90d === 0` means the window emptied, anything else means the spot closed. One less field to keep in sync, per `principle-minimize-reader-load`.

**Public SSR reads use `fetchQuery`, not `preloadQuery`.** `preloadQuery` exists to hand a live subscription to a client component, and it makes the route dynamic. A signed-out directory page has nothing to subscribe to and everything to gain from being cacheable HTML with `revalidate = 300`. The one live subscription on a public page is `BragHerePanel`, a signed-in child, which is also why the bragger sees their own brag instantly while the cached page above it is still stale. That split answers both the crawlability requirement and the freshness expectation of the person who just uploaded.

**Filters split by whether they change which rows exist.** Type chips run server-side. "Open nu" and distance sorting run client-side from hours and geo already in the payload, which are needed for JSON-LD and the map anyway. That removes a cache-buster (`now` in a query argument) and a round trip in one decision, and it makes the chips instant.

**Interface depth.** The public surface is five read functions and seven write functions, and no caller composes them. A city page is one call that hides index selection, rank ordering, the board-versus-tail split, closed-spot exclusion, and pagination. The write surface hides the entire derivation chain, the scheduler, and the merge collapse. Nothing on the surface names a projection table, a storage id, a Places payload, or a Convex document type. What stays exposed to callers is exactly the domain vocabulary from SPEC: spot, board, standing, brag, maker. The surface is no larger than the set of pages and user actions the product has.

**No lock.** Two brags in the same city both schedule a rerank, and both write the same rows. The write is a total function of the log rather than an increment, so both runs compute the same answer, and Convex's serializable transactions with OCC retry order them. `project.ts` is the single writer of both projections, enforced by a lint rule. Per `principle-separate-before-serializing-shared-state`, the sharing is real but it does not need serializing by the design because the operation is convergent and the database already serializes.

## Synthesis decision

orchestrator fills this

## Tradeoffs accepted

- We accept an extra write per brag (one event, one `bragCurrent` row, one `boardEntry` patch) in exchange for a city page that reads one index and never scans a brag. Reads outnumber writes by orders of magnitude in a directory.
- We accept two projections to rebuild in exchange for changing the ranking rule by editing a fold and replaying. The 90-day window and the tie-break are both guesses, and I would rather redeploy a function than write a migration when they change.
- We accept eventual consistency of roughly one scheduler tick on the board in exchange for uploads that never wait on a city renumber. The bragger's own view is live because the brag panel subscribes directly, so the lag is invisible where it would be felt.
- We accept up to 15 minutes of staleness on window expiry in exchange for a sweep proportional to actual change rather than a nightly rebuild of every city. A spot dropping off the board 12 minutes late is not a product failure.
- We accept that `makersAllTime` is an incremental counter while `makers90d` is a full recompute. This asymmetry looks like an oversight and is not. An all-time distinct count cannot be recomputed from a bounded read, so it moves by delta at the one place a maker becomes new to a spot, and `replay` recomputes it exactly if it ever drifts. Different cost profiles, different treatment.
- We accept a `maker_remapped` event per brag rather than one identity fact, which makes a merge write N rows. In exchange the ranking path has no alias table and no lookup. N is the number of brags one person made, which is tens.
- We accept `spotSource` as a separate table holding the raw Places payload, which costs a join we rarely need. In exchange, returning a spot document cannot leak a wire type, which is a rule enforced by the schema instead of by a reviewer.
- We accept that the catalog tail is paginated with real `?page=` links rather than infinite scroll. Slower to use, crawlable at all. For a directory whose entire pitch is crawlability, that is the right side of the trade.
- We accept that the log stores no personal content beyond a maker key and a storage pointer, which limits what the audit trail can tell us later. That is deliberate; see the AVG risk below.

## Alternatives considered

**Compute the board on each request.** A city page query scans brags for the city, groups by maker, sorts. Interface depth is identical from the caller's side, which is why it is tempting. It loses on the access pattern. Read cost scales with total brag volume in the city, so Amsterdam degrades exactly as the product succeeds, and `now` in the query makes the page uncacheable, which forfeits the SEO argument the whole product rests on. Details in `REJECTED.md`.

**An explicit `makerVote` table written alongside each brag, with a unique constraint on (maker, spot).** This is the shape SPEC's first option describes and it is genuinely good. It makes one-maker-one-vote a storage invariant and it is the smallest thing that works. It loses on the retroactive rule changes the product has already promised. A merge has to find and delete rows, an unhide has to decide whether to resurrect a vote, and a window change has to be a migration. Two sources of truth for one fact, kept in sync by hand at every write site, is the leakage the red-flag list warns about. The event log buys those three operations for the price of one extra write.

**Cache the rendered board in a blob per city.** A single `cityBoard` document holding a serialized array. Fewer rows, one read per page. It loses on the spot page, which needs one spot's standing and would have to load and scan its whole city's blob, and on partial update, since one brag rewrites the entire document and turns every concurrent brag in a city into a write conflict on one row. Convex's OCC would retry them into a queue.

**Treat Convex documents as the domain model and skip the parse layer.** Cheapest in lines of code and it removes an entire directory. It loses because `Doc<"boardEntry">` carries `rank?: number` and `windowExpiresAt?: number`, which are index artifacts, straight to the React component. Every consumer then relearns that a missing rank means unranked, and the reason for it, which is precisely the information leakage that makes a representation change a coordinated edit. The parse layer is nine small files and it is the reason `BoardStanding` and `TailRow` can make illegal renders uncompilable.

**A global identity table plus alias resolution at ranking time.** Structurally the smaller merge. One row per merge instead of N events. It loses on the hot path, because ranking then needs an alias lookup per distinct maker in the window, and on failure modes, because a stale or partially built alias table silently corrupts every count that reads it.

## Open questions and risks

- Should replacing a brag's media move its visit timestamp? I chose no, so replacing a photo cannot farm the recency tie-break. Is there a product reason a maker would expect the swap to refresh their position?
- Does the board tie-break need a third key? I sort by `makers90d`, then `lastBragAt`, then `spotId` for stability. `spotId` is arbitrary and permanently favours whichever spot was ingested first. Is a stable-but-arbitrary tie-break acceptable, or should equal spots shuffle per request, which would cost cacheability?
- How does AVG erasure interact with an append-only log? Today the log stores a maker key and a storage pointer, and `erased` deletes the file and drops the maker from the projections. A subject demanding full erasure of their identity would still leave their maker key in historic event rows. Is redacting those rows in place acceptable as the one sanctioned mutation of the log, and does legal want a retention limit on events?
- How long do we keep events? The log grows forever by design. At NL scale that is small, but "forever" should be a decision rather than a default.
- Should the window sweep run every 15 minutes or every hour? 15 minutes is a guess. It costs one indexed range query per tick and nothing when nothing expired.
- When a spot's Places record flips to closed, the board must renumber the city. That is a catalog write triggering a ranking reprojection, which is the one place ranking and catalog touch. Should closure instead be an event in the log, which would keep the direction of dependency one-way at the cost of a second event family?
- Instagram hashtag coverage is limited to professional accounts, so most personal posters only appear after connecting. Does the launch plan assume otherwise anywhere?
- On-demand revalidation is deferred. Boards refresh on a 300-second ISR window. Should a rank change instead call a Next.js revalidate endpoint from Convex, and is the added coupling worth the freshness?

## Next implementation step

Write `convex/schema.ts` with `cities`, `spots`, and `users` plus `convex/domain/{ids,i18n,rows}.ts`, so SPEC step 1's shell lands on the final table names and the flatten-for-the-index convention exists before the first row is written.

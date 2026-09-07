# Rejected alternatives

Whole-shape alternatives considered while committing to the two-table (posts + materialized votes) stance, plus point decisions rejected inside it. Each judged on interface depth: what it exposes to callers versus what it hides.

## 1. Fully derived votes (posts only, no vote table)

Count distinct makers at query time: board score = distinct `makerKey` over visible posts in window, per spot.

Why it lost. Convex has no `COUNT DISTINCT` and no aggregation pushdown. The city board becomes, per spot, a scan of all posts with visibility and window filters and a Set of maker keys; a city page reads every post ever made in that city. The "we'll add a cache later" answer is the tell from the runner discipline that the structure is wrong, because the cache *is* a vote table with the writer scattered across every read path. Merge gets worse: read-time key mapping (`ig:X` means `user:Y` now) must be joined into every count. It also gives the feed and the ranking the same table, so a hot feed page and the board contend on the same rows. Conceptually purest single-source-of-truth, practically it defers this design's reconcile into query code where it cannot be transactional.

Kept from it: the *idea* that votes are a function of posts. This design keeps that function pure (`desiredVote`) and materializes its output transactionally instead of evaluating it per read.

## 2. Vote-as-primary (the brag row is the vote; extra posts attach to it)

One `brags` table where the first post per (maker, spot) is the vote row and later posts reference it, or a `votes` table that owns its posts as children.

Why it lost. The first post becomes structurally special. Deleting or hiding it requires promotion logic (elect a new primary, move children), which is exactly the delete-the-last-post question but asked on every deletion of the first post instead. The asymmetry leaks into the feed: renderers must know primary and extra rows to render them identically, which is information leakage by definition. Replace-in-place gets a second meaning depending on which row is replaced. Shallow module: the interface looks like one table but callers still coordinate two concepts.

## 3. Single table with an `isActiveVote` flag

`brags` rows carrying `isActiveVote: boolean` maintained on write.

Why it lost. `{ posts: many, isActiveVote: boolean }` admits zero-active and two-active states; the invariant lives in every writer's discipline instead of in a structure. This is the optional-field anti-pattern from type-system-discipline. Every reader (board, passport, all-time count) must trust that no writer forgot the flag dance. Uniqueness of the vote is exactly the thing Convex cannot constrain, so it must be concentrated in one writer; a flag spread across a big table is the opposite.

## 4. Per-spot maker-set counters only (no per-maker vote rows)

Spot carries `{ makerCount90d, makerKeys: string[] }` or just counters, incremented and decremented on post writes.

Why it lost. Increment/decrement is the anti-pattern make-operations-idempotent warns about: a missed decrement (crash between post delete and counter write would be impossible in one Convex transaction, but a logic bug is not) drifts forever with no repair path. And the passport needs per-maker rows anyway ("unique spots on the passport" is exactly `makerVotes.by_maker`), so the counters would coexist with a vote-shaped structure regardless. The vote table gives counters as a recompute, plus repair for free.

## 5. `preloadQuery` for public pages

Why it lost. Public pages are crawlable documents; the seeker and the crawler need HTML, not a live subscription. `preloadQuery` drags a client Convex context and reactivity plumbing into pages with no signed-out interactivity, grows the bundle, and couples page caching to WebSocket state. `fetchQuery` in the RSC is a plain server read that composes with Next caching. Reactivity stays in the auth-gated islands where a signed-in user actually benefits.

## 6. Convex docs as the domain model (no parse layer)

Why it lost. `Doc<"spots">` leaks `_creationTime`, the serialized maker key, and the storage id into every component; the lifecycle invariants would be re-derived as scattered `if (closed) skip` filters in each query and page, the model-the-domain tell. The parse layer costs one function per table and buys a public surface made of domain vocabulary, plus freedom to flatten storage columns (see the nested-index risk) without touching a single caller.

## 7. Plain-string `maker_key` everywhere

Why it lost. Two functions taking `string` where one means a maker key and one means a slug is the branding test failing verbatim. The merge rewrites keys; an unbranded string makes "passed the ig key where the user key belonged" compile. The union type additionally lets `createInApp` demand a `UserMakerKey`, encoding "in-app brags are always user-keyed" (a SPEC rule) in a signature instead of a check.

## 8. Retract-but-keep tombstone votes on last-post deletion

Keep the vote row with `retractedAt` when the last visible post disappears.

Why it lost. The row would exist only to preserve all-time counts through AVG deletions, but a maker who deleted their proof should not remain a counted maker; SPEC's honor system counts proof, and AVG deletion is meant to remove the trace. It also splits the invariant into "exists" versus "active", reintroducing the flag problem from alternative 3. If the owner later wants deletion-proof analytics, that is an append-only event log, not a tombstone on the ranking row.

## Red-flag self-screen

- Shallow modules: page queries return complete view models; no caller coordinates multiple calls per operation.
- Information leakage: wire format of maker keys in two functions; vote writes in one module; the 90-day constant in one file; no transport or `Doc` types on the public surface.
- Temporal decomposition: modules own domain knowledge (catalog, brags, votes, identity, moderation); there is no load/validate/save layering.
- Pass-through methods: public mutations add auth, arg parsing, and transaction scope over model helpers; that is policy, not forwarding. `domain/vote.ts`'s `desiredVote` exists to be pure and unit-testable, not as a layer.

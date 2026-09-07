# Rationale

## Problem

brag.fast is a crawlable NL breakfast directory where spots rank by distinct makers with a brag in 90 days. The shape is non-obvious because one product rule cuts across everything: many posts from one maker are one vote, and that vote must survive replace-in-place, hide/unhide via reports, AVG deletion, window aging, and Instagram identity merges without ever double-counting. The stack is fixed (Next.js App Router SSR, Convex, Better Auth official component, same-URL i18n), Convex has no unique constraints and no aggregation, and public pages must render as documents for crawlers while mutations stay auth-gated. The design must make SPEC steps 2–6 obvious while only step 1 gets built now.

## Usage (caller's view)

Written first; see `USAGE.md` for the full call sites. The contract in one paragraph: every public page is one `fetchQuery` returning a finished domain view model (`CityPageData`, `SpotPageData`, `PassportData`); brag lifecycle is three mutations (`createInApp`, `replaceMedia`, `remove`) whose returned `VoteOutcome` tells the UI whether the board moved; and no caller anywhere computes rank, filters closed spots, knows the 90-day constant, or touches `makerVotes`.

## Shape

Posts and votes are different tables. `Post` is the feed row (in-app hosted media or social embed, as a sum type). `MakerVote` is the unique (makerKey, spotId) row that ranks. The vote is a materialization of visible posts governed by one invariant: a vote row exists iff at least one visible post exists for the pair. One function, `reconcileVote`, is the sole writer of `makerVotes`; every post mutation calls it in the same Convex transaction, so the invariant can never be observed broken (per separate-before-serializing-shared-state, the shared row has one writer; per make-operations-idempotent, reconcile recomputes rather than increments, so retries, crashes, and double-runs converge).

Deleting the last visible post deletes the vote row in that same transaction. No tombstone, no grace period. This is the stance's forced question and the answer is encoded in `desiredVote(visiblePosts) → VoteStanding | null`, a pure total function: empty input returns null and null means the row must not exist. Hide, unhide, AVG delete, and merge are not special cases; they are all "posts changed, reconcile" (per model-the-domain, one structure replaces five conditional paths).

Ranking is materialized onto the spot as `SpotLifecycle`, a sum type where a gravestone cannot carry a `BoardStanding`, a seed is `standing: null`, and a standing cannot exist with score 0 (per type-system-discipline, the three illegal states from the grounding's fork 5 are unrepresentable). `windowExpiresAt` inside the standing makes 90-day aging a cheap indexed cron over only the spots that can actually change, and it is the only score change with no user write behind it. The city page is one descending index scan.

`maker_key` is a branded union (`{ kind: "user" } | { kind: "ig" }`) in domain code and a branded serialized string in storage because Convex indexes need a flat field; exactly two functions know the wire format. Domain types live in a pure `domain/` package; Convex validators are exported from the same files so schema and types cannot drift; queries parse docs into view models before returning, so no `Doc`, storage id, or wire key crosses the public surface (per boundary-discipline).

Interface depth: the public surface is four page queries and five mutations. Behind it hide the vote invariant, window math, rank computation, gravestone filtering, merge collapse, storage-file lifecycle, and the schema. What stays exposed to callers is only the domain vocabulary the pages render. SSR uses `fetchQuery` in RSCs because public pages are documents, not live views; client reactivity is confined to auth-gated islands under `ConvexBetterAuthProvider`.

## Synthesis decision

orchestrator fills this

## Tradeoffs accepted

- We accept a materialized vote table that could theoretically drift from posts in exchange for O(makers-per-spot) reconciliation, O(1) board reads, and free passports (votes-by-maker). Convex transactions plus a single writer make drift a code-review-visible event, not a runtime race, and reconcile doubles as the repair tool.
- We accept a nightly recompute cron in exchange for refusing read-time window math. Board numbers may be up to a day stale purely from aging (never from user actions, which recompute inline). SPEC's 90-day window is a coarse instrument; day-granularity aging matches it.
- We accept losing all-time maker history on AVG deletion (vote rows die with their posts) in exchange for honest deletion. SPEC requires the delete; a count that survives it would be a lie.
- We accept storing `makerKey` as a serialized string in exchange for indexability; the brand plus two-function wire ownership contains the stringliness.
- We accept `fetchQuery` pages not live-updating after hydration in exchange for smaller bundles and crawler-first rendering. A brag appearing on next navigation is fine for a directory.

## Alternatives considered

- Derive votes at read time from posts (no vote table). Deepest conceptual purity, but Convex has no distinct-count, so every board read scans all posts per city with window and visibility filters, and merge needs read-time key mapping. It exposes the least to callers only until it forces caches, at which point it becomes this design with the writer scattered. Rejected; details in `REJECTED.md`.
- Vote-as-primary row with posts attached (first brag is the vote, extras hang off it). Hides less than it seems: deleting or hiding the vote-carrying post needs promotion logic, and the primary/extra asymmetry leaks into feed rendering. Rejected.
- Single `brags` table with an `isActiveVote` boolean. The classic bag-of-booleans: two rows can claim the vote or none can, and every reader must re-derive the invariant. Rejected on type-system-discipline grounds alone.

## Open questions and risks

- Do Convex nested-path indexes (`lifecycle.standing.score` through a nullable union) behave as sketched, with missing values sorting below present ones? If not, flatten to top-level columns behind the same `parseSpot`/serializer pair; the domain union and every caller are unaffected. Worth a spike in step 1.
- Should hidden-by-report posts still be excluded from `allTimeMakers`, or only from the 90-day score? The sketch excludes them from both (visibility gates the vote row entirely). Owner may prefer all-time to include hidden-pending-review.
- City slugs are currently strings on spots with no `cities` table. Featured cities and city names for i18n may want one; the sketch derives cities from spots and defers the table. Confirm before step 2.
- Is day-granularity window aging acceptable, or does the owner expect a spot to drop off the board at the exact 90-day instant?

## Next implementation step

Build step 1 (shell) against the sketch: `convex.config.ts` + `auth.config.ts` + `createAuth` + the Next proxy route and `ConvexBetterAuthProvider`, alongside `domain/ids.ts`, `domain/makerKey.ts`, and `convex/schema.ts` exactly as sketched with empty tables, so signed-in/signed-out both render and the schema contract is committed before any feature code.

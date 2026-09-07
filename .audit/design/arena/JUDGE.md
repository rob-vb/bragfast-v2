# Arena verdict, brag.fast v1 architecture

Judged against the six rubric criteria, the design red-flags reference, GROUNDING.md, and SPEC.md. Scores are 1 to 5. Candidate self-assessments in each REJECTED.md were treated as claims to verify, not as facts.

## Score table

| Criterion | C1 (posts + reconciled vote table) | C2 (anchor role, derived votes) | C3 (Maker docs + vote table, read-time rank) | C4 (event log + projections) |
|---|---|---|---|---|
| 1. One maker, one vote | 5 | 3 | 4 | 5 |
| 2. SSR catalog | 5 | 4 | 4 | 5 |
| 3. Illegal states unrepresentable | 4 | 3 | 4 | 5 |
| 4. Identity | 5 | 4 | 5 | 5 |
| 5. Interface depth | 5 | 3 | 4 | 4 |
| 6. v1 cost | 4 | 4 | 5 | 2 |
| **Total** | **28** | **21** | **26** | **26** |

## Candidate 1

The load-bearing element is one invariant with one writer. A `makerVotes` row exists iff at least one visible post exists for the pair, and `reconcileVote` is the only function allowed to write it, called inside the same Convex transaction as every post write. Hide, unhide, AVG delete, and Instagram merge are all the same operation ("posts changed, reconcile"), so merge collapse and last-post retraction need no special cases and rerunning converges. Replace-in-place explicitly leaves `createdAt` untouched, so recency cannot be farmed. Identity is a structured union with the wire format confined to two functions, and `createInApp` demanding `UserMakerKey` encodes "in-app brags are user-keyed" in a signature. Remaining red flags. The `by_city_board` index over a nested nullable union (`lifecycle.standing.score`) is an unverified Convex behavior the candidate itself flags; the flatten fallback is contained behind `parseSpot`, but it must be spiked in step 1 before anything depends on the one-scan board. Hidden-post exclusion from the feed is query discipline, not a type. Materialized standing on the spot is a second derived layer on top of the vote table, held together by the same single-writer rule plus a nightly aging cron.

## Candidate 2

The load-bearing element is a single `brags` table as the sole source of truth, with rank derived by grouping visible documents at read time. That gives zero drift by construction and the cheapest possible schema. The problem is the anchor role. Promotion logic on hide and delete maintains one `maker_anchor` per visible pair, yet the board "does not trust the anchor for scoring" and groups by maker anyway. The design pays write-time complexity for an invariant nothing consumes, and it leaves rank correctness resting on every future query remembering to group by distinct `makerKey`, which is the exact weakness its own REJECTED.md names for the anchorless shape. `additional_post` rows carry an `anchorBragId` that promotion may leave dangling; the repointing rule is unspecified, so an illegal reference state is representable. The Next.js `public-catalog.ts` adapter makes the city-page chain four files (route, adapter, Convex function, domain op), over the rubric limit, and its clock argument makes public pages uncacheable. Merge is well specified and idempotent, and the licensing rule for JSON-LD images lives in a described behavior of `publicViews`, not in a type.

## Candidate 3

The load-bearing element is the identity model. Makers are documents, brags carry `MakerId`, and no `user:` or `ig:` string convention exists anywhere, so merge is document absorption rather than a string rewrite, and `InstagramMaker` structurally cannot hold a passport slug. Ranking is read-time over a materialized vote table, which means no cron, no scheduler, and a window change that is a constant edit with zero migration. That is the cheapest correct v1 of the four. Two real flaws remain. First, `replace` calls `upsertVoteFromLiveBrag` with `now`, which bumps `lastBraggedAt` and lets a maker farm the tie-break by re-uploading the same photo; candidates 1, 2, and 4 all explicitly prevent this. It is a one-line fix (recompute rather than upsert-with-now) but it is on the page. Second, the brag flow makes the client coordinate `myLiveInAppAtSpot` and then branch between `inApp` and `replace`, with a thrown "use replace" if it guesses wrong. Callers coordinating several methods to complete one operation is the first shallow-module sign in the red-flags list. The JSON-LD licensing rule is a comment on `SpotJsonLd`, not a constructor, and `nowMs: Date.now()` in every query argument plus `preloadQuery` subscription tokens make public pages permanently dynamic.

## Candidate 4

The load-bearing element is the append-only `bragEvents` log with two private projections, and it produces the strongest type work in the arena. `CanonicalMakerKey` makes double-counting a merged identity uncompilable, `RankInput` makes numbering a seed uncompilable, `LicensedImage` has no constructor from an embed so the JSON-LD legal risk is closed by a type, and `t()` accepting only `MessageKey` turns SPEC's no-machine-translation rule into a build error. `windowExpiresAt` per row makes aging proportional to actual change. The SSR story (fetchQuery plus ISR, distinct `BoardRow`/`TailRow` types) is the best of the four. It loses on criterion 6, and not narrowly. This is an event-sourcing platform, the thing the rubric names. Step 3 cannot ship until the log, the fold, two projections, the scheduler hop, the 15-minute sweep cron, and the replay action all exist and agree, and `makersAllTime` is additionally an incremental counter with its own drift-and-repair story. Its own REJECTED.md concedes that with a frozen rule and no merge the vote table wins; but candidates 1 and 3 handle both the merge and a window change without a log, so the log's two selling points are already covered by cheaper shapes. Its dismissal of the vote table also overstates: "unhide needs the brags anyway" describes an indexed read of one maker's posts on one spot, and "window change is a data migration" is false for a vote table storing timestamps. Finally the candidate itself flags that historic event rows retain maker keys after AVG erasure, which is a real GDPR exposure for an NL launch and would require sanctioning in-place mutation of the "immutable" log.

## Recommended base: candidate 1

Candidate 1 wins on total and survives the adversarial pass with the fewest open wounds. A future maintainer extends it without breaking rank because every future post source reduces to the same two calls. Instagram ingest in step 5 is "insert post, call `reconcileVote`", YouTube later is the same, and moderation, AVG deletion, and merge already go through that one writer, so no new feature can fork the vote rule. The pure functions (`desiredVote`, `computeStanding`, `boardComparator`) are unit-testable without a database, the 90-day constant lives in one file, and a window change is a constant edit plus one `recomputeSpotStats` pass, since votes store timestamps rather than window membership. The view-model boundary means the flagged nested-index risk, if it materializes, is absorbed by flattening storage columns behind `parseSpot` with zero caller changes. The public surface is four page queries and five mutations, each path within three files.

Two conditions on adoption. Spike the `by_city_board` nested-union index in step 1 before anything depends on it, and treat the hidden-post feed exclusion as a place to borrow candidate 4's constructor discipline rather than leaving it to query code.

## Grafts

- From candidate 4: the `MessageKey`-only `t()` helper and the `LicensedImage`-style brand for JSON-LD images, so "UGC never machine-translated" and "embeds are not our images" fail at compile time instead of in review.
- From candidate 3: the explicit `cities` table (candidate 4 has one too), which closes candidate 1's own open question about featured cities and localized city names without deriving cities from spot rows.

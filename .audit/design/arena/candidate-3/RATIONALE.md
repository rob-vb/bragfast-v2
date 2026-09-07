# Rationale

## Problem

brag.fast ranks spots by distinct makers in 90 days, then shows extra posts from those makers in a feed. Identity is the hard part. An unconnected Instagram poster already votes. Linking that account to a Google or magic-link user must become one maker and one vote per spot. SPEC describes this as rewriting `maker_key` from `ig:{id}` to `user:{id}`. That string is a protocol every module would parse. This sketch replaces it with a Maker document, a Brag that stores `MakerId`, and a `MakerVote` whose uniqueness is the pair `(MakerId, SpotId)`. The rest of v1, from city HTML to Instagram ingest, hangs off those three facts.

Greenfield. Convex, not Postgres. Better Auth through the official Convex component. Public pages must be server-rendered HTML. Implementation of the next coding run is only the shell, but the types have to make steps 2 through 6 obvious.

## Usage (caller's view)

A city RSC calls `preloadQuery` on `api.catalog.cityPage` and renders `page.board` plus `page.tail`. A spot RSC calls `spotPage` for JSON-LD and hours, and mounts `BragHere` only when `page.kind === "listed"`. `BragHere` calls `brags.inApp` or `brags.replace`. Instagram connect calls `makers.connectInstagram`. Full copy-paste sites live in `USAGE.md`. Pages never upsert a vote and never merge makers.

## Shape

Maker is a discriminated union. `UserMaker` holds the Better Auth user id and an optional Instagram id. `InstagramMaker` holds only the Instagram id and cannot carry a passport slug. That is `principle-model-the-domain` and `principle-type-system-discipline`. The illegal maker with no account does not compile as a domain value. The unconnected poster cannot occupy `/nl/u/{slug}`.

`MakerVote` is an explicit table, not a group-by over brags. City board is the dominant read, so each vote stores `citySlug` and `lastBraggedAt`. `rankCity` filters `lastBraggedAt > nowMs - 90 days`, counts distinct makers per spot, and splits board from tail. The window is not stored. Storing `inWindow` would go stale. This is `principle-foundational-thinking`. Trace the access pattern, then pick the structure.

Brags are feed rows. In-app replace patches the one live hosted brag for that pair. Instagram may add many live rows. Both paths call `upsertVoteFromLiveBrag`. Hide and delete call `recomputeVoteForPair`, which deletes the vote when no live brag remains. Callers see one mutation. Vote policy stays in `convex/votes.ts`. The public API stays small because that module holds the uniqueness rule.

`SpotListing` is listed or gravestone. Hours exist only on listed spots. Gravestones are absent from `CityPage` arrays and `inApp` throws if the spot is a gravestone. Hidden brags are a different type from live brags. Public feed DTOs accept `LiveBrag` only.

Parse at the Convex function boundary via `fromDoc`. Next.js imports domain types. It does not import `Doc<>`. Per `principle-boundary-discipline`.

SSR uses `preloadQuery` plus `preloadedQueryResult` so `view-source` has the catalog and the map island can hydrate the same payload. Convex HTTP is not an app transport.

Merge is one Convex mutation. OCC retries the whole thing. Run it twice, get `already_linked`. Crash halfway is not visible to readers because the mutation is atomic. Per `principle-make-operations-idempotent`. Two users bragging the same spot write different `pairKey` rows. Ranking merges at read time. Per `principle-separate-before-serializing-shared-state`.

No `makerKey.ts`, no account-provider table for TikTok, no service layer that forwards args. Per `principle-laziness-protocol` and `principle-minimize-reader-load`. City HTML is three files. In-app brag is three files.

`pairKey` lookup encodes uniqueness because Convex may not have unique indexes. Per `principle-encode-lessons-in-structure`. Do not write "remember to check the pair" in two mutations.

Instagram-only makers stay off passport URLs even if that makes the feed slightly less clickable. The seeker came for the spot. Per `principle-experience-first`.

## Synthesis decision

orchestrator fills this

## Tradeoffs accepted

- We accept an extra `makerVotes` table in exchange for ranking that does not re-group the feed on every city view, and for a merge that collapses votes by unique pair instead of by reconstructed strings.
- We accept denormalized `citySlug` on each vote in exchange for a `by_city_last` index that matches the city page. If a spot changes city, votes must be patched. Spots do not change city in v1.
- We accept optional fields in the Convex schema in exchange for keeping storage validators boring. Domain unions are reconstructed in `fromDoc`. The cost is that a bad row fails at the parse boundary, not at insert, until unique indexes exist.
- We accept passing `nowMs` from the RSC in exchange for a ranking query that does not hide a clock inside Convex.
- We accept no passport for `InstagramMaker` in exchange for never minting `/nl/u/{slug}` pages for people who have not signed in to brag.fast.
- We accept in-app replace as a separate mutation from `inApp` in exchange for making "exactly one live hosted brag per pair" a thrown error instead of a silent upsert that hid a client bug.

## Alternatives considered

A branded `maker_key` union `user:${id} | ig:${id}` keeps one column and looks smaller. Every ranking query, every unique check, and every connect path then splits the string. The public API looks the same size. The identity rules leak into every module. It lost on interface depth. See `REJECTED.md`.

Deriving votes by grouping live brags hides a table and reimplements uniqueness in every read. City page and merge both get worse. It lost.

`fetchQuery` only, with the map and brag form doing their own client fetches, is fewer moving parts in the RSC. The map would either flash empty HTML or duplicate the catalog query. `preloadQuery` won because one preload feeds HTML and the island.

Treating Convex `Doc` types as the model deletes `fromDoc`. Pages then handle `_creationTime`, optional `hours` on closed spots, and hidden brags. The public API grows by every storage accident.

## Open questions and risks

- When Convex unique indexes are available, should `pairKey`, `userId`, `instagramId`, `slug`, and `placeId` take them immediately, or is upsert plus OCC enough for v1 volume?
- If a user-backed maker and another user-backed maker ever share an Instagram id, the mutation throws. Is that an owner-support case, or should absorb still run toward the caller?
- Do hard-tagged Instagram posts on a gravestone still attach as history, or should ingest drop them?
- Should `inApp` assign the passport slug inside the same mutation as the first brag, or is a separate `ensurePassport` less surprising for `/nl/u/{slug}` timing?

## Next implementation step

Add `src/domain` and the Convex schema for `makers`, `spots`, `brags`, and `makerVotes` while wiring the Next.js shell, i18n, and Better Auth, so later steps fill function bodies against this contract.

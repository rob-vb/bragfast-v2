# In-app brag sketch (SPEC step 3)

Usage first. Types follow. Second arena skipped. Shell synthesis already named `reconcileVote`, one writer in `convex/model/votes.ts`, replace that does not bump recency, and `requireVisiblePost` on public feeds.

## Problem

Catalog can list Haarlem seeds. Nothing can vote, so the board stays empty. Step 3 must make a signed-in upload create a post, derive one maker vote, number the city board, and keep extra posts from the same maker as feed rows only.

Constraints already in the tree. `desiredVote` and `computeStanding` are pure. `makerVotes` has no writer. Better Auth users live in the component tables. Our `users` table is empty and is the `user:{id}` maker. No Google Places key, so Places autocomplete is out of this run. Instagram ingest stays step 5.

## Usage (caller's view)

Signed-in visitor on `/nl/haarlem/anne-max` uploads one photo. The client asks Convex for an upload URL, POSTs the file, then calls `api.brags.create`. The spot feed shows the hosted image. Haarlem's board shows Anne&Max as `01`.

A second signed-in visitor does the same. The board still has one numbered row. Score is 2. The feed has two items.

The first visitor uploads again. Score stays 2. The feed has three items.

They replace the first photo. `createdAt` does not move. Rank recency does not move.

They delete every post. The vote retracts. Anne&Max returns to **Nog niet gebragd**.

A visitor reports a post. The post hides. `reconcileVote` runs on what remains visible.

City page filters are query params on the same URL. `?open=1`, `?brags=1`, `?type=cafe`, `?view=map`. **Met brags** hides the tail. Map is a client toggle over the filtered spots.

User-add via Places autocomplete is not in this run. There is no Places key.

## Shape

Posts are the event log of visits. Votes are the derived standing of one maker on one spot. Board numbers come from `computeStanding` over those votes.

`reconcileVote(existing, desired)` is the only way a vote row changes. Desired standing is `desiredVote` of visible post `createdAt`s. Outcomes are `granted`, `kept`, `retracted`, `absent`. Replace patches `body.media` and `replacedAt`. It does not change `createdAt`. Hide and delete both go through visible posts then `reconcileVote`.

All `makerVotes` writes live in `convex/model/votes.ts`. `convex/brags.ts` is the HTTP/auth boundary. It authenticates, stores files, inserts or patches posts, then calls the vote module. Catalog queries stay read-only and still call `requireVisiblePost`.

App user identity. `ensureAppUser` looks up `users` by Better Auth `_id` (`authId`). Inserts `{displayName, avatarUrl, passport: null, igUserId: null}` on first brag. Maker key is `user:{users._id}`. Passport URLs stay step 4.

Spot denormalized `boardScore` / `latestBragAt` / `windowExpiresAt` update after every vote change on that spot. `allTimeMakers` is the current `makerVotes` count for the spot. An hourly cron recomputes rows whose `windowExpiresAt` has passed so a silent 90-day expiry still drops the number.

Public `FeedItem` carries `postId` so report/delete/replace have a handle. It does not carry `makerKey`. Signed-in own-post ids come from `api.brags.mineOnSpot`.

City view models gain `hours`, `spotType`, `geo`, `address` so the RSC can filter and the map can plot without a second query.

## Synthesis decision

Base remains arena candidate 1 from Shell. This file fills the write path. No new arena.

## Tradeoffs accepted

- We accept lazy `ensureAppUser` on first brag instead of Better Auth `onCreate` triggers, in exchange for not wiring a second user-lifecycle path before passports exist.
- We accept hourly standing expiry instead of computing every city page from all votes, in exchange for keeping the denormalized board fields honest.
- We accept skipping Places autocomplete in this run, in exchange for not inventing a fake add-spot that SPEC said must go through Places.

## Alternatives considered

- Count votes by scanning posts on every read. Loses. Callers would reimplement one-maker-per-spot. The vote table is the board's source of truth.
- Put makerKey on the public feed. Loses. It leaks our user ids and is not needed to render.

## Open questions and risks

- Places autocomplete waits on a key. Step 3's done predicate does not require it.
- Map tiles come from OSM via Leaflet. Fine for a VPS preview. Swap later if the owner wants a key.

## Next implementation step

Pure `reconcileVote` plus tests, then the votes writer, then `convex/brags.ts`.

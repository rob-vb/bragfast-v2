# Rejected shapes

These are design alternatives inside this stance, not other arena candidates. Each lost on what the caller has to know, not on how short the implementation looks.

## Branded `maker_key` string

```ts
type MakerKey = `user:${string}` | `ig:${string}`
```

SPEC's own sketch. One column on brag. Unique constraint on `(maker_key, spot_id)`. Connect Instagram rewrites `ig:` rows to `user:` and collapses duplicates.

The caller still has to know how to mint a key, how to parse one, that `user:123` and `ig:abc` can be the same human after connect, and that ranking must run after rewrite. That knowledge shows up in ingest, ranking, passport, and merge.

The only thing it hides is a maker table.

The public API is not smaller. `cityPage` still returns a board. Behind it, every module re-parses identity. Connecting Instagram is a string rewrite plus a unique-constraint fight, not a document merge. Later platforms add another prefix and another parser.

This stance exists to kill that leak. A branded string is still a string that every module re-parses.

## Votes derived from brags

Store only `brags`. City board groups live rows by `makerId`, takes max timestamp, filters 90 days, counts. No `makerVotes` table.

It hides a write path for votes.

It exposes uniqueness on every read. Hide a brag, and the city query must redo the group. Merge must retarget brags and hope no query still groups the old id. All-time maker count is another group-by, easy to get slightly wrong relative to the board.

The city page is the hot path. An explicit `MakerVote` makes that path a filter plus a count. Extra Instagram posts stay cheap feed inserts that patch `lastBraggedAt`.

Derived votes only win if writes are sacred and reads are rare. Here reads are the product.

## Vote flag on the first brag

Mark one live brag per pair as `countsAsVote: true`. Extra posts have the flag false. Replace keeps the flag.

The flag is a second copy of uniqueness. Merge, hide, and delete all have to move the flag. Two true flags compile. Zero true flags with live posts compile. `MakerVote` as its own row makes "one pair, one vote" the document identity, not a boolean that must stay in sync with sibling rows.

## Accounts sub-table

`makerAccounts: { makerId, provider, externalId }` so TikTok slots in later.

v1 has Google, magic email, and Instagram linking. A join table makes "does this maker have a user id?" a query. The discriminated `UserMaker` | `InstagramMaker` union answers it by construction. TikTok OAuth is out of v1. When it arrives, redesign the maker document. Do not keep an empty provider table warm.

## Convex docs as the model

Skip `src/domain`. Pages take `Doc<"spots">`.

Callers then see optional `hours`, optional `closedAt`, `_creationTime`, and `placesRaw` if someone forgets to strip it. Listed-without-hours compiles. Gravestones leak onto the city page because the type does not stop it. `fromDoc` is the cost of a public API that only contains legal spots, live brags, and makers with accounts.

## `fetchQuery` only, or Convex HTTP

`fetchQuery` in the RSC gives HTML. The city map and `BragHere` then need a second load. Either the map HTML is empty until the client query returns, or the page duplicates the catalog call.

Convex HTTP from Next.js is a second auth story and a wire type on the public API. Grounding already picked `preloadQuery` through the official Better Auth Next.js wiring. Hydrate islands from the same preload.

## Votes stored on the Maker document

A map `spotId → lastBraggedAt` on each maker makes per-maker uniqueness structural. Passport reads look nice.

City board then scans makers, or maintains a reverse index that is the vote table under another name. The seeker loads a city, not a maker. Put the vote where that read lives. Copy `citySlug` onto it.

## Soft-delete brags with `deletedAt`

A bag of `hiddenAt` and `deletedAt` timestamps admits live-and-deleted and hidden-without-`hiddenAt`. Deleted means gone, including the file in Convex storage. Hidden is a live row in storage and a `HiddenBrag` in admin. Public feed functions take `LiveBrag`.

## National feed table as a first-class read model

A denormalized global brag ticker would make a homepage feed cheap. The product forbids that homepage. Do not build the table that invites it.

## Clock inside the ranking query

`Date.now()` in `cityPage` makes the query non-deterministic and annoying to test. The RSC passes `nowMs`. The 90-day rule stays a pure function of votes and that number.

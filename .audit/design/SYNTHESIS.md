# Synthesis

Base: arena candidate 1. Cross-judge `.audit/design/arena/JUDGE.md` scored it 28. Parent agrees. One writer, `reconcileVote`, covers extra posts, last-post delete, hide, merge. Replace does not bump recency.

## Grafts

- From candidate 4: `t()` accepts `MessageKey` only. `LicensedImage` has no constructor from an embed. `requireVisiblePost` is the feed constructor so a hidden post cannot become a feed item.
- From candidate 3: explicit `cities` table. Do not derive cities from spots.

## Flattened storage (adoption condition)

Do not index nested `lifecycle.standing.*`. Store flat columns. `parseSpot` rebuilds `SpotLifecycle`. Callers never see the flat row.

## Step 3 still owns

All `makerVotes` writes live in `convex/model/votes.ts`. No other Convex module inserts or patches that table. Public catalog queries call `requireVisiblePost` before building `FeedItem`.

## Rejected

- Candidate 2: pays for an anchor the board ignores.
- Candidate 3 as base: `replace` farms `lastBraggedAt`. Maker documents stay a later option, not a graft into Shell. SPEC already describes `maker_key` rewrite.
- Candidate 4: event log is a platform. Haarlem does not need it.

## Shell implements

Next.js App Router, shadcn, Convex on `focused-deer-318`, Better Auth Google + magic link, same-URL i18n, homepage, domain types, schema with empty tables.

## Catalog implements

Public queries in `convex/catalog.ts`. Spot ingest writes live in `convex/model/spots.ts`. Haarlem is seeded. Public pages are `/nl/{city}` and `/nl/{city}/{spot}` with JSON-LD and sitemap. Search is a GET form on `/`. `makerVotes` still has one writer in step 3.

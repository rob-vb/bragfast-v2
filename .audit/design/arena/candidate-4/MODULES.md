# Modules

Three layers. Pure domain, Convex functions, Next.js pages. Rules live only in the first one.

## Layout

```
app/
  layout.tsx                          locale from cookie or Accept-Language, ConvexBetterAuthProvider
  page.tsx                            homepage: search box, featured cities, near-me
  [country]/page.tsx                  NL home
  [country]/[city]/page.tsx           one fetchQuery(api.city.page), two blocks
  [country]/[city]/[spot]/page.tsx    one fetchQuery(api.spot.page), JSON-LD, feed
  [country]/u/[slug]/page.tsx         passport, noindex before first brag
  sitemap.ts                          streams city and spot slugs
  api/auth/[...all]/route.ts          convexBetterAuthNextJs proxy, nothing else
  _components/
    board-block.tsx                   renders BoardRow[], no sorting of its own
    tail-block.tsx                    renders TailRow[], has no rank to render
    open-now-toggle.tsx               client, filters the hours already in the payload
    map-toggle.tsx                    client, pins already in the payload
    brag-here-panel.tsx               client, the only live Convex subscription on a public page
    feed.tsx                          hosted media and platform embeds

convex/
  schema.ts                           all nine tables and every index
  convex.config.ts                    registers the Better Auth component
  auth.config.ts                      getAuthConfigProvider()
  auth.ts                             createAuth, Google and magic link
  crons.ts                            window sweep every 15m, catalog hygiene daily

  city.ts                             api.city.page
  spot.ts                             api.spot.page, api.spot.feed
  search.ts                           api.search.suggest
  passport.ts                         api.passport.page
  brags.ts                            api.brags.create / replaceMedia / remove / report / generateUploadUrl
  identity.ts                         api.identity.mergeInstagram
  catalog.ts                          api.catalog.addSpotFromPlaces, internal upsertFromPlaces
  moderation.ts                       aiMatchQueue review, report review, closed override
  ingest.ts                           internal actions: Places text search, Instagram hashtag poll
  project.ts                          internal: applyBrag, rerankCity, sweepExpiredWindows, replay
  lib/auth.ts                         requireMaker, the one session-to-maker boundary

  domain/                             pure TypeScript, zero Convex runtime imports
    ids.ts                            brands and slug parsers
    maker.ts                          MakerIdentity, CanonicalMakerKey, resolveMakerAtAppend
    event.ts                          BragEvent union, BragMedia, validators
    brag.ts                           foldBrag
    tally.ts                          tallySpot, RANKING_WINDOW_DAYS
    rank.ts                           RankInput, rankCity, BoardStanding
    spot.ts                           SpotFacts, SpotStatus, LicensedImage
    hours.ts                          OpeningHours, isOpenAt
    places.ts                         parsePlace, classifyPlaceTypes, kind chip mapping table
    jsonld.ts                         foodEstablishmentJsonLd
    ingest.ts                         IngestedPost, routePost
    rows.ts                           the flatten-for-the-index codecs
    i18n.ts                           MessageKey, UserText, t
```

## Who owns what

`domain/` owns every rule. The ranking window, the tie-break, the fold from events to current state, the Places-type-to-chip mapping, the licensing rule for JSON-LD images. It imports nothing from Convex, so every rule is testable with plain values and no test harness.

`convex/*.ts` at the top level is the shell. Each function reads by index, calls one or two pure functions, writes. If a handler grows a branch that is not about reading or writing, the branch belongs in `domain/`.

`project.ts` owns the derivation. It is the only file that writes `bragCurrent` or `boardEntry`. Nothing else may, and that single-writer property is what makes concurrent reprojection safe without a lock.

`brags.ts` and `ingest.ts` own the append. They are the only files that insert into `bragEvents`.

`app/` owns presentation and nothing else. No page sorts, filters by rank, or decides whether a spot is numbered.

Both `app/` and `convex/` import from `convex/domain/`. Convex bundles the import graph, and these files are plain TypeScript with no server dependencies, so one copy of the ranking rule serves the query and the renderer. That matters most for `hours.ts` and `jsonld.ts`, which run on both sides.

## Call chains

Every public read is two files deep.

```
app/[country]/[city]/page.tsx  ->  convex/city.ts  ->  convex/domain/{spot,hours}.ts
app/[country]/[city]/[spot]/page.tsx  ->  convex/spot.ts  ->  convex/domain/{rank,brag,spot}.ts
```

Every write is three.

```
brag-here-panel.tsx  ->  convex/brags.ts  ->  bragEvents insert
                                          ->  scheduler  ->  convex/project.ts  ->  convex/domain/{brag,tally,rank}.ts
```

The scheduler hop is the only indirection in the design, and it earns its place. It moves reranking out of the user's request so an upload never waits on a city renumber, and it turns reprojection into a retryable unit. Under `principle-laziness-protocol` that is the one layer worth keeping.

Tracing "where does rank #3 come from" reads `city.ts`, then `project.ts`, then `domain/rank.ts`. Three files, and the third one is fifteen lines.

## Import rules worth a lint

Two rules that will otherwise erode, so encode them rather than write them down twice, per `principle-encode-lessons-in-structure`.

`convex/domain/**` may not import from `convex/_generated/**` or from `convex/server`. An ESLint `no-restricted-imports` rule fails the build. This keeps the domain pure by mechanism instead of by discipline.

`app/**` may not import `convex/project` or reference `bragCurrent` or `boardEntry` by name. The projections stay private.

## Build order mapping

The sketch is for all of v1, but only step 1 gets implemented now. What each SPEC step touches.

Step 1, shell. `app/layout.tsx`, `auth.ts`, `auth.config.ts`, `convex.config.ts`, `api/auth/[...all]`, `domain/i18n.ts`, `schema.ts` with `cities`, `spots`, `users` only.

Step 2, catalog and public pages. `catalog.ts`, `ingest.ts`, `city.ts`, `spot.ts`, `search.ts`, `domain/{places,hours,jsonld,spot}.ts`, `sitemap.ts`. The city page renders a tail and an empty board, which works because the board is a separate table that is simply empty.

Step 3, brag and board. `bragEvents`, `bragCurrent`, `boardEntry`, `brags.ts`, `project.ts`, `crons.ts`, `domain/{event,brag,tally,rank,maker}.ts`. This is the step the whole design exists for, and no earlier file changes shape when it lands.

Step 4, passport. `passport.ts` only. It needs no new table because `bragCurrent.by_maker_*` already answers both bragger boards.

Step 5, Instagram and queue. `identity.ts`, `ingest.ts` additions, `moderation.ts`, `aiMatchQueue`, `domain/ingest.ts`. The merge needs no schema change because `maker_remapped` is already a variant of `BragEvent`.

Step 6, polish. `_components/*` and `moderation.ts`.

Step 4 and step 5 adding no tables is the test of whether the step-3 shape was right.

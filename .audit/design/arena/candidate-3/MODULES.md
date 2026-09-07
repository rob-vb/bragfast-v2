# Module map

Ownership, not execution order. A reader should answer "who owns Maker merge?" and "who owns board order?" without walking a pipeline.

## Tree

```
src/domain/
  ids.ts              branded ids and parseUserId / parseInstagramUserId
  maker.ts            UserMaker, InstagramMaker, Maker
  vote.ts             MakerVote, RANKING_WINDOW_MS
  brag.ts             LiveBrag, HiddenBrag, BragMedia
  spot.ts             ListedSpot, GravestoneSpot, Hours, isOpenAt, SpotType
  ranking.ts          rankCity → BoardEntry[] + TailEntry[]
  pages.ts            CityPage, SpotPage, PassportPage, FeedItem

convex/
  schema.ts           tables and indexes
  convex.config.ts    Better Auth component register
  auth.config.ts      getAuthConfigProvider()
  auth.ts             createAuth, auth.api used only inside Convex
  lib/fromDoc.ts      Doc → domain. The parse boundary.
  lib/pairKey.ts      makerId + "|" + spotId. Storage lookup only.
  catalog.ts          cityPage, spotPage, search, homepage
  brags.ts            inApp, replace, remove, report, myLiveInAppAtSpot
  votes.ts            upsertVoteFromLiveBrag, recomputeVoteForPair, absorbMakerVotes
  makers.ts           connectInstagram, ensureUserMaker, passportBySlug
  spots.ts            addFromPlace, closed override, catalog ingest
  ingest.ts           Instagram hard-tag and caption queue. Step 5.
  admin.ts            reports queue, AI-match queue

src/app/
  layout.tsx          ConvexBetterAuthProvider, getToken() initialToken, i18n
  page.tsx            homepage RSC
  nl/page.tsx         NL home
  nl/[city]/page.tsx  city RSC
  nl/[city]/[spot]/page.tsx
  nl/u/[slug]/page.tsx
  api/auth/[...all]/route.ts    proxy to Convex via convexBetterAuthNextJs

src/ui/
  city/BoardList.tsx  server-safe list
  city/TailList.tsx
  city/CityMap.tsx    client island, usePreloadedQuery
  spot/SpotBody.tsx
  spot/SpotJsonLd.tsx
  spot/BragHere.tsx   client, mutations only
  passport/PassportBody.tsx

src/i18n/             nl default, en switch, same URLs, cookie / Accept-Language
```

Next.js pages import `src/domain/pages.ts` and `convex/_generated/api`. They do not import `convex/lib/fromDoc.ts` or `Doc<>`.

## Who owns which invariant

| Invariant | Module |
| --- | --- |
| A maker is a document with at least one account | `src/domain/maker.ts` plus `convex/makers.ts` writes |
| One vote per `(MakerId, SpotId)` | `convex/votes.ts` |
| Extra brags do not add votes | `convex/brags.ts` calls upsert, never insert-vote |
| 90-day board vs all-time count | `src/domain/ranking.ts` for the board; spot page counts `makerVotes` for all-time |
| Closed spots leave lists and reject new brags | `src/domain/spot.ts` type plus `convex/brags.ts` and `convex/catalog.ts` |
| Hidden brags leave the public feed and the vote | `convex/brags.ts` hide path plus `recomputeVoteForPair` |
| Instagram connect merges makers and retargets brags | `convex/makers.ts` |
| HTML in view-source | each public `page.tsx` via `preloadQuery` |

`convex/votes.ts` is not a pass-through. It is the only place that inserts, patches, retargets, or deletes `makerVotes`. `brags.ts` and `makers.ts` call it. Pages do not.

`src/domain/ranking.ts` is a pure function. `catalog.ts` loads listed spots and in-window votes, then calls `rankCity`. Board order is not recomputed in the RSC.

## Call chains, three files

City HTML: `app/nl/[city]/page.tsx` → `convex/catalog.ts` → `src/domain/ranking.ts`

In-app brag: `src/ui/spot/BragHere.tsx` → `convex/brags.ts` → `convex/votes.ts`

Instagram merge: connect UI → `convex/makers.ts` → `convex/votes.ts` for vote collapse, same mutation for brag `makerId` rewrite

Spot JSON-LD: `app/nl/[city]/[spot]/page.tsx` → `convex/catalog.ts` → `src/ui/spot/SpotJsonLd.tsx`

If a fourth file appears in those paths, flatten it.

## What this map refuses

No `services/` folder that forwards the same args to Convex.

No `makerKey.ts` that splits `user:` and `ig:`.

No `load.ts` / `validate.ts` / `transform.ts` / `save.ts` split. Time is not ownership.

No Next.js route that talks to Instagram and then patches Convex. Instagram tokens and hashtag ingest stay in `convex/ingest.ts`.

Better Auth `auth.api` stays inside Convex functions. The App Router only proxies `/api/auth/[...all]` and passes `initialToken` into `ConvexBetterAuthProvider`.

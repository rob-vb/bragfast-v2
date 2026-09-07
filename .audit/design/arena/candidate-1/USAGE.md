# Usage (caller's view)

Written before the types. The types in `SHAPE.md` are derived from these call sites.

## What a page author needs to know

Every public page is an RSC that makes one `fetchQuery` call and gets back a finished view model in domain terms. No Convex `Doc`, no `_creationTime`, no raw `maker_key` strings cross into `app/`. Signed-in interaction (brag, replace, delete, report) lives in small client islands that call mutations through `ConvexBetterAuthProvider`.

The vote rule a feature author must internalize is one sentence. A `MakerVote` row exists exactly when the maker has at least one visible post on the spot, and only `reconcileVote` may create or delete one. Feature code writes posts and calls reconcile. It never touches `makerVotes` directly.

## Call site 1: city page RSC, signed out

```tsx
// app/[country]/[city]/page.tsx  (server component, no "use client")
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { parseCitySlug } from "@/domain/ids";

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const citySlug = parseCitySlug((await params).city); // boundary parse; 404 on garbage
  const page = await fetchQuery(api.catalog.cityPage, { citySlug });
  if (!page) notFound();

  // page.board: RankedSpotCard[]  — numbered, score + tie-break already applied server-side
  // page.tail:  SeedSpotCard[]    — "Nog niet gebragd", never numbered, sorted by name
  return (
    <>
      <Board spots={page.board} />
      <CatalogTail spots={page.tail} heading={t("seedHeading")} />
    </>
  );
}
```

The caller never computes rank, never filters closed spots, never knows 90 days exists. Gravestones simply do not appear in either list because a gravestone cannot carry a `BoardStanding` and `cityPage` returns listed spots only.

## Call site 2: spot page RSC with JSON-LD, signed out; brag button as a child island

```tsx
// app/[country]/[city]/[spot]/page.tsx  (server component)
const spot = await fetchQuery(api.catalog.spotPage, { citySlug, spotSlug });
if (!spot) notFound();

if (spot.lifecycle.kind === "gravestone") {
  return <Gravestone spot={spot} />; // "Gesloten", no board figures, page kept for URLs
}

// lifecycle.kind === "listed": standing is rank+score or "nog niet op de board"
return (
  <>
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(foodEstablishmentJsonLd(spot)) }} />
    <SpotHeader name={spot.name} hours={spot.hours}
      standing={spot.lifecycle.standing}          /* { rank, score, latestBragAt } | null */
      allTimeMakers={spot.allTimeMakers} />
    <BragFeed items={spot.feed} />                 {/* hosted media urls + social embeds, newest first */}
    <BragHereIsland spotId={spot.id} />            {/* client island; renders sign-in CTA when signed out */}
  </>
);
```

`foodEstablishmentJsonLd` is a pure function in `domain/`. It only ever receives hosted-media image URLs because the feed item type separates hosted media from embeds, so "embed used as our JSON-LD image" is a compile error, not a code-review catch.

## Call site 3: in-app brag lifecycle (client island)

```tsx
// components/brag-here-island.tsx  ("use client")
const createBrag  = useMutation(api.brags.createInApp);
const replace     = useMutation(api.brags.replaceMedia);
const removeBrag  = useMutation(api.brags.remove);

// First brag on this spot: creates the post AND the vote in one transaction.
const r1 = await createBrag({ spotId, storageId, mediaType: "photo" });
// r1.vote === "granted"

// Second post, same maker, same spot: feed row only.
const r2 = await createBrag({ spotId, storageId: otherId, mediaType: "video" });
// r2.vote === "kept"  — still exactly one MakerVote

// Swap the photo: post updated in place, createdAt untouched, vote untouched.
await replace({ postId: r1.postId, storageId: newId, mediaType: "photo" });

// Delete both posts (AVG). Deleting the last visible one retracts the vote
// in the same transaction. The spot's board score drops atomically with it.
await removeBrag({ postId: r2.postId }); // vote: "kept"      (r1 still visible)
await removeBrag({ postId: r1.postId }); // vote: "retracted" (last visible post gone)
```

The island reads the outcome from the returned `VoteOutcome` to show "Je staat op de board" versus "toegevoegd aan je feed". It never queries `makerVotes`.

## Call site 4: maker merge when Instagram is linked

```ts
// convex/identity.ts (mutation body, runs inside one Convex transaction)
// Rewrite every post authored by ig:{igId} to user:{userId},
// then reconcile both keys on each touched spot.
const touched = await rewritePostMakers(ctx, { from: igKey, to: userKey });
for (const spotId of touched) {
  await reconcileVote(ctx, igKey, spotId);   // finds zero visible posts → deletes ig vote
  await reconcileVote(ctx, userKey, spotId); // upserts the single user vote
}
```

Duplicate-vote collapse is not special-cased. It falls out of "vote is a pure function of visible posts". Running the merge twice converges to the same state.

## Passport, for free

```ts
// app/[country]/u/[slug]/page.tsx (RSC)
const passport = await fetchQuery(api.passport.byslug, { userSlug });
// passport.uniqueSpots is the maker's MakerVote rows joined to spots.
// passport.postsThisWeek counts posts, not votes.
// passport === null before brag 1 → noindex/404 handled by the page.
```

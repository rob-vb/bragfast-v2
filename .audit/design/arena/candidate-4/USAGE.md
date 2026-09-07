# brag.fast usage (caller's view)

Written before the types. `SHAPE.md` is derived from this file. Where they disagree, this file wins.

## What a caller gets

Three things, and nothing else on the public surface.

One query per page. A city page is one `fetchQuery`. A spot page is one `fetchQuery`. The query returns rendered-ready domain data, already ordered, already filtered, already parsed into sum types. No page composes a board out of three queries.

One write path per fact. `api.brags.*` appends to an append-only log. Nothing else in the app writes rank, vote counts, or brag visibility. If you are reaching for a table to patch, you are in the wrong file.

Ranking is never computed by the caller. A board row arrives with `rank: 1`. A tail row has no `rank` field at all, so no component can render a fake number on a seed spot.

## City page (server component, signed out)

```tsx
// app/[country]/[city]/page.tsx
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { parseKindChips, parseTailSort } from "@/convex/domain/places";

export const revalidate = 300;

export default async function CityPage({ params, searchParams }: Props) {
  const { country, city } = await params;
  const q = await searchParams;

  const page = await fetchQuery(api.city.page, {
    country,
    citySlug: city,
    kinds: parseKindChips(q.type),
    tail: { sort: parseTailSort(q.sort), page: Number(q.page ?? 1) },
  });

  if (page.kind === "unknown_city") notFound();

  return (
    <CityShell city={page.city}>
      <BoardBlock entries={page.board} />
      <TailBlock heading="Nog niet gebragd" page={page.tail} />
      <OpenNowToggle hours={page.hoursBySpot} />
      <MapToggle pins={page.pins} />
    </CityShell>
  );
}
```

`page.board` is already in board order. `BoardBlock` renders `entry.rank` directly and has no sort of its own.

`page.tail` is a paginated cursor page of seed spots. Real `?page=2` links, crawlable, `rel=next`. Not infinite scroll.

`OpenNowToggle` and `MapToggle` are client components fed from `page.hoursBySpot` and `page.pins`, both already in the payload. "Open nu" and distance sorting never hit the server again. That keeps the route cacheable and the chips instant.

The `kinds` filter is server-side because it changes which rows exist. "Met brags" is not a query argument at all; it hides `TailBlock`.

## Spot page (server component, signed out)

```tsx
// app/[country]/[city]/[spot]/page.tsx
import { fetchQuery } from "convex/nextjs";
import { foodEstablishmentJsonLd } from "@/convex/domain/jsonld";

export const revalidate = 300;

export default async function SpotPage({ params }: Props) {
  const { country, city, spot } = await params;
  const page = await fetchQuery(api.spot.page, { country, citySlug: city, spotSlug: spot });
  if (page.kind === "unknown_spot") notFound();

  const jsonLd = foodEstablishmentJsonLd(page.spot, page.licensedImage);

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SpotHeader spot={page.spot} />
      {page.spot.status.kind === "closed_permanently" && <Gravestone since={page.spot.status.since} />}

      <Standing standing={page.standing} allTimeMakers={page.allTimeMakers} />

      <Feed items={page.feed.items} nextCursor={page.feed.nextCursor} />
      <BragHerePanel spotId={page.spot.id} />
    </>
  );
}
```

`page.standing` is a sum type, so the "nog niet op de board" copy is a branch the compiler forces you to handle:

```tsx
function Standing({ standing }: { standing: BoardStanding }) {
  switch (standing.kind) {
    case "ranked":
      return <p>#{standing.rank} in {standing.citySlug} ({standing.makers90d} makers)</p>;
    case "unranked":
      return <p>Nog niet op de board</p>;
  }
}
```

`page.licensedImage` is `LicensedImage | null`. It can only be non-null when an in-app upload backs it. An Instagram embed cannot become a JSON-LD image because there is no constructor that produces a `LicensedImage` from an embed permalink. The licensing rule is enforced by the type, not by a reviewer noticing.

`BragHerePanel` is the one client component that talks to Convex live. It is a child, so the page above it stays static HTML for crawlers.

## Bragging (client component, signed in)

```tsx
"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function BragHerePanel({ spotId }: { spotId: SpotId }) {
  const uploadUrl = useMutation(api.brags.generateUploadUrl);
  const create = useMutation(api.brags.create);
  const replace = useMutation(api.brags.replaceMedia);

  async function onPick(file: File) {
    const url = await uploadUrl({});
    const { storageId } = await put(url, file);
    await create({ spotId, media: { kind: "photo", storageId } });
  }

  async function onSwapPhoto(bragId: BragId, file: File) {
    const url = await uploadUrl({});
    const { storageId } = await put(url, file);
    await replace({ bragId, media: { kind: "photo", storageId } });
  }
}
```

`create` takes no maker argument. The mutation derives the maker from the Better Auth session. A caller cannot brag as someone else because there is no parameter to pass.

`create` called twice for the same maker and spot returns the existing `BragId` and leaves the board untouched. The second call is a feed row, not a vote.

`replaceMedia` swaps the file and does not move the spot on the board. The visit timestamp is set once by `create` and is never rewritten, so replacing a photo cannot farm a tie-break.

The bragger sees their own brag immediately because this panel is live Convex, even while the cached page above it is up to five minutes stale.

## Merging an Instagram identity

```ts
// convex/identity.ts, called after Better Auth links the Instagram account
const result = await mergeInstagram({ igUserId: "17841400000000000" });
// { remappedBrags: 12, collapsedVotes: 2, reprojectedCities: ["haarlem", "utrecht"] }
```

One call. It appends one `maker_remapped` event per affected brag, then reprojects. No brag row is rewritten and no history is lost.

The vote collapse is not a special case anywhere in the code. The tally counts distinct canonical makers, and after the remap both brags resolve to the same maker, so the count drops by one on its own.

Calling it twice is a no-op. The second run appends nothing because every brag already resolves to the canonical maker.

## Changing the ranking rule

The window length is a guess. When it changes, edit `convex/domain/tally.ts` and replay.

```bash
npx convex run project:replay '{}'
```

Replay walks the log, rewrites both projections, and reranks every city. It is safe to run on production while traffic is live because it converges rather than deltas, and it is safe to run twice.

This is the whole reason the log exists. Without it, changing 90 days to 60 is a data migration.

## What the caller cannot do

- Read a projection table directly. `bragCurrent` and `boardEntry` are not on the public API.
- Write a rank, a vote, or a maker count.
- Get a `rank` on a closed spot or a seed spot. The types do not carry one.
- Pass a caption or any user text into the translation helper. `t()` accepts `MessageKey` only.

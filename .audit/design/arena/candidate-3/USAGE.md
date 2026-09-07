# How a Next.js page talks to brag.fast

You import Convex functions and domain types. You never parse a maker string. You never see a Convex `Doc`. A city page, a spot page, an in-app brag, and an Instagram connect are four calls. Ranking, vote uniqueness, and identity merge sit behind those calls.

Public catalog queries work with no auth token. Mutations that write a brag or link Instagram require a Better Auth session. The Next.js app proxies `/api/auth/[...all]` to Convex and does not grow a second auth path.

Pass `nowMs` from the RSC. Ranking is a function of votes and that timestamp. Do not call `Date.now()` inside a Convex query.

## City page, signed out

`app/nl/[city]/page.tsx` loads one query. That query returns a numbered board and a catalog tail as two different arrays. A seed cannot appear in `board` because `BoardEntry` is only constructed when the spot has at least one `MakerVote` in the 90-day window.

```ts
import { preloadQuery, preloadedQueryResult } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { notFound } from "next/navigation"
import { BoardList } from "@/ui/city/BoardList"
import { TailList } from "@/ui/city/TailList"
import { CityMap } from "@/ui/city/CityMap"

export default async function CityPage({
	params,
}: {
	params: Promise<{ city: string }>
}) {
	const { city: citySlug } = await params
	const preloaded = await preloadQuery(api.catalog.cityPage, {
		country: "nl",
		citySlug,
		nowMs: Date.now(),
	})
	const page = preloadedQueryResult(preloaded)
	if (page === null) notFound()

	return (
		<>
			<BoardList entries={page.board} />
			<TailList entries={page.tail} />
			<CityMap preloaded={preloaded} />
		</>
	)
}
```

`BoardList` renders `entry.rank` and `entry.spot.name`. `TailList` renders `entry.spot.name` and has no rank field to print. The map toggle is client view state. It reuses the same preloaded payload. It does not refetch.

Filters belong in the query args, not in the RSC.

```ts
await preloadQuery(api.catalog.cityPage, {
	country: "nl",
	citySlug,
	nowMs: Date.now(),
	openNow: true,
	hasBrags: true,
	type: "bakery",
})
```

When `hasBrags` is true, `tail` is empty. That is the "Met brags" chip.

## Spot page, signed out HTML, signed-in brag child

The RSC still uses `preloadQuery` so `view-source` contains name, address, hours, and JSON-LD. The signed-in "brag here" block is a client child. It does not block the catalog HTML.

```ts
import { preloadQuery, preloadedQueryResult } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { notFound } from "next/navigation"
import { SpotJsonLd } from "@/ui/spot/SpotJsonLd"
import { SpotBody } from "@/ui/spot/SpotBody"
import { BragHere } from "@/ui/spot/BragHere"

export default async function SpotPage({
	params,
}: {
	params: Promise<{ city: string; spot: string }>
}) {
	const { city: citySlug, spot: spotSlug } = await params
	const preloaded = await preloadQuery(api.catalog.spotPage, {
		country: "nl",
		citySlug,
		spotSlug,
		nowMs: Date.now(),
	})
	const page = preloadedQueryResult(preloaded)
	if (page === null) notFound()

	return (
		<>
			<SpotJsonLd page={page} />
			<SpotBody page={page} />
			{page.kind === "listed" ? <BragHere spotId={page.spot.id} /> : null}
		</>
	)
}
```

`SpotJsonLd` may use a hosted in-app image. It must not use an Instagram embed URL as `image`. A gravestone page is `page.kind === "gravestone"`. It has no "brag here" and no city rank field.

`BragHere` is the only signed-in child.

```ts
"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { SpotId } from "@/domain/ids"

export function BragHere({ spotId }: { spotId: SpotId }) {
	const existing = useQuery(api.brags.myLiveInAppAtSpot, { spotId })
	const brag = useMutation(api.brags.inApp)
	const replace = useMutation(api.brags.replace)
	const remove = useMutation(api.brags.remove)

	async function onUpload(storageId: string, contentType: "image" | "video") {
		if (existing === undefined) return
		if (existing === null) {
			await brag({ spotId, storageId, contentType })
			return
		}
		await replace({ bragId: existing.id, storageId, contentType })
	}

	async function onDelete() {
		if (existing === undefined || existing === null) return
		await remove({ bragId: existing.id })
	}

	return null
}
```

`inApp` inserts a hosted brag and upserts the caller's `MakerVote` for that spot. A second upload from the same user on the same spot goes through `replace`. The vote stays one row. Extra Instagram posts for the same maker are separate brag rows and still one vote. The page never writes `MakerVote`.

## Instagram connect, merge

Linking Instagram is one mutation. The caller passes the Instagram user id that Better Auth linking just proved. Convex finds or creates nothing on the Next.js side.

```ts
"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export function ConnectInstagramButton({ instagramUserId }: { instagramUserId: string }) {
	const connect = useMutation(api.makers.connectInstagram)

	async function onConnected() {
		const result = await connect({ instagramUserId })
		if (result.kind === "already_linked") return
		if (result.kind === "linked") return
		if (result.kind === "merged") {
			void result.absorbedMakerId
			return
		}
	}

	return null
}
```

After `merged`, brags that used to point at the Instagram-only maker now point at the signed-in user's maker. Duplicate votes on the same spot have collapsed to one. If the user had no passport yet, the mutation assigns a slug in that same turn, because the retargeted brags count as the first brag. Passport URLs do not change after that. Instagram-only makers never had a `/nl/u/{slug}` page.

Run `connectInstagram` twice with the same id. The second call returns `already_linked`. No second merge.

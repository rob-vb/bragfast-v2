# Caller usage

Public pages call a server-only catalog module. They receive page models, not Convex documents. The module uses `fetchQuery` so the returned HTML contains the catalog, board, feed, and structured data without client hydration.

## City page RSC

```tsx
import { publicCatalog } from "@/server/public-catalog";

export default async function CityPage({
	params,
	searchParams,
}: {
	params: Promise<{ country: string; city: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const route = await params;
	const query = await searchParams;
	const page = await publicCatalog.cityPage({
		countryCode: route.country,
		citySlug: route.city,
		filters: parseCityFilters(query),
	});

	return (
		<CityDirectory
			board={page.board}
			catalogTail={page.catalogTail}
			mapPins={page.mapPins}
		/>
	);
}
```

`page.board` is already numbered. `page.catalogTail` contains every open catalog spot not present on the 90-day board. The page does not count makers or join brags.

## Spot page RSC

```tsx
import { publicCatalog } from "@/server/public-catalog";

export default async function SpotPage({
	params,
}: {
	params: Promise<{ country: string; city: string; spot: string }>;
}) {
	const route = await params;
	const page = await publicCatalog.spotPage(route);

	return (
		<>
			<FoodEstablishmentJsonLd value={page.jsonLd} />
			<SpotHeader spot={page.spot} rank={page.rank} />
			<OpeningHours hours={page.hours} />
			<BragFeed items={page.feed.items} nextCursor={page.feed.nextCursor} />
			<BragHere spotId={page.spot.id} />
		</>
	);
}
```

The signed-out RSC gets hosted-media URLs only for brag.fast uploads. Social items contain an official embed URL and an origin permalink. The signed-in `BragHere` child owns authentication and upload state.

## Write flows

```ts
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

const submit = useMutation(api.brags.submitInApp);
const replace = useMutation(api.brags.replaceInApp);

await submit({
	spotId,
	uploadId,
	mediaKind: "photo",
});

await replace({
	bragId,
	uploadId: replacementUploadId,
	mediaKind: "video",
});

await ctx.runMutation(internal.makers.mergeInstagram, {
	authUserId,
	instagramUserId,
});
```

`submitInApp` inserts one document for the first in-app post. A later `replaceInApp` patches that document and returns the same `bragId`. Additional imported posts create more `Brag` documents, but the mutation keeps one visible anchor for the maker and spot. `mergeInstagram` rewrites the Instagram maker key and reconciles each affected spot in the same transaction.

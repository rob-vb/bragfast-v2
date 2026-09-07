# Module map

The design groups files by the rules they own. It does not split loading, validation, ranking, and saving into separate layers.

```text
convex/
  convex.config.ts
  auth.config.ts
  schema.ts
  auth.ts
  domain/
    identity.ts
    spots.ts
    brags.ts
    ranking.ts
    publicViews.ts
  functions/
    publicCatalog.ts
    brags.ts
    makers.ts
    instagram.ts
    moderation.ts
  generated/
    ...

src/
  app/
    api/auth/[...all]/route.ts
    nl/[city]/page.tsx
    nl/[city]/[spot]/page.tsx
    nl/u/[slug]/page.tsx
  server/
    public-catalog.ts
    auth.ts
  domain/
    public.ts
  components/
    city/
    spot/
    brag/
```

## Convex domain modules

`convex/domain/identity.ts` owns `MakerKey`, its constructors, and maker-key merge planning. It is the only module that parses `user:` and `ig:` strings.

`convex/domain/spots.ts` owns `SpotDocument`, lifecycle transitions, route lookup, and the `OpenSpot` guard. Catalog ingest and user-add both call this module.

`convex/domain/brags.ts` owns `BragDocument` and every transition that can change a maker and spot group. Its operations create a post, replace hosted media, hide a post, delete a post, and reconcile one anchor. No function module patches brag state directly.

`convex/domain/ranking.ts` owns `RankingWindow` and the pure board calculation. Its input is a set of open spots plus visible brags. Its output is a numbered board and a catalog tail.

`convex/domain/publicViews.ts` owns public return validators and view construction. It strips storage fields, selects licensed image URLs, and builds `FoodEstablishmentJsonLd`.

## Convex function modules

`convex/functions/publicCatalog.ts` contains the signed-out city, spot, search, sitemap, and passport queries. Each query delegates one complete result to a domain operation. The module does not expose raw rows.

`convex/functions/brags.ts` contains authenticated in-app mutations. It converts Better Auth identity into `UserMakerKey`, checks file ownership, loads the spot, and calls the brag transition.

`convex/functions/makers.ts` links Instagram to the authenticated profile and runs the atomic maker merge. It owns the cross-identity transaction because identity linking creates the need for that transaction.

`convex/functions/instagram.ts` validates provider payloads, accepts hard place tags, and writes social brags. Caption-only matches go to `aiMatchQueue` and never call the brag creation operation.

`convex/functions/moderation.ts` owns reports, hide decisions, and queue decisions. An approved caption match calls the same brag creation operation as a hard place tag.

## Next.js boundary

`src/server/public-catalog.ts` is a server-only adapter. It adds the clock and locale, calls Convex with `fetchQuery`, and parses the returned public model. This boundary earns its place because it hides Convex transport, the 90-day clock input, and generated API types from routes.

`src/server/auth.ts` owns the official Better Auth Convex bridge. It calls `getToken()` for SSR and supports `ConvexBetterAuthProvider`. It does not create a second session or identity model.

`src/domain/public.ts` contains the public page-model types derived from the Convex return validators. Components depend on these types. They do not depend on `Doc<"brags">`, `Doc<"spots">`, or Better Auth wire objects.

Route files compose page models into server-rendered HTML. Components render data and collect input. They do not count makers, assign rank numbers, resolve maker keys, or decide whether media can be hosted.

## Dependency direction

```text
Next.js route
  -> src/server/public-catalog.ts
  -> Convex public function
  -> Convex domain operation
  -> Convex tables

Authenticated component
  -> Convex mutation
  -> auth and provider boundary checks
  -> Convex domain operation
  -> Convex tables
```

No adjacent module forwards the same arguments unchanged. Function modules adapt framework data and enforce boundary policy. Domain modules own state rules. Routes receive finished page models.

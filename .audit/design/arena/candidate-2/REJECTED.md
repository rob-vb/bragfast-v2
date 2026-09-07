# Rejected shapes

## Separate `MakerVote` records

This shape stores posts in `brags` and current votes in `makerVotes`.

It makes the board query direct, but every post creation, hide, delete, and maker merge must update two representations. A crash does not split a Convex transaction, yet future code can still write one table without the other. The public API would need to explain post state and vote state, or hide a large reconciliation system. The read gain does not justify the second source of truth for v1.

## Posts without an anchor role

This shape stores only visible and hidden posts. Every board query groups by maker.

The board result is correct, but the database cannot expose one canonical representative for the maker and spot group. Every query that needs maker uniqueness must remember to group. The assigned design requires a write-time uniqueness rule, so one visible anchor earns its field. The board still groups by maker and does not trust the anchor for scoring.

## One mutable post per maker and spot

This shape uses one unique brag document and replaces its content for every later post.

It has a small schema and strong uniqueness. It destroys the feed history that the product requires. Social import would have to discard posts or move them into another post table, which recreates two content models.

## Stored 90-day vote state

This shape stores `countsInBoard`, `expiresAt`, or a materialized score on a brag or spot.

Time can make the stored state false without a write. A scheduler and repair job then become part of rank correctness. `RankingWindow` derives the range at read time and removes that lifecycle.

## Plain string maker keys

This shape passes strings such as `user:abc` and `ig:123` through all functions.

It has less type syntax but lets callers swap account IDs, Instagram IDs, and complete maker keys. It also spreads prefix parsing into auth, import, ranking, and merge code. The branded `MakerKey` union keeps parsing at two boundaries and makes variant handling exhaustive.

## Identity table instead of maker-key rewrite

This shape gives every human an identity row and points each provider identity to it. Brags keep the identity ID forever.

It handles merges cleanly at large scale, but it changes the product rule that unconnected provider users are independent makers and that linking rewrites `ig:` to `user:`. It also adds a join or canonicalization lookup to every board read. V1 uses an atomic rewrite and leaves a high-volume merge workflow as a named risk.

## Generated Convex documents as page models

This shape returns `Doc<"spots">` and `Doc<"brags">` to Next.js routes.

It removes mapping code but leaks storage fields, hidden moderation state, hosted file IDs, and denormalized keys into the UI. A schema change would become a route change. Public return models hide those details and prevent an unlicensed social image from reaching JSON-LD.

## `preloadQuery` for every public page

This shape preloads city and spot data in RSCs and hands it to client components.

It is useful when a client component needs reactive updates. These public pages need crawlable HTML and do not need a live catalog subscription. `fetchQuery` returns the data to the RSC with less client code. The signed-in brag child can use reactive Convex hooks without moving the public page into the client.

## Convex HTTP endpoints for catalog reads

This shape calls custom HTTP routes from Next.js.

It adds request routing, serialization, and error mapping around a first-party server client that already exists. The HTTP layer would be a pass-through method with no policy. `PublicCatalog` uses `fetchQuery` and adds the clock, locale, validation, and public-model conversion at one boundary.

## Modules split by execution stage

This shape creates separate loaders, validators, transformers, rankers, and savers.

Those modules would all know the same brag variants and anchor invariant. Tracing one mutation would cross more than three files. The chosen modules group code by identity, spot, brag, and ranking rules. Function files only adapt framework input to those domain operations.

## Red-flag screen

The selected design has no public method sequence that callers must coordinate to render a page. Public models contain no wire or storage types. Modules own domain knowledge rather than execution order. The Next.js adapter is not a pass-through because it adds server time, locale, transport, and parsing policy.

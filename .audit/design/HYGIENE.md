# Catalog hygiene (SPEC leftover after steps 1–6)

Usage first. Types follow. Second arena skipped. Shell synthesis and candidate 1 already named a daily Places job, `placesRaw` scratch, and `upsertFromPlaces`. Type chips stay removed. Instagram stays as seeded. `makerVotes` still has one writer.

## How the catalog writes today

Spots enter through `upsertSpot` in `convex/model/spots.ts`. The seed, user-add live path, and owner approve-spot-add all call it. Identity is Place ID. `planSpotUpsert` retargets a `seed:` row when a later job brings a real Place ID on the same city slug.

User-add classifies Places types in `classifyPlaceTypes`. Hospitality goes live. Petrol and offices wait in `spotAddQueue`. That queue is a seeker submission, not a catalog discovery dump.

Closed override lives on `/admin`. `planClosedOverride` plus a patch that drops `boardScore` / `latestBragAt` / `windowExpiresAt` so `parseSpot` still accepts the row. `upsertSpot` does not yet drop those columns on gravestone. Hygiene close must, or a ranked cafe that Places marks permanently closed becomes an illegal row.

The only cron is hourly standing expiry. Hours, address, and new breakfast places do not refresh.

## Problem

SPEC catalog maintenance is hygiene, not ranking. Upsert by Place ID. Refresh hours and address. Mark permanently closed as gravestone. Discover new breakfast/brunch hospitality in featured NL cities. Temporarily closed follows hours. Board order stays a vote problem.

No `GOOGLE_PLACES_API_KEY` on this VPS. Same fixture pattern as catalog and social. Keep the ingest shape. Seed Haarlem and one empty featured city. Do not scrape.

## Usage (caller's view)

A daily Convex cron calls Places text search per featured city when the key exists. Without the key the cron is a no-op. A one-shot `hygieneDemo` runs the same writer on fixtures.

After the demo:

- Haarlem tail lists **Bregje**. It is not numbered. Anne&Max stays 01 with score 2. Jopenkerk stays in the tail.
- `/nl/haarlem/bakkerij-honing` shows weekday open at **06:30**.
- Amsterdam lists **De Bakkerswinkel Amsterdam**. It was empty.
- A petrol snapshot does not appear on any city page and does not enter `spotAddQueue`.
- De Oude Banketbakker stays a gravestone. Hygiene does not reopen owner or seed graves.

## Shape

`planHygiene` is a pure state machine over a `PlacesSnapshot` plus the existing row.

- Not hospitality (`classifyPlaceTypes` would queue). Skip. Do not insert. Do not use `spotAddQueue`.
- `CLOSED_PERMANENTLY` and a listed row. Close. Drop standing columns. Keep the URL.
- `CLOSED_PERMANENTLY` and no row. Skip. Do not mint gravestones for places we never listed.
- `CLOSED_PERMANENTLY` and already a gravestone. Noop.
- Operational or temporarily closed, no row. Insert listed. Temp-closed is hours, not gravestone.
- Operational or temporarily closed, listed. Refresh name, address, geo, hours, type.
- Operational or temporarily closed, gravestone. Noop. Owner close and seed graves win.

`placesHoursToOpeningHours` maps same-day Google periods (`day` 0 = Sunday) to `OpeningHours`. Overnight periods drop. Empty periods become `null`.

Apply goes through `upsertSpot` for insert and refresh. Close uses the same standing-dropping patch as `admin.closeSpot`. Re-running the demo converges.

The Places HTTP adapter lives in `convex/ingest.ts`. Raw JSON does not leak into `planHygiene`. `placesRaw` stores the snapshot for scratch. Public pages never read it.

## Synthesis decision

Base remains arena candidate 1. Hygiene is the missing daily job on that map. It does not become a second spot writer.

## Tradeoffs accepted

- We accept Haarlem and Amsterdam fixtures instead of live Places, in exchange for a falsifiable HTML predicate on this VPS.
- We accept never auto-reopening gravestones, in exchange for not fighting the owner closed override.
- We accept skipping newly discovered permanently closed places, in exchange for not minting empty grave URLs.
- We accept skipping non-hospitality instead of the user-add queue, in exchange for not flooding `/admin` from a city-wide search.
- We accept a no-op cron when the key is missing, in exchange for not rewriting Haarlem every night from demo data.

## Alternatives considered

- Blocking the step on a Places key. Loses. Catalog and social already shipped the writer plus fixtures.
- Putting discovered petrol in `spotAddQueue`. Loses. That table is seeker add, not crawl leftovers.
- Closing Anne&Max from a fixture to prove gravestone. Loses. `verify-brag.sh` would fail.
- Re-adding type chips because SPEC lists them. Loses. The owner removed them.

## Next implementation step

Pure `planHygiene` / hours mapping plus tests, then apply + cron + Haarlem/Amsterdam demo, then public HTML plus `hygieneState`.

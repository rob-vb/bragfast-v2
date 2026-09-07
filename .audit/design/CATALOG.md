# Catalog sketch (SPEC step 2)

Usage first. Types follow. Second arena skipped: Shell synthesis already named `catalog.ts`, view models, JSON-LD, and upsert-by-placeId.

## Call sites

Homepage RSC calls `api.catalog.homepage` and, when `?q=` has two or more characters, `api.catalog.searchCatalog`. Search is a GET form so view-source proves hits. Featured cities are links to `/nl/{city}`.

City RSC parses the slug, calls `api.catalog.cityPage`, 404 on null. The page is two blocks. Board stays empty until a maker votes (step 3). Tail is unnumbered listed seeds, heading **Nog niet gebragd**. Gravestones are absent.

Spot RSC calls `api.catalog.spotPage`. View-source includes `application/ld+json`. Gravestone renders **Gesloten** and stays at the URL. Feed rows go through `requireVisiblePost`. JSON-LD image is `LicensedImage | null`. Social embed *display* is typed here so a later Instagram post cannot become our image. Ingest of Instagram is still step 5.

Sitemap reads `api.catalog.sitemapEntries`. Gravestone URLs stay. Passports stay out.

## Seed

First fill is a Haarlem fixture with `seed:nl:haarlem:*` ids. `planSpotUpsert` retargets a seed row when a later Places job upserts the same `{citySlug, slug}` with a real Place ID. Matching only on Place ID would insert a duplicate. Re-running the seed against a real Place ID must not overwrite it. No Google Places key in this run. Amsterdam, Rotterdam, Utrecht exist as city rows so search can hit a city with no spots.

## Out of this step

Map toggle, type chips, near-me, in-app brag upload, Places autocomplete, Instagram ingest.

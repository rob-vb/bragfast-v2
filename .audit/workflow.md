# brag.fast v1 workflow

This run is catalog hygiene (SPEC catalog maintenance, leftover after steps 1–6). Social, polish, and user-add already VERIFIED. Type chips stay removed.

Status: VERIFIED on 2026-09-02 via `scripts/verify-hygiene.sh`, plus brag, social, polish, catalog, and passport scripts.

Falsifiable done. Haarlem tail lists Bregje unnumbered. `/nl/haarlem/bakkerij-honing` shows 06:30. Amsterdam lists De Bakkerswinkel Amsterdam. Petrol is absent from city HTML and from `spotAddQueue`. Anne&Max stays 01 score 2. Jopenkerk stays in the tail. Prove it on `http://77.42.31.66`.

Do not download Instagram bytes. Do not re-add type chips. Do not reopen gravestones. Do not write `makerVotes`.

Rigor. High on close vs standing columns, skip vs user-add queue, insert vs reopen.

## Units (verify each before the next)

1. `planHygiene` / `placesHoursToOpeningHours` plus tests. Evidence: `npm run test:domain` (36 pass).
2. Apply snapshots through `upsertSpot` and the standing-drop close patch. Evidence: `internal.seed.hygieneState`.
3. Public HTML predicate. Evidence: `scripts/verify-hygiene.sh` against `http://77.42.31.66`.
4. Stop.

## Fan-out

Hygiene insert and refresh go through `upsertSpot`. Close copies `admin.closeSpot`. Cron without a key is a no-op.

## Blockers

No Google Places key. Live text search waits on `GOOGLE_PLACES_API_KEY`. Fixtures still satisfy the SPEC predicate.

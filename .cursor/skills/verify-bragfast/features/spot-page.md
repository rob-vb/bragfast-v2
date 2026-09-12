# Spot page

A spot URL shows one visitor-added tent. In PR-3 the catalog is empty, so old scraped Haarlem paths 404.

## Sub-features

- `spot-missing` 404s `/nl/haarlem/anne-max` and `/nl/haarlem/oude-banketbakker`.
- `spot-live` is unreachable until a later PR adds a visitor spot.

## How to get to it (user POV)

- From a woonplaats list, choose a tent card. There are no cards in PR-3.
- Open `/nl/{city}/{spot}` directly. Wrong city slug aliases redirect to the canonical city keeping the spot slug.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at the launched origin (`BRAGFAST_VERIFY_PORT`, default 3019).
- `spotPage` returns null for scraped catalog slugs.

- **Old tent.** Run `… http GET /nl/haarlem/anne-max --out artifacts/spot-page/anne-max.html`. Status `404`. The body does not present Anne&Max as a live tent.
- **Gravestone.** Run `… http GET /nl/haarlem/oude-banketbakker --out artifacts/spot-page/gravestone.html`. Status `404`.
- **Proof.** Keep both HTML files with the 404 status recorded in the drive notes.

## Gotchas

- Trunk still serves `/nl/haarlem/anne-max` as 200. Head must 404.
- Unknown spot slugs also 404. That is the success path in PR-3.

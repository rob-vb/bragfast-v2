# Spot page

A spot URL shows one visitor-added tent: name, address, like, share, hero photo, and a gallery of hosted photos.

## Sub-features

- `spot-missing` 404s `/nl/haarlem/anne-max` and `/nl/haarlem/oude-banketbakker`.
- `spot-live` GET `/nl/oldenzaal/zoete-kruimels` shows the tent name, the hero, and a `Foto's` gallery of hosted images.

## How to get to it (user POV)

- From a woonplaats list, choose a tent card.
- Open `/nl/{city}/{spot}` directly. Wrong city slug aliases redirect to the canonical city keeping the spot slug.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at the launched origin (`BRAGFAST_VERIFY_PORT`, default 3019).
- Shared Convex may already hold visitor spots. Do not write.

- **Old tent.** Run `… http GET /nl/haarlem/anne-max --out artifacts/spot-page/anne-max.html`. Status `404`. The body does not present Anne&Max as a live tent.
- **Live tent.** Run `… http GET /nl/oldenzaal/zoete-kruimels --out artifacts/spot-page/zoete-kruimels.html`. Status `200`. Body contains `Zoete Kruimels` and `Foto's`. After backfill the gallery has a Convex storage `img`.
- **Proof.** Keep both HTML files with status recorded in the drive notes.

## Gotchas

- Unknown spot slugs 404.
- Gallery is empty until `photos` rows exist. Create and backfill insert the hero as the first row. Extra photos come from the app `places.publish`, not website add.

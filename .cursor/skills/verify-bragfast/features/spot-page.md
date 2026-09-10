# Spot page

A spot URL shows one tent: name, address, city link, hours, 90-day rank or not-on-board, all-time makers, JSON-LD, and a brag feed. Permanently closed tents keep the URL as a gravestone and drop off the city list.

## Sub-features

- `spot-live` renders Anne&Max Haarlem with address and back-link to Haarlem.
- `spot-hours` lists weekday periods or `Openingstijden volgen.`
- `spot-rank` shows `#N` when on the board, otherwise `Nog niet op de board`, plus a makers sentence.
- `spot-jsonld` emits `application/ld+json` `CafeOrCoffeeShop` (or Bakery/Hotel/FoodEstablishment) with name and NL address; image only if licensed in-app storage.
- `spot-feed` shows newest brags or `Nog geen brags.` Signed-out live spots offer `Log in om te braggen` — do not complete sign-in.
- `spot-gravestone` on `/nl/haarlem/oude-banketbakker` shows `Gesloten`.

## How to get to it (user POV)

- From the Haarlem list, choose a tent card.
- From search hits, choose a spot card.
- Open `/nl/{city}/{spot}` directly. Wrong city slug aliases redirect to the canonical city keeping the spot slug.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/`.
- `/nl/haarlem/anne-max` and `/nl/haarlem/oude-banketbakker` exist in Convex.

- **Live tent.** Run `… http GET /nl/haarlem/anne-max --out artifacts/spot-page/anne-max.html`. Status `200`, h1 `Anne&Max Haarlem` (entity-encoded in HTML is fine), address `Grote Houtstraat 92`, link `Terug naar Haarlem` → `/nl/haarlem`.
- **Hours and rank.** Same file: heading `Openingstijden` and at least one `08:00–16:00` period (seed weekdays) **or** `Openingstijden volgen.` Rank chip is `#` plus a number **or** `Nog niet op de board`. Makers copy matches `N mens(en) hebben hier gebragd` / `Nog niemand heeft hier gebragd` (or the 1-person form).
- **JSON-LD.** In `anne-max.html` extract `<script type="application/ld+json">`. `@type` is `CafeOrCoffeeShop`, `name` is `Anne&Max Haarlem`, `address.addressCountry` is `NL`. If `image` is present it must be Convex storage (`convex.cloud/api/storage`), never `instagram.com`.
- **Feed chrome.** Same file includes `Log in om te braggen` when signed out. Hosted brag `<img>`/`<video>` URLs if seed makers still have media; empty state `Nog geen brags.` if the feed was cleared. Do not upload.
- **Share control.** Button `Deel` is client-side; HTTP proves it is in the tree. Clicking it is optional browser-only and must not be required for this feature.
- **Gravestone.** Run `… http GET /nl/haarlem/oude-banketbakker --out artifacts/spot-page/gravestone.html`. Status `200`, name `De Oude Banketbakker`, visible `Gesloten`. No `Log in om te braggen` upload affordance on a closed tent.
- **Proof.** Keep `anne-max.html` (JSON-LD + heading) and `gravestone.html`. That is the action (GET those URLs) and the resulting public HTML, including schema.

## Gotchas

- View-source HTML is the product for SEO. A client-only screenshot without JSON-LD is incomplete proof of `spot-jsonld`.
- Canonical site URL inside JSON-LD `url` may still say `http://77.42.31.66` from `NEXT_PUBLIC_SITE_URL`. That is share/canonical config, not a sign you drove the owner preview. The request itself must be :3019.
- Unknown spot slugs 404. Do not use `/nl/haarlem/missing` as a success path.
- Completing `Log in om te braggen` opens the global sign-in dialog (custom event). Do not send a magic link.

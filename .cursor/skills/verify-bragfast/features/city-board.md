# City board

A city page lists every listed breakfast/brunch tent in that gemeente. Spots with ≥1 maker in 90 days wear the egg. Seed spots sit in the same list without an egg. Rank numbers are not on this page.

## Sub-features

- `city-list` shows Haarlem listed tents including the seeded names, default list view.
- `city-egg` marks bragged tents with `/brag_fast_egg.svg`; seed tents have no egg.
- `city-gravestone-hidden` keeps `De Oude Banketbakker` off the list.
- `city-filter-open` toggles `Open nu` via `?open=1`.
- `city-filter-brags` toggles `Met brags` via `?brags=1` (egg spots only).
- `city-map` toggles `Kaart` via `?view=map` (Leaflet after hydrate).
- `city-sort` offers `Naam` vs `Afstand` on the list (distance needs geolocation).

## How to get to it (user POV)

- Open `/nl/haarlem` (search exact city, featured card, or type the URL).
- Aliases redirect to the canonical slug (`/nl/{alias}` → `/nl/{canonical}`).
- Filter chips and Lijst/Kaart are links on the city page.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/`.
- Convex Haarlem catalog still includes the seed listed spots and the gravestone URL.

- **Open Haarlem.** Run `… http GET /nl/haarlem --out artifacts/city-board/haarlem.html`. Status `200`, h1 `Haarlem`. HTML includes `Anne&amp;Max Haarlem` (or `Anne&Max`), `STACH Haarlem`, `Jopenkerk`, `Bakkerij Honing`, `Koffielokaal Spaarne`. Each listed tent links `/nl/haarlem/{slug}`.
- **No gravestone in the list.** `De Oude Banketbakker` / `oude-banketbakker` must not appear in `haarlem.html`.
- **Egg vs seed.** In the same HTML, the Anne&Max card includes `/brag_fast_egg.svg` if that tent is on the 90-day board. A seed tent with zero makers has a card **without** that egg image. Live data may put eggs on more tents; do not require Jopenkerk to lack an egg if makers appeared. Require at least one egg if Anne&Max is still bragged, and require the list is **not** split by a `Nog niet gebragd` heading.
- **Open nu.** Run `… http GET '/nl/haarlem?open=1' --out artifacts/city-board/open-now.html`. The `Open nu` link has `aria-pressed="true"`. The list is a subset of the unfiltered list (seed weekday hours are 08:00–16:00 Europe/Amsterdam; weekends may empty the list — that is allowed). Unfiltered names that fail the open-now gate must disappear.
- **Met brags.** Run `… http GET '/nl/haarlem?brags=1' --out artifacts/city-board/brags.html`. `Met brags` is `aria-pressed="true"`. Every remaining card that you can inspect should be an egg card; seed-only names with no makers must be gone.
- **List chrome.** Unfiltered page: group labelled `Weergave` / `Filters:`, `Lijst` is `aria-current="true"`, `Kaart` links `?view=map`. Sort group with button `Naam`.
- **Map.** Browser required. Run `… browser goto '/nl/haarlem?view=map'` and screenshot `artifacts/city-board/map.png`. After hydrate, `.leaflet-container` exists and a marker popup can open a `/nl/haarlem/{slug}` link. SSR HTML alone is not proof of the map.
- **Proof.** Keep `haarlem.html` (listed names, no gravestone, egg on a bragged card) plus `brags.html`. Screenshot the map only if you drove `city-map`.

## Gotchas

- Hygiene ingest can add real Haarlem Places beyond the seed. Extra listed cards are OK; missing **all** seed names is not.
- Rank `#1` is on the spot page, not the city card. The city signal is the egg SVG.
- `Afstand` asks the browser for geolocation; denial shows `Locatie niet beschikbaar…` and stays on name sort. Do not treat denial as a product bug.
- `Open nu` depends on the clock in `Europe/Amsterdam`. An empty list on Sunday morning for weekday-only hours is consistent with seed data.
- Type chips (Café/Bakker/Hotel) are v2 and must not appear. If they do, that is a product regression, not a map miss.

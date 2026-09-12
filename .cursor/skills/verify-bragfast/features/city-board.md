# City board

A woonplaats page lists visitor-added breakfast spots. In PR-3 every board is empty. Empty copy is the proof, not Anne&Max.

## Sub-features

- `city-empty` shows Haarlem with `noSpotsYet` and no catalog tents.
- `city-add` mounts `AddSpot` only when `page.spots.length === 0`. Signed-out click fires `requestSignIn`. `open=1` emptying a non-empty list is not an add prompt.
- `city-filter-open` keeps `Open nu` via `?open=1`.
- `city-map` toggles `Kaart` via `?view=map`. An empty board shows the empty copy instead of markers.
- `city-sort` is hidden while the list is empty.

## How to get to it (user POV)

- Open `/nl/haarlem` (search exact city, featured card, or type the URL).
- Aliases redirect to the canonical slug (`/nl/{alias}` → `/nl/{canonical}`).
- Filter chips and Lijst/Kaart are links on the city page.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at the launched origin (`BRAGFAST_VERIFY_PORT`, default 3019).
- Catalog read path returns `spots: []`. Production Convex may still hold scraped Haarlem rows.

- **Open Haarlem.** Run `… http GET /nl/haarlem --out artifacts/city-board/haarlem.html`. Status `200`, h1 `Haarlem`. HTML includes `Nog geen plekken in deze stad.` and does not include `Anne&Max` / `Anne&amp;Max`.
- **Add CTA.** Same file includes `Plek toevoegen` when the board has zero spots. `?open=1` on a non-empty board must not mount `#add-spot`.
- **No catalog tents.** Same file has no `STACH Haarlem`, `Jopenkerk`, `Bakkerij Honing`, `Koffielokaal Spaarne`, or `De Oude Banketbakker`.
- **Open nu.** Run `… http GET '/nl/haarlem?open=1' --out artifacts/city-board/open-now.html`. The `Open nu` link has `aria-pressed="true"`. Empty copy remains. There is no `Met brags` chip.
- **List chrome.** Unfiltered page: group labelled `Weergave` / `Filters:`, `Lijst` is `aria-current="true"`, `Kaart` links `?view=map`.
- **Map.** Run `… http GET '/nl/haarlem?view=map' --out artifacts/city-board/map.html`. Empty copy is visible. Do not require `.leaflet-container` on an empty board.
- **Proof.** Keep `haarlem.html` with the empty copy and without Anne&Max.

## Gotchas

- Trunk Haarlem still lists catalog tents. Head Haarlem must not.
- Type chips (Café/Bakker/Hotel) are v2 and must not appear.
- `Afstand` is not shown on an empty list.

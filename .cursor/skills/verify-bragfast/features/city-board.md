# City board

A woonplaats page lists visitor-added breakfast spots. Empty copy is the proof on Haarlem when the board has zero spots.

## Sub-features

- `city-empty` shows Haarlem with `noSpotsYet` and no catalog tents.
- `city-add` mounts `AddSpot` only when `page.spots.length === 0`. Signed-out click fires `requestSignIn`.
- `city-header-berry` is a berry slab with the city name and no photograph.
- `city-map` toggles `Kaart` via `?view=map` when the board has spots. An empty board shows the empty copy instead of markers or sort selects.
- `city-sort` is two shadcn Selects (Likes/Naam, Aflopend/Oplopend) when spots exist. Hidden while the list is empty. No Open nu. No Afstand.

## How to get to it (user POV)

- Open `/nl/haarlem` (combobox pick, featured card, or type the URL).
- Aliases redirect to the canonical slug (`/nl/{alias}` → `/nl/{canonical}`).
- On a non-empty board, sort selects sit to the left of Lijst/Kaart.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at the launched origin (`BRAGFAST_VERIFY_PORT`, default 3019).

- **Open Haarlem.** Run `… http GET /nl/haarlem --out artifacts/city-board/haarlem.html`. Status `200`, h1 `Haarlem`. HTML includes `Nog geen plekken in deze stad.` and does not include `Anne&Max` / `Anne&amp;Max`. Header uses `bg-berry` (class on the hero section). No `PhotoFrame` city still required in the HTML as an `<img>` of a scene behind the h1.
- **Add CTA.** Same file includes `Plek toevoegen` when the board has zero spots.
- **No catalog tents.** Same file has no `STACH Haarlem`, `Jopenkerk`, `Bakkerij Honing`, `Koffielokaal Spaarne`, or `De Oude Banketbakker`.
- **No Open nu.** Haarlem HTML does not contain `Open nu`. `?open=1` is not a filter.
- **Empty has no sort.** Haarlem HTML has no `Aflopend` / `Oplopend` selects.
- **Map on empty.** Run `… http GET '/nl/haarlem?view=map' --out artifacts/city-board/map.html`. Empty copy is visible. Do not require `.leaflet-container` on an empty board.
- **Proof.** Keep `haarlem.html` with the empty copy and without Anne&Max.

## Gotchas

- Type chips (Café/Bakker/Hotel) are v2 and must not appear.
- Sort selects only mount when `CitySpots` mounts, which is a non-empty board.

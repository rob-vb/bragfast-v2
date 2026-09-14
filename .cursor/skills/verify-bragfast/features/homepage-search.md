# Homepage search

Search is a woonplaats combobox on `/`. Typing two or more characters opens suggestions from the BAG gazetteer. A pick navigates to `/nl/{city}`. There is no featured-city grid, no GET `/?q=` results list, and no Near me control. Two app rows with Coming soon store controls sit under the hero. Local favorites render only when GeoIP maps to a woonplaats with at least 3 photo spots.

## Sub-features

- `search-idle` shows the Dutch hero and the combobox on `/` with two app rows underneath.
- `search-suggest` (browser) for `haar` opens a listbox of woonplaats names including Haarlem.
- `search-pick` (browser) choosing Haarlem lands on `/nl/haarlem`.
- `search-empty` (browser) for a nonsense needle shows the no-city copy in the popup.
- `search-no-dichtbij` means the homepage HTML does not contain `Dichtbij` or `Near me`.
- `search-no-featured` means the homepage HTML does not contain `Steden om te ontdekken` or `Cities to explore`.
- `search-app-rows` shows `Brag als eerste`, `Laat je ontbijt zien`, and `Coming soon`.
- `search-omit-favorites` on localhost does not show `Favorieten in`.

## How to get to it (user POV)

- Open `/` (header lockup `brag.fast`, or `/nl` which redirects to `/`).
- Type in `#catalog-search`. Pick a suggestion or press Zoek when a row is active.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/` after `doctor`.
- Locale cookie unset or `nl`.

- **Idle home.** Open `/`. Run `node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs http GET / --out artifacts/homepage-search/home.html`. Status `200`. HTML `lang="nl"`, `<title>brag.fast</title>`, h1 `Ontbijt- en brunchplekken, per stad.`, `#catalog-search` with `role="combobox"`, submit `Zoek`, `Brag als eerste`, `Laat je ontbijt zien`, and `Coming soon`. No `Steden om te ontdekken`. No `Dichtbij`. No `Favorieten in`. Header link `aria-label="brag.fast"`.
- **English intro.** POST locale `en`, GET `/`. Intro contains `Search a city` and does not contain `Search a woonplaats`. App rows `Be first to brag` and `Show off your breakfast`. No `Cities to explore`.
- **Suggest Haarlem.** Browser only. Fill `#catalog-search` with `haar`. A listbox option named Haarlem is visible. Do not require a `/?q=` URL.
- **Empty needle.** Browser only. Fill with `zzzxqqt`. Copy `Geen stad met die naam` is visible. No catalog tent names.
- **Proof.** Keep `home.html` with app rows, Coming soon, and without Dichtbij or Steden om te ontdekken.

## Gotchas

- Needles shorter than 2 characters do not open the listbox.
- 127.0.0.1 is not a public GeoIP hit. Favorites stay omitted on the verify instance even if Haarlem later has spots.
- Browser `networkidle` never settles (Convex websocket). The helper waits for `load`.
- GET `/?q=haarlem` is no longer a redirect. Do not assert a 307.

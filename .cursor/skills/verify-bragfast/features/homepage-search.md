# Homepage search

Search is a woonplaats combobox on `/`. Typing two or more characters opens suggestions from the BAG gazetteer. A pick navigates to `/nl/{city}`. Featured cities stay on the page. There is no GET `/?q=` results list and no Near me control.

## Sub-features

- `search-idle` shows the Dutch hero and the combobox on `/` with featured city cards underneath.
- `search-suggest` (browser) for `haar` opens a listbox of woonplaats names including Haarlem.
- `search-pick` (browser) choosing Haarlem lands on `/nl/haarlem`.
- `search-empty` (browser) for a nonsense needle shows the no-city copy in the popup.
- `search-no-dichtbij` means the homepage HTML does not contain `Dichtbij` or `Near me`.

## How to get to it (user POV)

- Open `/` (header lockup `brag.fast`, or `/nl` which redirects to `/`).
- Type in `#catalog-search`. Pick a suggestion or press Zoek when a row is active.
- Choose a featured city card (`Steden om te ontdekken`).

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/` after `doctor`.
- Locale cookie unset or `nl`.

- **Idle home.** Open `/`. Run `node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs http GET / --out artifacts/homepage-search/home.html`. Status `200`. HTML `lang="nl"`, `<title>brag.fast</title>`, h1 `Ontbijt- en brunchplekken, per stad.`, `#catalog-search` with `role="combobox"`, submit `Zoek`, heading `Steden om te ontdekken`, and at least one `href="/nl/` city card. No `Dichtbij`. Header link `aria-label="brag.fast"`.
- **English intro.** POST locale `en`, GET `/`. Intro contains `Search a city` and does not contain `Search a woonplaats`.
- **Suggest Haarlem.** Browser only. Fill `#catalog-search` with `haar`. A listbox option named Haarlem is visible. Do not require a `/?q=` URL.
- **Empty needle.** Browser only. Fill with `zzzxqqt`. Copy `Geen stad met die naam` is visible. No catalog tent names.
- **Proof.** Keep `home.html` with featured cities and without Dichtbij.

## Gotchas

- Needles shorter than 2 characters do not open the listbox.
- Featured cities prefer boards that already have spots; always include major NL woonplaatsen. Require the section heading and at least one `/nl/{city}` card.
- Browser `networkidle` never settles (Convex websocket). The helper waits for `load`.
- GET `/?q=haarlem` is no longer a redirect. Do not assert a 307.

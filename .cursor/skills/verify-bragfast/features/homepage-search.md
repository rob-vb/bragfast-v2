# Homepage search

Search lets a seeker type a city or a tent name on `/`, land on results or the city board, and recover when nothing matches. Featured cities sit on the same page when the box is idle.

## Sub-features

- `search-idle` shows the Dutch hero and a search form on `/` with featured city cards underneath.
- `search-spot` for a non-city needle (`anne`) lists catalog hits including Anne&Max Haarlem.
- `search-exact-city` for `haarlem` redirects to `/nl/haarlem` instead of a result list.
- `search-empty` for a nonsense needle shows the no-results copy and does not invent spots.
- `search-clear` from results returns to `/` and the featured section.
- `search-hint` (browser) shows the 2-character hint after typing a single letter.

## How to get to it (user POV)

- Open `/` (header lockup `brag.fast`, or `/nl` which redirects to `/`).
- Submit the search form (`Zoek`) or GET `/?q=…` (the form `GET`s `/`).
- Choose `Wis zoek` on a result page.
- Choose a featured city card (`Steden om te ontdekken`).

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/` after `doctor`.
- Shared Convex still has Haarlem catalog spots (at least Anne&Max).
- Locale cookie unset or `nl`.

- **Idle home.** Open `/`. Run `node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs http GET / --out artifacts/homepage-search/home.html`. Status `200`. HTML `lang="nl"`, `<title>brag.fast</title>`, h1 `Ontbijt- en brunchplekken, per stad.`, `role="search"` / `Zoek een stad of plek`, `#catalog-search`, submit `Zoek`, heading `Steden om te ontdekken`, and at least one `href="/nl/` city card. Header link `aria-label="brag.fast"`.
- **Spot query.** Search `anne`. Run `… http GET '/?q=anne' --out artifacts/homepage-search/search-anne.html`. Status `200` on `/?q=anne` (no city redirect). Heading `Zoekresultaten`, link `href="/nl/haarlem/anne-max"`, visible name `Anne&amp;Max Haarlem` or `Anne&Max Haarlem`, and `Wis zoek` linking `/`.
- **Exact city.** Search `haarlem` without following. Run `… http GET '/?q=haarlem' --no-follow`. Status `307`/`308` and `location` `/nl/haarlem`. Then `… http GET '/?q=haarlem' --out artifacts/homepage-search/search-haarlem.html` and confirm the Haarlem city h1, not `Zoekresultaten`.
- **Empty query.** Search a missing name. Run `… http GET '/?q=zzzxqqt' --out artifacts/homepage-search/search-empty.html`. Status `200`, copy `Geen stad of plek met die naam. Probeer Haarlem of Amsterdam.`, no `href="/nl/haarlem/anne-max"`.
- **Clear.** From results, follow `Wis zoek`. Run `… http GET / --out artifacts/homepage-search/cleared.html`. Featured heading is back; `Zoekresultaten` is gone.
- **One-character hint.** Browser only. Run `… browser fill --selector '#catalog-search' --value a --path artifacts/homepage-search/hint.png` (no `--submit`). The page shows `Typ minstens 2 tekens.` and does not navigate.
- **Proof.** Keep `home.html` plus either `search-anne.html` or a screenshot of the Anne&Max hit. The artifacts must show brag.fast and the query or featured cities, not a blank compile error.

## Gotchas

- Exact gemeente names (`haarlem`, `amsterdam`, aliases like `den bosch`) redirect. Use a tent fragment (`anne`) when you need a result list.
- Needles shorter than 2 characters do not search; the hint is client-only and will not appear in `http GET '/?q=a'`.
- Featured cities are Convex-backed and prefer cities that already have makers. Do not require a fixed set of four names; require the section heading and at least one `/nl/{city}` card.
- Near-me (`Dichtbij`) is on this page but needs geolocation; it is not this feature. Do not fail homepage search if nearby is empty.
- Following redirects on `/?q=haarlem` hides the 307. Use `--no-follow` to prove the redirect itself.
- Browser `networkidle` never settles (Convex websocket). The helper waits for `load`.

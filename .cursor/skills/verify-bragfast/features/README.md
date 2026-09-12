# brag.fast verification map

This directory is the maintained source for verifying seeker-facing behavior of brag.fast. Read this index before driving, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs launch` so the app is at `http://127.0.0.1:3019/`.
- Run `… doctor` and require pid, `http://127.0.0.1:3019/`, and HTML that identifies brag.fast.
- `.env.local` points at the shared Convex catalog. Treat every drive as **read-only** unless a feature file says otherwise.
- Never drive `http://77.42.31.66/` or `127.0.0.1:3002`.
- Default UI language is Dutch (`html lang="nl"`) unless you POST `/api/locale`.
- Seeded Haarlem fixtures must **not** appear. Empty `noSpotsYet` copy is the proof.

## Driving conventions

- Start every recipe from the launched instance after doctor, unless the feature lists extra state.
- Prefer HTTP GET of the user URL. Use ARIA roles and `#catalog-search` when the browser helper is required.
- Treat helper commands as literal. Keep quoted paths and flags unchanged.
- Restore nothing in Convex (we should not have written). Do not delete proof artifacts during cleanup.

## Proof and skip reporting

- Capture the request (path, status, Location) and the resulting HTML/screenshot, not only the last screen.
- UI proof for SSR: saved HTML with the heading, links, and copy named in the recipe. Browser proof: ARIA snapshot and/or screenshot that shows brag.fast plus the feature under test.
- Mutation proof is out of default scope. Do not send magic links or upload brags against shared Convex.
- Record the feature ID and entry point on the artifact path (`artifacts/<feature>/…`).
- An unreachable path is reported with the attempted command and the unmet precondition (example: no Chrome for Leaflet). Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph of user-visible behavior, then exactly four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it with control-bragfast`, `Gotchas`.

## Features

- [Homepage search](./homepage-search.md) covers the hero search box, exact-city redirect, spot hits, empty results, and featured cities.
- [City board](./city-board.md) covers empty woonplaats boards, Open nu, list vs map.
- [Spot page](./spot-page.md) covers old catalog URLs 404ing.
- [Language switch](./language-switch.md) covers nl/en chrome on the same URLs via the cookie.
- [Passport](./passport.md) covers the public `/nl/u/{slug}` profile of spots that account added.
- Leaderboard `/nl/leaderboard` lists adders by the sum of likes on spots they added. Empty copy shows when nobody has added. The header links here. Signed-out visitors can read it. Ranked rows are verified-unreachable on an empty shared catalog.

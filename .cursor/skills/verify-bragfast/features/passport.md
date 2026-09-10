# Passport

A public passport is the maker's page of unique spots they have bragged. It appears at `/nl/u/{slug}` after the first brag. Seed makers `maker-a` and `maker-b` exist when the board demo seed has been applied.

## Sub-features

- `passport-profile` shows display name, unique-spot count, and posts-this-week count.
- `passport-spots` lists unique tents (default tab), each linking a spot URL, egg on the card.
- `passport-week` tab `?tab=week` lists posts from this week or `Deze week nog geen brags.`
- `passport-map` `?view=map` is Leaflet of those spots (browser).
- `passport-missing` unknown slugs 404. Zero-brag profiles are noindex when they exist.

## How to get to it (user POV)

- Signed-in header `Paspoort` after the account has a slug (do not sign in during default verification).
- Open `/nl/u/maker-a` directly (seed).
- Tabs `Unieke plekken` and `Deze week`; view `Lijst` / `Kaart` on the spots tab.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/`.
- Seed passport `/nl/u/maker-a` still 200. If it 404s, report `verified-unreachable` (seed not present); do not mint a user on shared Convex.

- **Open seed passport.** Run `… http GET /nl/u/maker-a --out artifacts/passport/maker-a.html`. Status `200`, h1 contains `Maker A`, copy `1 unieke plek` (or `N unieke plekken` if they bragged more), and a card linking `/nl/haarlem/anne-max` with Anne&Max in the title. HTML must not contain `noindex` for this bragged profile.
- **Week tab.** Run `… http GET '/nl/u/maker-a?tab=week' --out artifacts/passport/maker-a-week.html`. Status `200`. Either Anne&Max appears as a this-week post or the empty copy `Deze week nog geen brags.` — both are valid depending on post timestamps vs a 7-day window. `Deze week` is `aria-current="true"`.
- **Map.** Browser only, same as city map: `… browser screenshot --goto '/nl/u/maker-a?view=map' --path artifacts/passport/map.png` and require `.leaflet-container` if you claim `passport-map`.
- **Missing slug.** Run `… http GET /nl/u/no-such-bragger`. Status `404`.
- **Proof.** Keep `maker-a.html` showing the name and at least one unique spot link. That is the public seeker view, not an auth-only screen.

## Gotchas

- Passport slugs come from the display name (`Maker A` → `maker-a`). If seed was rebuilt with a suffix (`maker-a-2`), the old URL 404s — try sitemap `GET /sitemap.xml` for `/nl/u/` entries before declaring the feature broken.
- Profiles with zero brags are noindex. `maker-a` should have brags; do not use a zero-brag slug as the happy path.
- Do not click `Paspoort` in the header during a signed-out run; it is hidden until there is a session. Direct URL is the seeker entry.
- Instagram connect chrome on the header is signed-in only and stays dark without Meta credentials. It is not this feature.

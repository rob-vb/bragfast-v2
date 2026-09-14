# Passport

A public passport is the adder's page of spots they added. It appears at `/nl/u/{slug}`. The header shows the username (`UserSlug`) and the spots count. No email, no avatar, no photograph.

## Sub-features

- `passport-profile` shows `page.slug` as the h1 and `uniqueSpotsLabel`.
- `passport-spots` lists added tents, each linking a spot URL, no egg overlay on the card.
- `passport-map` `?view=map` is Leaflet of those spots (browser).
- `passport-missing` unknown slugs 404. Zero-add profiles are noindex when they exist.

## How to get to it (user POV)

- Signed-in header `Paspoort` after the account has a slug (do not sign in during default verification).
- Open `/nl/u/{slug}` directly.
- View `Lijst` / `Kaart`.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/`.
- If a known slug 404s, report `verified-unreachable` (seed not present); do not mint a user on shared Convex.

- **Header chrome.** On any 200 passport HTML: h1 is the slug (not an email), no `avatarUrl` `<img>` in the header, section uses `bg-berry`, spots count copy is present (`plek` / `spot`). Cards do not include `/brag_fast_egg.svg` except the site favicon in `<head>` if present.
- **Missing slug.** Run `… http GET /nl/u/no-such-bragger`. Status `404`.
- **Proof.** Keep the HTML of a 200 passport if one exists, plus the 404 for a missing slug.

## Gotchas

- Profiles with zero adds are noindex. Do not use a zero-add slug as the indexed happy path.
- Do not click `Paspoort` in the header during a signed-out run; it is hidden until there is a session. Direct URL is the seeker entry.

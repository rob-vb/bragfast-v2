# Passport

A public passport is the page of every photo an account posted. It appears at `/u/{slug}` (no country prefix; `/nl/u/{slug}` redirects 308). The header shows the username (`UserSlug`), the photo count and the discovered count. No email, no avatar, no photograph.

## Sub-features

- `passport-profile` shows `page.slug` as the h1 and `photoCountLabel`.
- `passport-photos` lists every photo newest first, each linking its spot URL. The photo that created the spot has an `Ontdekt` / `Discovered` sticker.
- `passport-map` `?view=map` is Leaflet of the photographed spots, one pin each (browser).
- `passport-missing` unknown slugs 404. Zero-photo profiles are noindex when they exist.
- `passport-redirect` `/nl/u/{slug}` answers 308 to `/u/{slug}`, query kept.

## How to get to it (user POV)

- Signed-in header `Paspoort` after the account has a slug (do not sign in during default verification).
- Open `/u/{slug}` directly.
- View `Lijst` / `Kaart`.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/`.
- If a known slug 404s, report `verified-unreachable` (seed not present); do not mint a user on shared Convex.

- **Header chrome.** On any 200 passport HTML: h1 is the slug (not an email), no `avatarUrl` `<img>` in the header, section uses `bg-berry`, photo count copy is present (`foto` / `photo`). Cards do not include `/brag_fast_egg.svg` except the site favicon in `<head>` if present.
- **Missing slug.** Run `… http GET /u/no-such-bragger`. Status `404`.
- **Old URL.** Run `… http GET /nl/u/{slug}`. Status `308`, `Location` `/u/{slug}`.
- **Proof.** Keep the HTML of a 200 passport if one exists, plus the 404 for a missing slug.

## Gotchas

- Profiles with zero photos are noindex. Do not use a zero-photo slug as the indexed happy path.
- Do not click `Paspoort` in the header during a signed-out run; it is hidden until there is a session. Direct URL is the seeker entry.

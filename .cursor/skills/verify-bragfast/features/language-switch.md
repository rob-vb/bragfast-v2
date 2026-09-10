# Language switch

UI language is Dutch or English on the **same** URLs. `/nl/` is the country prefix, not a locale. Choosing `en` sets cookie `lang=en` and re-renders chrome; UGC names stay as stored.

## Sub-features

- `locale-default` serves Dutch with `html lang="nl"` when no cookie and Accept-Language is not English-first.
- `locale-en` POST `/api/locale` `{ "locale": "en" }` then GET `/` shows English hero and search chrome.
- `locale-nl` switches back; hero returns to Dutch.
- `locale-same-url` city and spot paths do not gain an `/en/` prefix.

## How to get to it (user POV)

- Header group `Taal` / `Language`: buttons `nl` and `en` (`aria-pressed` on the active one).
- Stays on the current path; only the cookie changes.

## Driving it with control-bragfast

Preconditions:

- Instance healthy at `http://127.0.0.1:3019/`.
- Cookie jar empty at start (launch / cleanup resets `/tmp/bragfast-verify/cookies.json`).

- **Default Dutch.** Run `… http GET / --out artifacts/language-switch/nl-home.html`. `html lang="nl"`, h1 `Ontbijt- en brunchplekken, per stad.`, search submit `Zoek`, sign-in `Inloggen`, language buttons include `nl` with `aria-pressed="true"`.
- **Switch to English.** Run `… http POST /api/locale --json '{"locale":"en"}'` then `… http GET / --out artifacts/language-switch/en-home.html`. POST status `204`. GET `html lang="en"`, h1 `Breakfast and brunch spots, by city.`, submit `Search`, sign-in `Sign in`, `featuredCities` heading `Cities to explore`.
- **Same city URL.** With `lang=en` still in the jar, run `… http GET /nl/haarlem --out artifacts/language-switch/en-haarlem.html`. Path remains `/nl/haarlem`. Filters read `Open now` and `With brags`. `Lijst` becomes `List`, `Kaart` becomes `Map`. No `/en/haarlem`.
- **Switch back.** Run `… http POST /api/locale --json '{"locale":"nl"}'` then `… http GET /nl/haarlem --out artifacts/language-switch/nl-haarlem.html`. Hero/filters Dutch again. Spot names such as `Anne&Max Haarlem` are unchanged.
- **Proof.** Pair `nl-home.html` and `en-home.html` from the same instance. Both are `/`. The difference is chrome copy and `html lang`.

## Gotchas

- Helper cookie jar is per verification run, not the owner's browser. Doctor GET uses that jar; an `en` cookie left over will make later Dutch recipes fail. Reset with `POST` `{ "locale": "nl" }` or `cleanup` then `launch`.
- `Accept-Language` only applies when the `lang` cookie is absent. After a POST, the cookie wins.
- Invalid POST body returns `400`. Do not send `fr`.
- UGC and tent names are not machine-translated. Do not fail English mode because `Anne&Max Haarlem` is still Dutch/English mixed branding.

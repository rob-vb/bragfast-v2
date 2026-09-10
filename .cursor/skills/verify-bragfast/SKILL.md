---
name: verify-bragfast
description: Drive the brag.fast Next.js website (NL breakfast directory — homepage search, city board, spot pages, language switch, public passport) on a dedicated 127.0.0.1 instance and capture proof. Use when verifying user-facing behavior, reproducing a UI bug, or checking that a change still works the way a seeker would see it.
---

# Verify brag.fast

brag.fast is a **website**. Seekers browse signed-out: search a city or spot, open a city board, open a spot page. Makers sign in to brag. One owner uses `/admin`. There is no CLI product and no native app.

This skill is for the next agent, mid-task, who has never seen the app. Read `features/README.md` before driving. Drive one mapped feature at a time from that map.

## Isolate first

The owner-facing preview is **http://77.42.31.66/** (nginx → `127.0.0.1:3002` → henk's pm2 `bragfast` = `next start`). Cursor `next dev` on 3010 is a different process. **Never drive either of those.** Never `pm2 restart`, never kill by process name `next` / `bragfast`.

Launch a dedicated `next dev` on **127.0.0.1:3019** (override with `BRAGFAST_VERIFY_PORT`). Two Next processes can share the machine on different ports.

Catalog, brags, passports, and auth live in **one shared Convex** (`NEXT_PUBLIC_CONVEX_URL` in `.env.local`). Parallel Next instances read and write the same data. **Default verification is read-only:** GET public pages and the locale cookie. Do not upload a brag, send a magic link, connect Instagram, add a spot, or use `/admin` mutations. Those write production Convex. If a feature cannot be proved without a mutation, mark it `verified-unreachable` with that reason — do not mutate to make it pass.

## Launch

Repo root is the directory whose `package.json` `"name"` is `bragfast-v2`. `.env.local` must exist (Convex URL). `npm install` already done is enough; do not run `next build` for verification — `next dev` serves the current source.

```bash
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs launch
```

That spawns `node node_modules/next/dist/bin/next dev --port 3019 --hostname 127.0.0.1`, writes pid/url to `/tmp/bragfast-verify/run.json`, and waits until `GET http://127.0.0.1:3019/` returns HTML containing `brag.fast` (first compile can take a minute). Ready = that GET, not a log line alone. Log: `/tmp/bragfast-verify/next.log`.

Teardown:

```bash
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs cleanup
```

Cleanup kills **only** the pid in `run.json` (process group). It must not touch pm2, :3002, or evidence under `.cursor/skills/verify-bragfast/artifacts/`.

## Doctor

Run this first, and again whenever a drive looks off:

```bash
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs doctor
```

Pass means: pid in `run.json` is alive, it owns :3019 (or a child does), `GET /` is 200, the HTML identifies **brag.fast**, and the URL is `http://127.0.0.1:3019/` — not `77.42.31.66` and not :3002. Fail means stop driving; cleanup if you started the instance, then relaunch.

## Drive

Primary harness is **HTTP against the launched origin**. Public pages are server-rendered. City filters, list/map, passport tabs, and search submit are URLs. Language is `POST /api/locale` then a cookie. Use the helper so requests cannot silently hit the owner preview.

```bash
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs http GET / --out artifacts/home/home.html
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs http GET '/?q=anne' --out artifacts/home/search-anne.html
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs http GET '/?q=haarlem' --no-follow
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs http POST /api/locale --json '{"locale":"en"}'
```

Relative `--out` paths that start with `artifacts/` land in this skill directory.

Stable handles from this repo (Dutch default UI; English after locale POST):

| Control | Handle |
| --- | --- |
| Header home | link `aria-label="brag.fast"` → `/` |
| Search form | `role="search"` named `Zoek een stad of plek` / `Search a city or spot`; input `#catalog-search` `name="q"`; submit `Zoek` / `Search` |
| Language | `role="group"` named `Taal` / `Language`; buttons `nl` and `en` with `aria-pressed` |
| Sign in | button `Inloggen` / `Sign in` → dialog title `Log in bij brag.fast` / `Sign in to brag.fast`; email `#email`; do **not** submit |
| City filters | `Open nu`, `Met brags` as links with `aria-pressed`; query `open=1`, `brags=1` |
| City view | group `Weergave` / `View`; links `Lijst` / `List` and `Kaart` / `Map`; `view=map` |
| City sort | buttons `Naam` / `Name` and `Afstand` / `Distance` (`aria-current`) |
| Spot share | button `Deel` / `Share` |
| Login-to-brag | button `Log in om te braggen` / `Log in to brag` (signed-out spot page) |
| Passport tabs | `Unieke plekken` / `Unique spots` vs `Deze week` / `This week` (`tab=week`) |

Client-only paths (search hint at 1 character, near-me geolocation, sign-in dialog, Leaflet map tiles, share clipboard) need the browser helper. Chrome lives at `$CHROME_PATH` or `/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`; playwright-core at `/tmp/pw-repro/node_modules/playwright-core` when present. Wait for `load`, not `networkidle` — Convex's websocket keeps the document "busy".

```bash
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs browser snapshot --goto / --path artifacts/home/home.aria.txt
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs browser screenshot --goto / --path artifacts/home/home.png
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs browser fill --selector '#catalog-search' --value anne --submit --path artifacts/home/search-anne.png
```

Map view is not in the SSR HTML (Leaflet is `ssr: false`). Proving `Kaart` requires the browser: wait for `.leaflet-container` and a popup link to a spot. Proving `Lijst` is HTTP.

`scripts/verify-*.sh` and `scripts/verify-ui-controls.mjs` in the repo default to `http://77.42.31.66/` and some assert a retired "Nog niet gebragd" city-list split. Do not use them as this skill's driver.

## Evidence

Put proof in `.cursor/skills/verify-bragfast/artifacts/<feature>/`. Cleanup must leave that tree in place.

Standards:

- Exercise the real seeker URL, not Convex queries or internal seed mutations.
- Capture the action **and** the resulting page (status + HTML or screenshot/ARIA), not only the final pretty frame.
- Side effects: locale cookie (`lang=en`/`nl`); search exact-city **307** to `/nl/{city}`; sitemap includes listed spots; JSON-LD on the spot page. File uploads, emails, and Convex writes are out of default scope — if you did not perform them, do not claim them.
- Haarlem seed names are **must-include** (`Anne&Max Haarlem`, `STACH Haarlem`, `Jopenkerk`, `Bakkerij Honing`, `Koffielokaal Spaarne`). Live Places ingest may add more listed spots; extra cards are allowed. `De Oude Banketbakker` is a gravestone: on its URL, never on the city list.
- Rank numbers live on the **spot** page (`#N` or `Nog niet op de board`). The city list marks bragged spots with `/brag_fast_egg.svg`, not a rank numeral. Do not fail a city page for missing `01`.

## Cleanup

```bash
node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs cleanup
```

Removes the instance (pid in `run.json`) and `/tmp/bragfast-verify` cookies/state. Does **not** delete `artifacts/`. After cleanup, confirm the proof files you wrote are still on disk.

If a drive fails, run cleanup before the next launch so :3019 is not stranded.

## Helpers

`scripts/control-bragfast.mjs` is the only helper. Invoke it with `node` from any cwd; it finds the repo by walking up to `package.json` name `bragfast-v2`.

| Command | What it does |
| --- | --- |
| `launch` | Start dedicated `next dev` on 127.0.0.1:3019 and wait until GET `/` is brag.fast |
| `doctor` | Confirm that instance is the one worth driving |
| `http GET/POST …` | Fetch from the launched origin only; optional `--out`, `--no-follow`, `--json` |
| `browser …` | Playwright against that origin (goto/click/fill/screenshot/snapshot) |
| `cleanup` | SIGTERM the launched pid group; keep artifacts |

`control-bragfast` with no args prints the same usage.

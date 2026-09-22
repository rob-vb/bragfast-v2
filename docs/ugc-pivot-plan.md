# Pivot brag.fast to visitor-added spots

brag.fast stops scraping a Places catalog. Visitors add breakfast and brunch spots themselves. Seekers still browse by Dutch woonplaats. CBS counts 2501 BAG woonplaatsen on 1 January 2024. Rank is like count. Adders climb a leaderboard by likes on spots they added. Instagram and the nightly crawl go. Current catalog rows go after the operator approves the wipe. The stack is PR-1 through PR-7. The operator lands it.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `pstack/skills/poteto-mode/playbooks/autopilot-stack.md`. The operator merges PR-1 through PR-7. Owners stop at merge-ready.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on her explicit go.
- [ ] On her go, arm a `/goal` with this exact text. "`docs/ugc-pivot-plan.md`, PR-1 through PR-7 in that order, a PR is verified only when its unit, live, and perf boxes are all checked, the operator merges, done when a signed-in visitor can add a Place, upload one photo, like another visitor's spot, and appear on `/nl/leaderboard`, and a signed-out like opens the sign-in dialog."
- [ ] Read these from trunk at program start. Re-read them at every tick.
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `git show origin/main:pstack/skills/swarm/SKILL.md`
  - [ ] `git show origin/main:.cursor/skills/verify-bragfast/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `git show origin/main:pstack/skills/how/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/unslop/SKILL.md`
  - [ ] `git show origin/main:SPEC.md`
- [ ] If `git show origin/main:pstack/...` fails, read the same files from the Cursor pstack plugin cache and record that fallback in the tick status message.
- [ ] Arm the 30-minute audit tick. In a local session, a real terminal `/loop`. In a cloud root, a cloud-sleeper wake chain. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk and the armed /goal. Audit the operation against both and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then send the operator a status message, whether or not anything changed, with the queue table of PR, owner, state, and head SHA, the verdicts since the last tick, what merged, open operator gates, and blockers."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.
- [ ] Do not run the Convex wipe in PR-3 until the operator says go on data deletion.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges, or base it on the parent branch when the execution playbook stacks.
  - [ ] PR-1 branches from `main` and is first.
  - [ ] PR-2 after PR-1.
  - [ ] PR-3 after PR-2.
  - [ ] PR-4 after PR-3.
  - [ ] PR-5 after PR-4.
  - [ ] PR-6 after PR-5.
  - [ ] PR-7 after PR-6.
- [ ] Hold the file boundaries. PR-1 touches only `SPEC.md`, `PRODUCT.md`, and `AGENTS.md`. PR-2 touches gazetteer, search, city routes, sitemap, and cron disable. PR-3 deletes ingest, Instagram, votes, posts, and catalog rows. PR-4 touches auth files and `components/auth-control.tsx`. PR-5 touches add-spot, Places add, spot schema, and photo upload. PR-6 touches likes and the like control. PR-7 touches the leaderboard route and ranking copy.
- [ ] Hold the review gate. PR-2, PR-3, PR-4, PR-5, PR-6, and PR-7 change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Default to `gh`; if `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Record any fallback to `gh`. Never require `gt`.
- [ ] Open the PR ready, never draft, with `origin pr create --status open --base <base-branch>` or `gh pr create --base <base-branch>` according to the resolved forge. A stack child targets its parent branch.
- [ ] Run the repo's lint and typecheck once before the PR-facing push. Push with hooks on.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every Bugbot and security-reviewer comment per `../references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before babysit and again before the merge-ready report.

### Verdict and merge, for every PR

- [ ] At the merge-ready head SHA, run the swarm per `pstack/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. One audit lane that reads the diff and the receipts and distrusts the PR body.
- [ ] Clean only when every lane is `PASS`. Findings go back to the owner. A new head gets a fresh swarm and a fresh verdict.
- [ ] The root appends the PR to the base-branch stack. The operator lands it bottom-up. After a rebase, compare `git patch-id` for the base-to-head diff. An unchanged patch-id keeps the code verdict. A changed patch runs the swarm again.

### Boot recipe, for every live lane

Each live lane runs on its own cloud VM at the PR head. Drive through `.cursor/skills/verify-bragfast/SKILL.md`.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] Copy `.env.local` so Convex is the same deployment the VPS uses. Run `node .cursor/skills/verify-bragfast/scripts/control-bragfast.mjs launch`. Wait until `GET http://127.0.0.1:3019/` returns HTML that contains `brag.fast`.
- [ ] Deliver input only through `control-bragfast.mjs http` and `control-bragfast.mjs browser`. The read-only diagnostic is `control-bragfast.mjs doctor`. Do not hit `http://77.42.31.66/`. Do not `pm2 restart`. Do not mutate Convex in PR-1 or PR-2 lanes.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Rewrite the product spec (PR-1)

**Depends on.** None.

**Files.**

- [ ] Edit `SPEC.md`.
- [ ] Edit `PRODUCT.md`.
- [ ] Edit `AGENTS.md`.

**Build.**

- [ ] Replace the catalog-and-brag product with visitor-added spots. Name the board unit `woonplaats`. Name the rank unit like count. Name the person board the adder leaderboard. Drop Instagram, magic link, maker votes, and nightly Places hygiene from v1. Keep Google Place ID as the add helper only. Record that an iOS app later attaches more photos to an existing spot and is not this stack.

**You see.**

- [ ] `SPEC.md` says a signed-out seeker browses empty woonplaats pages, a signed-in visitor adds a Place and one photo, a like requires a session, and `/nl/leaderboard` ranks adders by likes on spots they added.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `domain/domain.test.ts` still passes because this PR is docs. Run `npm run test:domain`.
- [ ] `SPEC.md` contains `woonplaats`, `like`, `leaderboard`, `emailAndPassword`, and does not require Instagram in v1. Run `rg -n "woonplaats|Instagram" SPEC.md`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run `http GET /` at trunk and head. If trunk lacks the feature, record that and gate the homepage still contains `brag.fast`. Save `pr1-home.png`. Pass when both sides return HTML that contains `brag.fast`.
- [ ] Lane 2. Open `/nl/haarlem`. Save `pr1-haarlem.png`. Pass when the city heading is Haarlem.
- [ ] Lane 3. Open a Haarlem spot URL that exists on trunk. Save `pr1-spot.png`. Pass when the spot name is in the HTML.
- [ ] Lane 4. Submit search `q=haarlem`. Save `pr1-search.png`. Pass when the result links to `/nl/haarlem`.
- [ ] Lane 5. Press `nl` then `en` on the language group. Save `pr1-en.png`. Pass when the hero is the English homepage line from `domain/messages.ts`.
- [ ] Lane 6. Open `/privacy`. Save `pr1-privacy.png`. Pass when the page is 200.
- [ ] Lane 7. Open `/sitemap.xml`. Save `pr1-sitemap.png`. Pass when the document lists `/nl/haarlem`.
- [ ] Lane 8. Open `/nl`. Save `pr1-nl.png`. Pass when it matches the homepage chrome.
- [ ] Lane 9. Open a missing city `/nl/this-city-does-not-exist`. Save `pr1-404.png`. Pass when the response is 404.
- [ ] Lane 10. Snapshot `/` aria. Save `pr1-aria.png`. Pass when the search form still uses `#catalog-search`.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. `curl -o /dev/null -s -w '%{time_starttransfer}'` for `GET /` at trunk and head.
- [ ] Probe. Run that curl three times at trunk, then three times at head, interleaved one-for-one.
- [ ] Baseline. Record the trunk median first.
- [ ] Rule. Head median must be at most 1.2 times the trunk median. Fail if head median exceeds 2.0 seconds.

**Review gate.** None. PR-1 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends it to the base-branch stack and the operator lands it bottom-up.

## Seed woonplaats boards (PR-2)

**Depends on.** PR-1.

**Files.**

- [ ] Create `scripts/generate-woonplaatsen.mjs`.
- [ ] Create `domain/data/woonplaatsen.json`.
- [ ] Create `domain/woonplaatsen.ts`.
- [ ] Edit `domain/cities.ts`.
- [ ] Edit `domain/searchMatch.ts`.
- [ ] Edit `domain/ids.ts`.
- [ ] Edit `lib/catalog.ts`.
- [ ] Edit `app/nl/[city]/page.tsx`.
- [ ] Edit `app/sitemap.ts`.
- [ ] Edit `convex/seed.ts`.
- [ ] Edit `convex/crons.ts`.
- [ ] Edit `package.json`.
- [ ] Edit `domain/domain.test.ts`.
- [ ] Delete `scripts/generate-gemeenten.mjs` after callers move, or leave it unused until PR-3 deletes `domain/gemeenten.ts`.

**Build.**

- [ ] Generate 2501 BAG woonplaatsen from CBS table 85877NED plus PDOK woonplaats centroids. Slug well-known names (`den-bosch`, `den-haag`, `hoofddorp`) as the board people type. Point-in-polygon on woonplaats rings assigns a new Place to a board. Upsert Convex `cities` from that JSON. `seed.cities` today deletes slugs missing from `NL_CITIES`, so the new list must be the full 2501 or dorp boards vanish on the next seed. Disable the catalog hygiene, Instagram import, and OSM hours jobs in `convex/crons.ts` so ingest cannot write gemeente slugs onto the new boards.

**You see.**

- [ ] `GET /nl/hoofddorp` is 200 with heading Hoofddorp. `GET /nl/haarlem` is still 200. Search for a dorp name returns that woonplaats. Featured cities remain the big woonplaatsen.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `domain/domain.test.ts` gains canonical slug cases for Hoofddorp, Den Bosch, and a unique dorp. Run `npm run test:domain`.
- [ ] `node scripts/generate-woonplaatsen.mjs` is idempotent. Run it twice and `diff` the JSON.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run `http GET /nl/haarlem` at trunk and head. If trunk lacks woonplaats boards, record that and gate Haarlem still renders. Save `pr2-haarlem.png`. Pass when the heading is Haarlem.
- [ ] Lane 2. Open `/nl/hoofddorp`. Save `pr2-hoofddorp.png`. Pass when the heading is Hoofddorp and the page is 200.
- [ ] Lane 3. Open `/nl/haarlemmermeer`. Save `pr2-haarlemmermeer.png`. Pass when it is either 200 for that woonplaats or a redirect to a canonical woonplaats, never a silent gemeente dump of Hoofddorp spots labeled as the gemeente board.
- [ ] Lane 4. Search `q=hoofddorp`. Save `pr2-search-hoofddorp.png`. Pass when a hit links to `/nl/hoofddorp`.
- [ ] Lane 5. Search `q=giethoorn`. Save `pr2-giethoorn.png`. Pass when a hit links to `/nl/giethoorn`.
- [ ] Lane 6. Open `/nl/giethoorn`. Save `pr2-giethoorn-page.png`. Pass when the empty copy from `noSpotsYet` is visible if that woonplaats has zero spots.
- [ ] Lane 7. Open `/sitemap.xml`. Save `pr2-sitemap.png`. Pass when the document includes `/nl/hoofddorp` and `/nl/giethoorn`.
- [ ] Lane 8. Search `q=den bosch`. Save `pr2-den-bosch.png`. Pass when the canonical link is `/nl/den-bosch`.
- [ ] Lane 9. Open `/`. Save `pr2-featured.png`. Pass when featured cards still include Amsterdam, Rotterdam, and Haarlem.
- [ ] Lane 10. Open `/nl/this-city-does-not-exist`. Save `pr2-404.png`. Pass when the response is 404.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Median `time_starttransfer` for `GET /nl/haarlem`, plus wall time of `searchNeedle` over the full woonplaats list for query `haar`.
- [ ] Probe. Curl the city page three times interleaved trunk then head. Run a `tsx` snippet that searches the generated JSON 1000 times at head. Trunk has no 2501-row list, so also record head search wall time as an absolute budget.
- [ ] Baseline. Record the trunk city-page median first.
- [ ] Rule. City-page head median at most 1.2 times trunk, and never above 2.0 seconds. Head search of 1000 `haar` queries must finish in 50 ms. Fail if `/sitemap.xml` TTFB exceeds 5.0 seconds.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 6 screenshots into `docs/media/pr-2-review-hoofddorp.png` and `docs/media/pr-2-review-giethoorn.png`.
- [ ] Record a 30 to 60 second video of search-to-woonplaats on a lane VM. Save it as `docs/media/pr-2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends it to the base-branch stack and the operator lands it bottom-up.

## Strip catalog crawl and Instagram (PR-3)

**Depends on.** PR-2.

**Files.**

- [ ] Edit `convex/schema.ts`.
- [ ] Edit `convex/seed.ts`.
- [ ] Edit `convex/catalog.ts`.
- [ ] Edit `app/nl/[city]/[spot]/page.tsx`.
- [ ] Edit `app/nl/[city]/page.tsx`.
- [ ] Edit `components/home-view.tsx`.
- [ ] Edit `components/auth-control.tsx`.
- [ ] Edit `components/site-header.tsx`.
- [ ] Edit `app/admin/page.tsx`.
- [ ] Edit `domain/messages.ts`.
- [ ] Edit `app/privacy/page.tsx`.
- [ ] Edit `domain/spot.ts` to own `openNow` before `domain/ranking.ts` goes.
- [ ] Edit `.cursor/skills/verify-bragfast/features/city-board.md`.
- [ ] Edit `.cursor/skills/verify-bragfast/features/spot-page.md`.
- [ ] Delete `convex/ingest.ts`.
- [ ] Delete `convex/osmHours.ts`.
- [ ] Delete `convex/instagram.ts`.
- [ ] Delete `convex/social.ts`.
- [ ] Delete `convex/standing.ts`.
- [ ] Delete `convex/model/hygiene.ts`.
- [ ] Delete `convex/model/instagram.ts`.
- [ ] Delete `convex/model/social.ts`.
- [ ] Delete `convex/model/votes.ts`.
- [ ] Delete `domain/hygiene.ts`.
- [ ] Delete `domain/instagram.ts`.
- [ ] Delete `domain/social.ts`.
- [ ] Delete `domain/vote.ts`.
- [ ] Delete `domain/makerKey.ts`.
- [ ] Delete `domain/post.ts`.
- [ ] Delete `domain/ingestTurn.ts`.
- [ ] Delete `domain/placesQuota.ts`.
- [ ] Delete `domain/catalogVerdict.ts`.
- [ ] Delete `domain/osmHours.ts`.
- [ ] Delete `domain/osmHours.test.ts`.
- [ ] Delete `domain/ranking.ts` after `openNow` moves.
- [ ] Delete `scripts/fill-osm-hours.ts`.
- [ ] Delete `scripts/generate-gemeente-population.mjs`.
- [ ] Delete `scripts/verify-social.sh`.
- [ ] Delete `scripts/verify-hygiene.sh`.
- [ ] Delete `components/social-embed.tsx`.
- [ ] Delete `components/spot-brags.tsx`.
- [ ] Delete `domain/data/gemeenten.json` if PR-2 finished the move.
- [ ] Delete `domain/data/gemeente-population.json` if ingest no longer walks gemeenten.

**Build.**

- [ ] Delete maker votes, social posts, Instagram OAuth, AI match queue, spot-add type queue, Places quota, and ingest cursor from the schema. Move `openNow` into `domain/spot.ts` so hours filters keep working. Rewrite `scripts/verify-brag.sh`, `scripts/verify-catalog.sh`, and `scripts/verify-polish.sh` so they no longer require egg rank or `brags=1`. Add a one-shot internal mutation that removes every `spots`, `posts`, `makerVotes`, and Instagram field. Run that mutation only after the operator says go. City pages then render the empty state for every woonplaats.

**You see.**

- [ ] Haarlem lists zero spots and shows `noSpotsYet`. Spot URLs from the old catalog 404. Sign-in has no Instagram connect. Admin has no caption queue.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Remove tests that import deleted modules. Keep woonplaats tests. Run `npm run test:domain`.
- [ ] Run `npm run typecheck` and `npm run lint`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run `http GET /nl/haarlem` at trunk and head. Trunk still has catalog spots. Record that and gate head Haarlem shows `noSpotsYet` with no Anne&Max card. Save `pr3-haarlem-empty.png`. Pass when head HTML contains the empty copy and does not contain `Anne&Max`.
- [ ] Lane 2. Open `/nl/giethoorn`. Save `pr3-giethoorn-empty.png`. Pass when the empty copy is visible and no spot list is rendered.
- [ ] Lane 3. Open `/`. Save `pr3-home.png`. Pass when search still finds Haarlem and the intro no longer describes 90-day makers.
- [ ] Lane 4. Search `q=anne`. Save `pr3-search-anne.png`. Pass when no catalog tent is returned.
- [ ] Lane 5. Open an old Haarlem spot path. Save `pr3-old-spot.png`. Pass when the response is 404.
- [ ] Lane 6. Open the sign-in dialog. Save `pr3-signin.png`. Pass when Instagram connect is absent.
- [ ] Lane 7. Open `/admin` signed out. Save `pr3-admin.png`. Pass when caption-queue copy is absent.
- [ ] Lane 8. Open `/privacy`. Save `pr3-privacy.png`. Pass when Instagram data-deletion callback copy is gone or marked retired.
- [ ] Lane 9. Toggle map on Haarlem. Save `pr3-map.png`. Pass when the empty copy shows instead of markers.
- [ ] Lane 10. Open `/sitemap.xml`. Save `pr3-sitemap.png`. Pass when woonplaats URLs remain and old spot URLs are gone.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Median `time_starttransfer` for `GET /nl/haarlem`.
- [ ] Probe. Three interleaved curls at trunk (full catalog) and head (empty board). Also record head as an absolute empty-page budget.
- [ ] Baseline. Record the trunk median first.
- [ ] Rule. Do not compare the two as a ratio. Head empty Haarlem TTFB must be under 2.0 seconds. Fail above that.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1 and lane 2 screenshots into `docs/media/pr-3-review-haarlem.png` and `docs/media/pr-3-review-giethoorn.png`.
- [ ] Record a 30 to 60 second video of Haarlem empty and search with no old tents. Save it as `docs/media/pr-3-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click. Wait for a separate go before the wipe mutation if the review used a copy of production data.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends it to the base-branch stack and the operator lands it bottom-up.

## Switch sign-in to Google and password (PR-4)

**Depends on.** PR-3.

**Files.**

- [ ] Edit `convex/auth.ts`.
- [ ] Edit `lib/auth-client.ts`.
- [ ] Edit `components/auth-control.tsx`.
- [ ] Edit `domain/messages.ts`.
- [ ] Edit `convex/schema.ts`.
- [ ] Edit `convex/model/users.ts`.
- [ ] Edit `lib/sign-in-signal.ts` only if the event name must stay documented.

**Build.**

- [ ] Keep Google. Add Better Auth `emailAndPassword`. Drop the magic-link plugin. Require a unique public `username` (`UserSlug`) at signup and mint the passport row then. Today `ensurePassport` waits for the first brag. Leaderboard links would 404 until an add. Google first login that lacks a username opens the same dialog on the username field. Password login accepts email or username. Keep `AuthControl` mounted. `requestSignIn` is a no-op if that listener is gone.

**You see.**

- [ ] The dialog titled from `signInTitle` has Google, username, password, and create-account. Magic-link copy is gone. `requestSignIn()` still opens that dialog.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add username parse cases to `domain/domain.test.ts`. Run `npm run test:domain`.
- [ ] Run `npm run typecheck`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open the sign-in dialog at trunk and head. Trunk is magic link. Record that and gate head shows password fields and Google. Save `pr4-dialog.png`. Pass when head has `username` or `password` inputs and no `sendMagicLink` button.
- [ ] Lane 2. Click `Inloggen` in the header. Save `pr4-open.png`. Pass when the dialog title matches `signInTitle`.
- [ ] Lane 3. Dispatch `bragfast:open-signin` from the console. Save `pr4-event.png`. Pass when the same dialog opens.
- [ ] Lane 4. Submit create-account with a short username. Save `pr4-username-invalid.png`. Pass when an error is shown and no session starts.
- [ ] Lane 5. Submit create-account with a valid username, email, and password on a throwaway account if the lane is allowed to write a dedicated Convex. If the shared deployment forbids writes, mark `verified-unreachable` and still Save `pr4-signup-blocked.png`. Pass when either a session exists or the unreachable reason names shared Convex.
- [ ] Lane 6. Click Google with keys missing. Save `pr4-google-missing.png`. Pass when `googleUnavailable` copy shows or the button is disabled.
- [ ] Lane 7. Sign out when a session exists. Save `pr4-signout.png`. Pass when the header shows `Inloggen` again.
- [ ] Lane 8. Open the dialog in English. Save `pr4-en.png`. Pass when the title is `Sign in to brag.fast`.
- [ ] Lane 9. Try login with a wrong password. Save `pr4-bad-password.png`. Pass when an error is shown.
- [ ] Lane 10. Tab through the dialog. Save `pr4-a11y.png`. Pass when the close control and the first field are reachable.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from click `Inloggen` to dialog title visible, plus `GET /` TTFB.
- [ ] Probe. Browser timestamps at trunk and head for the click. Curl `GET /` interleaved.
- [ ] Baseline. Record trunk dialog-open time first.
- [ ] Rule. Head dialog-open at most 1.5 times trunk, and under 500 ms after the click handler. `GET /` TTFB rule is the same 1.2 times trunk cap as PR-1.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1 and lane 2 screenshots into `docs/media/pr-4-review-dialog.png` and `docs/media/pr-4-review-open.png`.
- [ ] Record a 30 to 60 second video of opening the dialog and switching Google versus password. Save it as `docs/media/pr-4-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends it to the base-branch stack and the operator lands it bottom-up.

## Let signed-in visitors add a spot with a photo (PR-5)

**Depends on.** PR-4.

**Files.**

- [ ] Edit `convex/schema.ts`.
- [ ] Edit `convex/places.ts`.
- [ ] Edit `convex/model/placeAdd.ts`.
- [ ] Edit `convex/model/spots.ts`.
- [ ] Edit `domain/placeAdd.ts`.
- [ ] Edit `domain/spot.ts`.
- [ ] Edit `components/add-spot.tsx`.
- [ ] Edit `app/nl/[city]/page.tsx`.
- [ ] Edit `app/nl/[city]/[spot]/page.tsx`.
- [ ] Edit `components/city-spots.tsx`.
- [ ] Edit `domain/messages.ts`.
- [ ] Edit `convex/brags.ts` into a photo helper or replace it with `convex/photos.ts`.
- [ ] Edit `lib/catalog.ts`.
- [ ] Edit `domain/jsonld.ts`.
- [ ] Edit `domain/viewModels.ts`.
- [ ] Edit `.cursor/skills/verify-bragfast/features/city-board.md`.

**Build.**

- [ ] Mount `AddSpot` on the woonplaats page. Autocomplete stays Places. One Place Details call at confirm fills name, address, and geo. Today `applyPlaceAdd` writes the page `citySlug` and skips the polygon. That would pin a Hoofddorp tent to Haarlem. Point-in-polygon sets `placeSlug` from geo. Unique `placeId` makes a second add a redirect to the existing spot. Require one photo via Convex `_storage`. Fast-food types still fail the existing type gate. Live hospitality goes live with `addedBy` set. Show the add CTA only when the woonplaats has zero spots. `noSpotsYet` also fires today when `open=1` empties a non-empty list. That state is not an add prompt.

**You see.**

- [ ] Signed-out Haarlem empty state has a control that fires `requestSignIn`. Signed-in Haarlem shows the add field. Picking a Place and a photo creates `/nl/{woonplaats}/{spot}` with that photo as the card image.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `domain/placeAdd.ts` tests. Duplicate `placeId` plans `redirect`. Fast food plans `reject`. Café plans `live`. Run `npm run test:domain`.
- [ ] Point-in-polygon fixture pins Hoofddorp, not Haarlemmermeer-as-gemeente. Run `npm run test:domain`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open `/nl/haarlem` at trunk and head. Trunk may still show a catalog. Record that and gate head shows the empty state plus add or login CTA. Save `pr5-haarlem.png`. Pass when head has `addSpot` or the login CTA.
- [ ] Lane 2. Signed out, click the add CTA. Save `pr5-signin-from-add.png`. Pass when the PR-4 dialog opens.
- [ ] Lane 3. Signed in, type two letters in `#add-spot`. Save `pr5-autocomplete.png`. Pass when suggestion buttons appear or `placesUnavailable` shows.
- [ ] Lane 4. Signed in with Places configured, pick a café and attach a photo on a dedicated write deployment. Save `pr5-created.png`. Pass when the new spot page shows the name and the photo. If shared Convex forbids writes, mark `verified-unreachable` and still Save `pr5-write-blocked.png`. Pass when the unreachable reason names shared Convex.
- [ ] Lane 5. Add the same `placeId` again. Save `pr5-duplicate.png`. Pass when the app opens the existing spot and does not insert a second row.
- [ ] Lane 6. Open the new spot view-source. Save `pr5-jsonld.png`. Pass when JSON-LD `FoodEstablishment` contains the name.
- [ ] Lane 7. Open Giethoorn signed out. Save `pr5-empty-cta.png`. Pass when empty copy and login-to-add are both visible.
- [ ] Lane 8. City card uses the uploaded photo, not `stillFor` stock. Save `pr5-card-photo.png`. Pass when the card `img` src is a Convex storage URL after a successful add.
- [ ] Lane 9. Fast-food suggestion if one appears. Save `pr5-fastfood.png`. Pass when add fails with a typed error, not a live row.
- [ ] Lane 10. Map toggle after one live spot exists. Save `pr5-map.png`. Pass when one marker exists, or empty copy if the write lane was unreachable.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Autocomplete round-trip from 2 characters to suggestion list, plus `GET /nl/haarlem` TTFB.
- [ ] Probe. Browser timestamps for the debounce plus fetch at head. Curl the city page at trunk and head interleaved. Trunk has no add field, so autocomplete is head-only with an absolute budget.
- [ ] Baseline. Record trunk city-page TTFB first.
- [ ] Rule. City-page TTFB at most 1.2 times trunk. Autocomplete list must appear within 800 ms after the second character, counting the existing 250 ms debounce. Fail if Place Details plus insert exceeds 3.0 seconds on the write lane.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 3 screenshots into `docs/media/pr-5-review-cta.png` and `docs/media/pr-5-review-autocomplete.png`.
- [ ] Record a 30 to 60 second video of login-or-add on Haarlem. Save it as `docs/media/pr-5-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends it to the base-branch stack and the operator lands it bottom-up.

## Add one like per signed-in visitor (PR-6)

**Depends on.** PR-5.

**Files.**

- [ ] Edit `convex/schema.ts`.
- [ ] Create `convex/likes.ts`.
- [ ] Create `domain/like.ts`.
- [ ] Create `components/like-button.tsx`.
- [ ] Edit `app/nl/[city]/[spot]/page.tsx`.
- [ ] Edit `components/city-spots.tsx`.
- [ ] Edit `components/visual.tsx`.
- [ ] Edit `domain/messages.ts`.
- [ ] Edit `lib/catalog.ts`.
- [ ] Edit `domain/viewModels.ts`.
- [ ] Edit `domain/domain.test.ts`.

**Build.**

- [ ] Table `likes` with unique `(userId, spotId)`. `likeCount` on the spot is derived or kept in sync in the same mutation. Signed-out click calls `requestSignIn()` and writes nothing. Signed-in click inserts one row. A second click removes the row. One session cannot hold two likes on one spot.

**You see.**

- [ ] Signed-out like opens the password-and-Google dialog. After sign-in the visitor can like. The city list orders by `likeCount` then recency. The count on the spot page matches the list.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `domain/like.ts` tests. Toggle twice returns unlike. Two like commands collapse to one row. Run `npm run test:domain`.
- [ ] City sort fixture. Two spots, likes 3 and 1, order is 3 then 1. Run `npm run test:domain`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open a spot page at trunk and head. Trunk has no like control. Record that and gate head shows a like control. Save `pr6-spot.png`. Pass when head has a like button.
- [ ] Lane 2. Signed out, click like. Save `pr6-popup.png`. Pass when the sign-in dialog opens and `likeCount` stays 0.
- [ ] Lane 3. Close the dialog without signing in. Save `pr6-no-write.png`. Pass when the count is still 0.
- [ ] Lane 4. Sign in, click like. Save `pr6-liked.png`. Pass when the control is pressed and the count is 1. If writes are forbidden, mark `verified-unreachable` and still Save `pr6-write-blocked.png`. Pass when the unreachable reason names shared Convex.
- [ ] Lane 5. Click like again. Save `pr6-unlike.png`. Pass when the count returns to 0.
- [ ] Lane 6. Reload the spot. Save `pr6-persist.png`. Pass when the pressed state matches the last write.
- [ ] Lane 7. Second account likes the same spot. Save `pr6-second.png`. Pass when the count is 2, or unreachable.
- [ ] Lane 8. City list order. Save `pr6-order.png`. Pass when the higher like count stands first.
- [ ] Lane 9. Keyboard on the like control. Save `pr6-a11y.png`. Pass when Enter toggles like when signed in, or opens sign-in when signed out.
- [ ] Lane 10. English copy. Save `pr6-en.png`. Pass when the control label is the English message, not a leftover Dutch string.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from like click to pressed state, plus `GET` spot page TTFB.
- [ ] Probe. Browser timestamps at head. Curl the spot page at trunk and head interleaved. Trunk has no like mutation, so click time is head-only with an absolute budget.
- [ ] Baseline. Record trunk spot TTFB first.
- [ ] Rule. Spot TTFB at most 1.2 times trunk. Like toggle must paint within 300 ms. Fail if the mutation exceeds 1.0 second.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 4 screenshots into `docs/media/pr-6-review-popup.png` and `docs/media/pr-6-review-liked.png`.
- [ ] Record a 30 to 60 second video of signed-out popup then signed-in like. Save it as `docs/media/pr-6-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends it to the base-branch stack and the operator lands it bottom-up.

## Publish the adder leaderboard (PR-7)

**Depends on.** PR-6.

**Files.**

- [ ] Create `app/nl/leaderboard/page.tsx`.
- [ ] Create `convex/leaderboard.ts`.
- [ ] Create `domain/leaderboard.ts`.
- [ ] Edit `components/site-header.tsx`.
- [ ] Edit `components/site-footer.tsx`.
- [ ] Edit `app/nl/u/[slug]/page.tsx`.
- [ ] Edit `domain/passport.ts`.
- [ ] Edit `domain/messages.ts`.
- [ ] Edit `app/sitemap.ts`.
- [ ] Edit `domain/domain.test.ts`.
- [ ] Edit `.cursor/skills/verify-bragfast/features/README.md`.

**Build.**

- [ ] Page `/nl/leaderboard` lists accounts by the sum of likes on spots they added. Tie-break is number of spots added, then earliest add. Passport lists spots the user added. Header link uses the new copy. iOS stays out of this PR.

**You see.**

- [ ] Two adders with different like sums appear in that order. A user with zero spots is absent. The empty leaderboard has its own copy when nobody has added yet.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `domain/leaderboard.ts` fixture. Alice spots have 5 likes, Bob spots have 2, order is Alice then Bob. Equal likes, more spots wins. Run `npm run test:domain`.
- [ ] Passport view model lists added spots, not brags. Run `npm run test:domain`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open `/nl/leaderboard` at trunk and head. Trunk 404s. Record that and gate head is 200 with a heading. Save `pr7-page.png`. Pass when head is 200 and contains the leaderboard heading.
- [ ] Lane 2. Empty deployment. Save `pr7-empty.png`. Pass when empty copy is visible.
- [ ] Lane 3. After write lanes from PR-5 and PR-6, open the board. Save `pr7-ranked.png`. Pass when the higher like-sum username is first, or unreachable.
- [ ] Lane 4. Click a username. Save `pr7-passport.png`. Pass when `/nl/u/{username}` lists spots that user added.
- [ ] Lane 5. Header link. Save `pr7-nav.png`. Pass when the header contains a link to `/nl/leaderboard`.
- [ ] Lane 6. Sitemap. Save `pr7-sitemap.png`. Pass when `/nl/leaderboard` is listed.
- [ ] Lane 7. English UI. Save `pr7-en.png`. Pass when chrome is English and usernames stay untranslated.
- [ ] Lane 8. Signed-out visitor can read the board. Save `pr7-signed-out.png`. Pass when no sign-in wall covers the list.
- [ ] Lane 9. User with zero adds is missing. Save `pr7-no-zero.png`. Pass when a fresh account that never added is not listed.
- [ ] Lane 10. City page still orders by likes after this PR. Save `pr7-city-order.png`. Pass when Haarlem or the write-lane city keeps like order.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. `GET /nl/leaderboard` TTFB, plus query time to aggregate like sums.
- [ ] Probe. Curl the new page at head. Trunk 404s, so do not ratio against trunk. Curl `GET /` interleaved as the regression metric that both sides produce.
- [ ] Baseline. Record trunk `GET /` median first. Record head leaderboard TTFB as its own number.
- [ ] Rule. Homepage TTFB at most 1.2 times trunk. Leaderboard TTFB must stay under 2.0 seconds with at most 1000 spots. Fail above that.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1 and lane 3 screenshots into `docs/media/pr-7-review-page.png` and `docs/media/pr-7-review-ranked.png`.
- [ ] Record a 30 to 60 second video of header to leaderboard to passport. Save it as `docs/media/pr-7-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends it to the base-branch stack and the operator lands it bottom-up.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names. The stack root and tip links, a one-line verdict per PR, and anything parked.

## Appendix A. Prototype evidence

No throwaway prototype branch was cut. The add-spot interaction already exists in `components/add-spot.tsx` and is unmounted. Places autocomplete was an operator pick, not a layout fork. Like auth was an operator pick. Signed-out like must open the existing `bragfast:open-signin` dialog. CBS table 85877NED states 2501 woonplaatsen on 1 January 2024. Unproven until PR-2 and PR-5. Exact PDOK centroid quality. Empty-state layout density. Photo-required friction.

## Appendix B. Alternatives rejected

Keep the Places nightly crawl and only add UGC on top. Rejected because two scrape paths already failed the data gate, and a dual catalog would keep the bad rows.

Board by gemeente, with dorpen as search aliases. Rejected because the operator asked for every stad and dorp as a page with its own empty state.

Anonymous likes by cookie. Rejected after the operator correction. Likes are a session.

Magic link kept beside password. Rejected. The operator asked for username and password plus Google.

Likes on photos instead of spots. Rejected. The operator said visitors like the plek, and the leaderboard is adders of the most liked spots.

Ship an iOS client in this stack. Rejected. The operator will build that later against the same spot and photo records.

## Appendix C. Risks

PR-2 disables crons. If that box is skipped, ingest writes gemeente slugs onto woonplaats boards. The PR-2 owner watches `convex/crons.ts`.

PR-3 deletes production Convex rows. Irreversible. The wipe waits for an explicit go.

PR-5 and PR-6 write lanes share the VPS Convex. Default verify-bragfast is read-only. Write proofs need a dedicated deployment or they stay `verified-unreachable`.

2501 sitemap URLs can slow `app/sitemap.ts`. PR-2 perf fails the job if TTFB exceeds 5.0 seconds.

Places autocomplete still needs `GOOGLE_PLACES_API_KEY`. Without it, add shows `placesUnavailable` and UGC cannot start.

Better Auth username plus Google first login is a second dialog step. PR-4 must not create users without a `UserSlug`.

`control-ui` from cursor-team-kit is not in this repo. Lanes drive `.cursor/skills/verify-bragfast/SKILL.md` instead. pstack playbooks may be absent from `origin/main`. Owners then read the plugin cache.

`DESIGN.md` YAML matches the shipped egg and milk chrome. The Colors and Typography prose still names retired indigo fonts. Trust the YAML and `app/layout.tsx`.

There is no woonplaats JSON in the tree today. `domain/data/` is gemeenten plus CBS population only. PR-2 creates the dataset. `hoofddorp` is an alias of `haarlemmermeer` until that PR lands.

## Appendix D. Links and reading list

Read `SPEC.md` after PR-1 lands, then this plan. Read `DESIGN.md` before any UI PR so the egg, milk, and berry chrome stay. Read `.cursor/skills/verify-bragfast/SKILL.md` before every live lane. Read `convex/auth.ts` and `lib/sign-in-signal.ts` before PR-4 and PR-6. Read `components/add-spot.tsx` and `convex/places.ts` before PR-5. Read CBS 85877NED and PDOK BAG WFS before PR-2.

PR-2 and PR-5 take `pstack/skills/how/SKILL.md` before editing search and add. PR-5 takes `pstack/skills/interrogate/SKILL.md` if Place assignment to woonplaats is contested after the first fixture fails. Decision trail per `pstack/skills/show-me-your-work/SKILL.md` lives uncommitted on each owner until the operator asks to keep it.

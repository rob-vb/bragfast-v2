# Slice 1 website playbook

Source of truth for this run is `/home/henk/bragfast-app/PLAN.md` (the user called it SPEC.md). Expo, TestFlight, and Play Store stay out.

Worktree `/home/henk/bragfast-v2-wt-slice1-web` on branch `feat/slice1-web` from `origin/main` at `b81600a`. The other agent keeps writing in `/home/henk/bragfast-v2`.

## Predicate

Domain tests for create, attach, web-redirect, type-reject, unused-blob drop, own-delete, and hero successor are green. Schema has `photos`. `places.add` still redirects a duplicate Place ID. `places.publish` creates or attaches. Autocomplete accepts optional `lat`/`lng`. No Expo code lands here.

UI is unproven until a spot with photos exists: gallery URLs, empty-hero chrome (no empty `<img src>`), and own-delete. Apple is in AuthControl copy and the JS bundle; the dialog click and OAuth flow are unproven. `SpotGallery` always subscribes to `listForSpot` — do not ship this Next until Convex has that query.

## Rigor

High on the photo publish/delete plans. Medium on chrome. Convex deploy and pm2 restart wait until the operator says go. They share production with the other agent.

## architect skipped

PLAN.md already names the `photos` table, web redirect vs app attach, gallery, and Apple. A second design bakeoff would redraw a settled contract.

## Units

1. Spec lines in SPEC.md, PRODUCT.md, AGENTS.md.
2. Domain `planPhotoPublish` / `planPhotoDelete` / `planHeroAfterDelete` plus tests.
3. Convex table, website create writes a `photos` row, app `publish`, `deleteOwn`, backfill, optional GPS bias.
4. Spot page gallery and empty-hero chrome.
5. Apple on Better Auth + AuthControl.
6. Domain tests, typecheck, dedicated Next on 3021. No production deploy in this run.

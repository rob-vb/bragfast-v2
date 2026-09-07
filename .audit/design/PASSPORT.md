# Passport sketch (SPEC step 4)

Usage first. Types follow. Second arena skipped. Shell synthesis already named `ensurePassport` on brag 1, `passportBySlug`, `PassportData`, unique spots from `makerVotes.by_maker`, posts-this-week from `posts.by_maker_created`, and noindex before the first brag.

## Problem

Haarlem has makers. They have no public URL. SPEC step 4 is `/nl/u/{slug}` after brag 1, unique-spot count, weekly posts tab, noindex when the maker currently has zero spots.

Instagram linking stays step 5. Bio editing stays out.

## Usage (caller's view)

Maker A already has two visible posts on Anne&Max. After this run, `/nl/u/maker-a` is view-source HTML. It shows the display name, unique spots = 1, posts this week = 2, and Anne&Max as a link. `?tab=week` lists those two posts. `?view=map` plots the unique spots. A slug that was never minted 404s. A minted slug with zero remaining votes still renders and sends `noindex`.

Signed-in header links to the passport once a slug exists.

## Shape

`users.passport` is `null | { slug, since }`. Null means no public URL. Mint is idempotent. Delete of the last brag does not retract the slug. Indexing follows current unique-spot count, not `since`.

Slug candidates are a pure function of display name plus an attempt number. Convex checks `by_passport_slug` and walks attempts until a free slug. Re-running `ensurePassport` on an existing passport is a no-op.

Unique spots are current `makerVotes` for `user:{users._id}`. Gravestones stay on the list as history, flagged closed. Week heat is a rolling 7-day count of visible posts, `POSTS_WEEK_MS` in `domain/passport.ts`. Hidden and deleted posts do not count.

`makerVotes` still has one writer in `convex/model/votes.ts`. Passport reads that table. It does not write it.

## Synthesis decision

Base remains arena candidate 1 from Shell. This file fills the read path and the slug mint.

## Tradeoffs accepted

- We accept a rolling 7-day window instead of a Monday-start calendar week, in exchange for a timezone-free test and no empty-Monday cliff.
- We accept keeping a minted slug after the last brag is deleted, in exchange for stable URLs. Robots go back to noindex.
- We accept no bio field in v1, in exchange for not inventing a profile editor SPEC did not require for the done predicate.

## Alternatives considered

- Mint the slug at `ensureAppUser`. Loses. Empty accounts would occupy `/nl/u/{slug}` and need noindex pages that SPEC said not to create.
- Retract the slug on last-vote delete. Loses. The URL would 404 for a person who already shared it.
- Calendar ISO week in Europe/Amsterdam. Loses. Domain tests would depend on a timezone table for a count the seeker reads as "this week" heat.

## Next implementation step

Pure slug + week helpers and tests, then `ensurePassport` called from `brags.create` and the Haarlem seed, then `passportBySlug` and `/nl/u/[slug]`.

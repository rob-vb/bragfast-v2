# Social ingest + user-add (SPEC step 5, leftover from 3)

Usage first. Types follow. Second arena skipped. Shell synthesis already named social `Post` bodies, `LicensedImage` with no embed constructor, `makerKey` `ig:{id}`, `aiMatchQueue`, and `planSpotUpsert`. Instagram App Review and a Places key are still missing. Catalog already proved the fixture pattern: keep the ingest shape, seed Haarlem, do not scrape.

## Problem

SPEC step 5 is a hard-tagged `#bragfast` post on a spot with no S3 copy, and a caption-only post in the owner queue that does not change rank until approved. Step 3 still owes signed-in user-add. Hospitality types go live. Petrol/office/store wait in the owner queue.

Live Instagram OAuth and live Places autocomplete cannot run on this VPS today. The writer, the HTML, and the queue still have to exist.

## Usage (caller's view)

STACH Haarlem shows an Instagram permalink in the feed. View-source has `instagram.com` and no Convex storage URL on that page. JSON-LD still has no image. Haarlem board keeps Anne&Max at 01 with score 2. STACH is numbered. Jopenkerk stays in the tail.

The owner queue holds a caption-only `#bragfast` item that proposes Jopenkerk. Approving it inserts a social post and a vote. Rejecting it does neither.

A signed-in seeker can add a spot. With `GOOGLE_PLACES_API_KEY` that is Places autocomplete. Without it the control says Places is not configured. The write path is still `classifyPlaceTypes` then live upsert or `spotAddQueue`. Seed runs a cafe live and a petrol station into the queue.

Instagram connect is linking, not a front door. Unset Meta credentials render the same "not configured" chrome as Google did. `users.igUserId` plus maker-key rewrite wait for a real link.

## Shape

`planSocialIngest` is a pure state machine.

- No `#bragfast` in the caption. Skip.
- Hard Place ID. Attach to that spot. Maker is `ig:{id}` until the account is linked.
- Caption only. Insert `aiMatchQueue` with a proposed spot from `planCaptionMatch`. No vote.

Dedup on `body.embed.platformMediaId`. A second ingest of the same media is a no-op.

Approve match writes one social post through the same `posts` table as in-app brags, then `applyVisiblePosts`. Reject only flips status. Embeds never become `LicensedImage`.

`classifyPlaceTypes` maps Places types to live (`cafe` / `bakery` / `hotel` / `other` for restaurant and meal_takeaway) or queue. Live calls `upsertSpot`. Queue rows live in `spotAddQueue`. Owner approve then upserts with `spotType: other`.

Maker merge is a later writer on `users.igUserId`. This run seeds an unconnected IG maker. `makerVotes` still has one writer.

## Synthesis decision

Base remains arena candidate 1. Social posts are feed rows with `body.kind === "social"`. They are not a second media host.

## Tradeoffs accepted

- We accept Haarlem fixtures instead of Meta and Google, in exchange for a falsifiable HTML predicate on this VPS.
- We accept a permalink card instead of `embed.js` on a fake shortcode, in exchange for not rendering a broken Instagram iframe.
- We accept attaching the hard tag to STACH, not Anne&Max, in exchange for leaving the score-2 board predicate intact.
- We accept rule-based caption match (spot name in caption), in exchange for not calling an LLM while auto-AI is off.

## Alternatives considered

- Blocking the whole step on App Review. Loses. Catalog already shipped ingest without Places.
- Downloading IG bytes into Convex storage. Loses. SPEC forbids hosting third-party UGC.
- Putting the hard tag on Anne&Max. Loses. `verify-brag.sh` would fail on score 2.
- A fake client-side Places list. Loses. Autocomplete talks to Google when a key exists, and stays disabled otherwise.

## Next implementation step

Pure ingest / caption-match / place-type helpers and tests, then Convex writers and Haarlem seed, then STACH HTML, city add-spot chrome, and admin queue rows.

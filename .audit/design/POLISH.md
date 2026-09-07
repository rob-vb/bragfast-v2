# Polish sketch (SPEC step 6)

Usage first. Types follow. Second arena skipped. Instagram stays out. Type chips stay out: the owner already removed Café/Bakker/Hotel/Overig from the city page.

## Problem

The seeker can already filter Haarlem. SPEC step 6 still owes near-me, featured cities that prefer makers, a "your brag is live" mail, and an owner queue for reports plus a closed override.

Places autocomplete stays blocked: no key. AI-match queue stays blocked: no Instagram.

## Usage (caller's view)

Homepage grows a "Dichtbij" control. After the browser grants geolocation it lists the closest listed spots and a link to the nearest city. Empty cities stay featured. Haarlem still leads because it has makers.

`/nl/haarlem?brags=1` hides the seed block. `?open=1` keeps only spots whose hours include now.

After an in-app brag, Resend (or the Convex log when the key is missing) sends "Je brag is live" with the spot URL. Seed makers do not get mail.

`/admin` is noindex. Signed-out and non-owner requests 404. The owner sees open reports, can restore a hidden post or keep it hidden, and can mark a spot Gesloten or list it again.

## Shape

Distance is a pure haversine in `domain/geo.ts`. Nearby ranking and nearest-city picks take an origin plus already-loaded points. City centroids for the seeded NL set live next to that helper so empty featured cities still resolve.

`ReportReview` is a state machine over `reports.status` and `posts.visibility`. Restore writes visible and resolved, then `applyVisiblePosts`. Keep-hidden only resolves the report. Closed override patches `listingStatus` and must drop standing columns so `parseSpot` still accepts the row. Reopen lists the spot and refreshes standing. `makerVotes` still has one writer.

`bragLiveEmail` is a pure subject+html builder. `brags.create` schedules `internal.notify.sendBragLive` with the auth email and the public path. No sent-flag table. Retrying the action may send twice.

Owner identity is `OWNER_EMAIL` on the Convex deployment compared to the Better Auth email. Unset means nobody is owner.

## Synthesis decision

Base remains arena candidate 1. This file fills the remaining v1 seeker and owner surfaces. It does not reopen ranking.

## Tradeoffs accepted

- We accept auto-hide on report (already shipped) plus an owner review, in exchange for matching "Report hides pending owner review."
- We accept a hardcoded NL centroid table, in exchange for near-me on featured cities that still have zero spots.
- We accept logging the live-brag mail when Resend is unset, in exchange for not blocking the done predicate on a mailbox.
- We accept 404 on `/admin` for everyone except the owner, in exchange for not advertising the queue.

## Alternatives considered

- Re-adding type chips because SPEC lists them. Loses. The owner removed them on purpose.
- Client-only near-me over Haarlem cards. Loses. Homepage near-me has to work before a city is chosen.
- Storing `users.role`. Loses. One owner email is enough and avoids a privilege column the seed would have to invent.

## Next implementation step

Pure geo + report-review + email helpers and tests, then catalog nearby, notify action, admin mutations, then the homepage control and `/admin`.

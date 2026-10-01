---
name: scan-photos
description: Review photos posted to brag.fast since the last scan and hide anything that breaks the house rules. Use when the owner asks to scan, check or moderate new photos, or runs /scan-photos (often from /loop 1h).
---

# Scan new photos

The owner's after-the-fact moderation pass. Every photo gets a Gemini check on Vertex right after it goes live (`screen.screenNewPhoto`); photos it passed are already marked scanned and photos it rejected already wait in `/admin`. This scan covers the rest: photos the check could not answer for (no credentials, an error, a timeout twice) and anything from before the check existed. The rules are the terms at `/terms` (`domain/legal.ts`, section `rules`).

Run every command from `/var/www/bragfast-v2`. The functions are internal, so only the CLI can call them; pass `--prod` so they act on the live deployment `prod:dashing-cormorant-532`; without it they hit dev.

## Steps

1. List what has not been scanned yet, oldest first:

   ```bash
   npx convex run --prod moderation:unscannedPhotos '{"limit": 50}'
   ```

   An empty list means you are done: say so in one line.

2. For each photo, download the `url` into the scratchpad and look at it with Read. Do not open the URL any other way.

3. Decide per photo. **Flag** it only for:
   - nudity or sexual content
   - violence, gore, weapons
   - hate symbols, hateful or threatening text
   - drugs
   - personal data (documents, screens, licence plates up close, receipts with names)
   - spam or advertising (posters, QR codes, promo text as the subject)
   - a recognisable person as the main subject, not a meal

   Food, drinks, tables, interiors, storefronts and people at a table in the background are fine. A photo that is not breakfast or brunch is **not** a reason to flag on its own; visitors report wrong spots.

4. Flag each bad photo with a short Dutch reason. It hides at once and lands in `/admin` for the owner's decision:

   ```bash
   npx convex run --prod moderation:flagFromScan '{"photoId": "<id>", "reason": "naakt"}'
   ```

5. Mark every photo you looked at and did not flag as scanned, in one call:

   ```bash
   npx convex run --prod moderation:markScanned '{"photoIds": ["<id>", "<id>"]}'
   ```

6. If the list was full (50), repeat from step 1.

## Report

One line per flagged photo (spot, uploader, reason), then the count of photos passed. Never delete a photo or an account from here; that is the owner's call in `/admin`.

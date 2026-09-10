# brag.fast. Agent spec

Read this before writing code. It is the product source of truth. UI copy is Dutch (English UI strings exist as a language switch on the same URLs). Code, slugs, and path segments are English.

If this file and the code disagree, this file wins until a human changes it.

## What you are building

A **website** (not a native app) that is the breakfast and brunch **directory** for the Netherlands. The question it answers is *where do I eat breakfast in woonplaats X*. The primary user is a seeker planning a weekend or already in town. TripAdvisor without the everything-else.

**Spots** (cafés, bakeries, lunchrooms, hotels that sell breakfast and brunch) are the unit. Visitors add those spots. A **like** is how a spot climbs its woonplaats board. A live social feed is not the product.

The brand is English (`brag.fast`, hashtag `#bragfast`). The first market is NL because the owner lives there. More countries later via the same URL shape.

Scraped Places catalogs and Instagram ingest are not the product. An iOS app later attaches more photos to an existing spot. That app is not this website.

## Leading words

| Word | Meaning |
|------|---------|
| **Spot** | One hospitality venue, canonicalized by Google Place ID. A visitor adds it. |
| **Woonplaats** | One Dutch BAG woonplaats board (stad or dorp). The URL slug is the name people type (`den-bosch`, `den-haag`, `hoofddorp`). CBS counts 2501 BAG woonplaatsen on 1 January 2024. |
| **Like** | One signed-in visitor, one row per spot. Rank unit on the woonplaats board. |
| **Adder** | The account that added the spot. |
| **Leaderboard** | Person board at `/nl/leaderboard`. Rank is the sum of likes on spots the adder added. |
| **Passport** | Public profile of spots that account added. The `UserSlug` exists at signup. |
| **Photo** | One image the adder uploads onto the spot. Required to create the spot. Hosted on brag.fast. |
| **Claim** | Paid ownership of the spot page (v2). Tools and a conversion CTA, never rank. **Geclaimd** means someone is paying for that page, not that we verified the business. |

Do not call a woonplaats a gemeente. Gemeente boards are retired.

## v1 vs later

**Ship in v1**

- Crawlable site, NL woonplaats boards, spot + profile + leaderboard pages
- Homepage: search (woonplaats or spot), featured woonplaatsen, near-me
- Woonplaats page: list of visitor-added spots, empty state when none, list default, map toggle
- Add CTA on an empty woonplaats. Signed-out click opens sign-in. Signed-in visitor adds a Place plus one photo.
- Filters: open now
- Spot page: name, address, hours, like count, the uploaded photo
- Ranking: like count on the spot. Tie-break is the most recent like, then recency of the add
- Auth: Better Auth with Google + `emailAndPassword`. Unique public `username` (`UserSlug`) at signup. Password login accepts email or username. Google first login that lacks a username stays on the same dialog until the username is set. No magic link.
- Like: signed-in, one per spot, toggle off to unlike. Signed-out like opens the sign-in dialog and writes nothing
- Leaderboard: adders ranked by likes on spots they added. Tie-break is number of spots added, then earliest add. An account with zero adds is absent.
- Photo upload on add, Convex storage
- i18n: `nl` / `en` UI on the **same** URLs
- SEO: server-rendered HTML, JSON-LD `FoodEstablishment`, sitemap of woonplaatsen and live spots
- Admin: reports, closed override

**Not v1**

- Native app, Stripe/claim (see **Claim (v2)**. Do not implement until a v2 task names it), pay-to-rank, TikTok/YouTube OAuth
- Type chips (Café/lunch, Bakker, Hotel, Overig) are v2. `spotType` may exist in data. Do not expose woonplaats filters until a v2 task.
- Instagram connect, `#bragfast` import, social embeds as catalog, maker votes, magic email link, nightly Places hygiene
- Comments, followers, notifications beyond transactional email
- Cuisine taxonomy, guests-only hotel flag, AI-written spot articles
- ChatGPT-placement promises, national spot board
- Apple login (add later on Better Auth)
- iOS client that attaches more photos to an existing spot

The owner sets the "idea is working" bar. Do not block v1 on a metric.

## Hard rules

1. Discovery owns the product. Likes feed the woonplaats board. Do not build a national live feed as the homepage.
2. Rank **spots**, not dishes. The person board is the adder leaderboard.
3. Catalog of boards = NL woonplaatsen. One GPS point, one woonplaats. URLs are country-prefixed for a future `/be/...`.
4. A like is a vote. No star ratings. Do not surface Google rating as "best."
5. One like per signed-in visitor per spot. Many photos on the same spot do not add likes.
6. Board numbers are earned from likes. An empty woonplaats shows the empty state, not a scraped tail.
7. Host only media the user uploaded on brag.fast.
8. Claim (v2) is ownership and tools. Rank stays 100% likes. Paid extras are **additive** (CTA, official hero, Geclaimd mark). Unpaid pages keep the same board rules. Owners cannot hide visitor photos.
9. LLM pitch = public, factual, crawlable pages + schema for **every** spot. No generated brochure copy. No guaranteed chatbot mentions. Do not give claimed spots an exclusive machine layer (`llms.txt`, extra schema, "AI visibility").
10. Browse signed-out. Sign-in for add-spot, like, and passport identity. A signed-out like or add opens the sign-in dialog.

## URLs

```
/                         homepage
/nl                       NL home (same as / if NL-only chrome)
/nl/{city}                woonplaats page
/nl/{city}/{spot}         spot page
/nl/u/{slug}              public passport
/nl/leaderboard           adder leaderboard
```

- `{city}` and `{spot}` are English-safe slugs (e.g. `haarlem`, `de-bakkerswinkel`).
- `{city}` is the canonical woonplaats slug. Well-known names (`den-bosch`, `den-haag`, `hoofddorp`) are the slug people type. Point-in-polygon on woonplaats rings assigns a new Place to a board. Google address components are fallback when a point misses every polygon.
- `/nl/` is **country**, not language. Language is a UI switch (cookie or `Accept-Language`, default Dutch).
- Do not clone the tree under `/en/...` in v1.
- Passports with zero added spots: noindex. After the first add: index.

## Ranking

**Spot board (woonplaats)**  
Score = count of likes on that spot.  
Tie-break: timestamp of the most recent like, then when the spot was added.  
Show the like count on the spot page and on the woonplaats list.

**When a like counts**

- Signed-in visitor clicks like on that spot. That writes one row.
- A second click from the same session removes the row.
- Signed-out click opens sign-in and writes nothing.

**Adder leaderboard**

- Score = sum of likes on spots that account added.
- Tie-break: number of spots added, then earliest add.
- Hide accounts with zero adds. Empty leaderboard has its own copy.

**Recency:** likes have no 90-day window in v1. Do not add decay curves.

## What a spot is

On the site if a guest can **buy** breakfast or brunch there (café, bakery, lunchroom that opens for breakfast, hotel). Home kitchens and offices stay out. Fast food stays out: Places type `fast_food_restaurant`, plus a short name blocklist (McDonald’s, Burger King, KFC, Subway, FEBO, New York Pizza). Chains that serve breakfast as hospitality stay in (Anne&Max, Bagels & Beans, Van der Valk).

Generic Google type `restaurant` or `meal_takeaway` is not breakfast. Those stay out unless stored hours show at least one opening **before 11:00**. A café, bakery, coffee shop, `breakfast_restaurant`, or `brunch_restaurant` stays in when hours are unknown, and drops when hours never open before 11:00. Hotels stay even with dinner hours. Lunch-only and dinner restaurants (Loetje, bistros that open 11:30+) are not listed.

**User-add.** Place types that go live immediately: café, bakery, restaurant, meal_takeaway, lodging or hotel equivalents from Places. Reject petrol station, office, and generic store. They do not go live. Fast food fails the type gate. Duplicate `placeId` redirects to the existing spot.

Google Place ID is the add helper only. Autocomplete and one Place Details call fill name, address, and geo. Do not crawl Places to fill woonplaats boards.

Permanently closed (`business_status` CLOSED): strip from woonplaats lists and search; keep the page with a clear "Gesloten" state. Passport keeps it as history, not a recommendation. Temporarily closed follows opening hours, not gravestone.

## Pages

### Homepage

One sentence of what it is (breakfast and brunch spots per woonplaats). One search box (woonplaatsen **and** spots). Featured woonplaatsen (prefer boards that already have spots; always include major NL woonplaatsen). Secondary: near-me if geolocation is granted.

No nationwide ticker.

Search: exact spots first, then woonplaatsen. Ambiguous tent names show the woonplaats beside the name.

### Woonplaats `/nl/{city}`

One list of listed spots in that woonplaats. Default order is like count, then recency. Sortable by name or distance.

Default view: list. Toggle: map.  
Chips in v1: Open nu.  
v2 chips: Café/lunch · Bakker · Hotel · Overig (do not ship until a v2 task).

When the woonplaats has zero spots, show `noSpotsYet` and the add control. The add control is not an empty-filter state. If `open=1` hides every spot on a non-empty board, that is a filter miss, not an add prompt.

Signed-out add control fires `requestSignIn`. Signed-in add control mounts the Places field.

### Spot `/nl/{city}/{spot}`

Name, address, woonplaats, opening hours / open-now.  
Like count and like control.  
The adder’s photo as the card and page image.  
Share URL. Report.  
No menu, price, booking, phone-as-a-product in **v1** (optional tel link is fine). No comments. v2 claimed spots may add one owner conversion CTA. See Claim (v2).

JSON-LD `FoodEstablishment` (or `Restaurant`/`Bakery`/`Hotel` when type is clear): name, address, geo, opening hours, url, image from the uploaded photo.

### Passport `/nl/u/{slug}`

Display name (`UserSlug`), avatar, count of spots added, list/map of those spots. One-line bio optional. No follow. Mint the public URL at signup. Index after the first add.

### Leaderboard `/nl/leaderboard`

List of adders. Readable signed-out. Header and footer link here. Empty copy when nobody has added yet.

## Auth and identity

- **Better Auth**, v1 providers: Google, `emailAndPassword`.
- Unique public `username` (`UserSlug`) at signup. Mint the passport row then.
- Google first login without a username opens the same dialog on the username field. Do not create a user without a `UserSlug`.
- Password login accepts email or username.
- Transactional email only: "your spot is live."
- Keep `AuthControl` mounted. `requestSignIn()` opens that dialog.

## Add a spot

- Sign-in required.
- Places autocomplete, then one Place Details call at confirm.
- Point-in-polygon sets the woonplaats from geo. Do not trust the page `{city}` slug as the board.
- Exactly one photo on create. Convex `_storage`.
- Honor system: the Place is a breakfast or brunch tent. No GPS required from the visitor.
- User can delete their photo later (AVG). Report hides pending owner review.
- No pre-moderation of every upload.
- iOS later attaches more photos to an existing spot. Do not block v1 on that client.

## Likes

- Sign-in required to write.
- Table unique on `(userId, spotId)`.
- `likeCount` on the spot stays in sync in the same mutation, or is derived. The count on the spot page matches the woonplaats list.
- Signed-out click calls `requestSignIn()` and writes nothing.

## Default stack

Empty repo: use this unless the human names another.

- Next.js App Router + TypeScript, **server-rendered** HTML for all public pages
- Convex
- Better Auth (Google, `emailAndPassword`)
- Google Places (autocomplete + Place Details as the add helper. Place ID, hours, types)
- i18n: `nl` + `en` message files; UGC never machine-translated
- Object storage for **in-app** spot photos only

Do not add a second framework. Do not ship a client-only SPA for public pages.

## Data (conceptual)

- `User`. brag.fast account, `UserSlug`, email
- `Spot`. place_id unique, slug, woonplaats slug, country=`nl`, types, hours, `closed_permanently`, `addedBy`, photo storage id, like count
- `Like`. user_id, spot_id, created_at. Unique `(user_id, spot_id)`
- `Report`. spot or photo, reason, status

## Claim (v2)

Do not implement until a task explicitly starts v2 claim. Stripe, claim UI, and Geclaimd marks stay out of v1.

The venue's job is customers. Visitor photos and likes are the free etalage. Good food means guests add and like the tent, and the spot page markets the tent. Claim is how brag.fast charges for **catching** that demand, not for existing on the board.

**Price:** €29 per spot per month, cancel anytime. One price, no Bronze/Gold, no yearly discount in the first paid version. A chain pays per location. One active claim per spot (first subscriber). Stop paying: conversion CTA, official hero, and Geclaimd marks disappear; the public page matches never-claimed.

**Additive only.** Unclaimed and claimed spots share the same board number, the same photos, and the same crawl (HTML, JSON-LD, sitemap). A directory-wide `llms.txt` (if we add one) lists live spots, not only paying tents. Do not throttle unpaid photos, do not exclusive-sort “most popular” for payers, do not sell ChatGPT placement.

**Owners cannot hide visitor photos.** Report (spam, wrong place, illegal) stays the existing moderation path. Paid may add an owner-uploaded official hero on the spot page, labeled as the house, **beside** visitor photos, not instead of them.

**First paid SKU** (and nothing else until a later spec edit):

1. One conversion CTA on the **spot page only** (owner-pasted URL: reserve / order / website). Not on the woonplaats board, not on the map as a button.
2. Official hero (owner upload).
3. **Geclaimd** mark on the spot page, the woonplaats board, and the map.

Geclaimd means "this page has a paying owner," not "we checked KvK" and not "this breakfast is better." No identity-verification flow in this SKU. Disputes are handled by the site owner out of band.

**Not in the first SKU:** signature dish, diet fields, replies, analytics dashboard, exclusive LLM files, extra schema. Those need a spec change before anyone builds them.

**Seeker chrome:** the public spot page may show a small **Jouw zaak?** with no price. Pitch and Stripe live behind that link. Do not put €29 on the breakfast etalage.

## Copy (Dutch default)

Homepage one-liner: **Ontbijt- en brunchplekken, per stad.**  
Hashtag in UI: `#bragfast`.  
Board empty: **Nog geen plekken in deze stad.** (`noSpotsYet`)  
Closed: **Gesloten**.  
Open now: **Open nu**.  
Claim entry (v2): **Jouw zaak?**  
Claimed mark (v2): **Geclaimd**.

English UI translates chrome and our sentences only.

## Build order

Stop each step when the criterion is true.

1. **Spec.** This file, `PRODUCT.md`, and `AGENTS.md` name woonplaats, like, leaderboard, `emailAndPassword`.  
   *Done:* agents read visitor-added spots, not a Places crawl.

2. **Woonplaats boards.** 2501 BAG woonplaatsen as pages and search hits. Disable ingest crons so gemeente slugs cannot land on the new boards.  
   *Done:* `/nl/hoofddorp` and `/nl/giethoorn` are 200. Haarlem still is.

3. **Empty catalog.** Delete crawl, Instagram, maker votes, and old catalog rows after the operator says go.  
   *Done:* Haarlem shows `noSpotsYet`. Old spot URLs 404.

4. **Auth.** Google + `emailAndPassword`, `UserSlug` at signup.  
   *Done:* the dialog has Google, username, password, and create-account. Magic-link copy is gone. `requestSignIn()` still opens it.

5. **Add + photo.** Mount add on empty woonplaats pages. Point-in-polygon assigns the board. One photo required.  
   *Done:* a signed-in visitor can create `/nl/{woonplaats}/{spot}` with that photo as the card image.

6. **Likes.** One per session per spot. Signed-out click opens sign-in.  
   *Done:* the woonplaats list orders by like count. Counts match the spot page.

7. **Leaderboard.** `/nl/leaderboard` and passport list added spots.  
   *Done:* two adders with different like sums appear in that order. A user with zero spots is absent.

## Out of scope reminders

If a task would require Stripe, TikTok login, a store listing, a comment thread, Google stars on the board, generating unique blog copy per spot, woonplaats type chips, Instagram, or magic link, stop and leave it out. Claim and type chips are v2. A v1 task that touches Stripe, Geclaimd, type chips, Instagram, or magic link is out of scope. iOS is later.

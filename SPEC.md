# brag.fast. Agent spec

Read this before writing code. It is the product source of truth. UI copy is Dutch (English UI strings exist as a language switch on the same URLs). Code, slugs, and path segments are English.

If this file and the code disagree, this file wins until a human changes it.

## What you are building

A **website** (not a native app) that is the breakfast and brunch **directory** for the Netherlands. The question it answers is *where do I eat breakfast in woonplaats X*. The primary user is a seeker planning a weekend or already in town. TripAdvisor without the everything-else.

**Spots** (cafés, bakeries, lunchrooms, hotels that sell breakfast and brunch) are the unit. The app creates a spot when a user publishes the first photo of a Place (`api.places.publish`). The website has no add UI. A **like** is how a spot climbs its woonplaats board. A live social feed is not the product.

The brand is English (`brag.fast`, hashtag `#bragfast`). The first market is NL because the owner lives there. More countries later via the same URL shape.

Scraped Places catalogs and Instagram ingest are not the product. The website is the seeker directory. Extra photos and the first-photo create stay in the app. The website gallery shows those photos.

## Leading words

| Word | Meaning |
|------|---------|
| **Spot** | One hospitality venue, canonicalized by Google Place ID. The app creates it from the first photo of a Place. |
| **Woonplaats** | One Dutch BAG woonplaats board (stad or dorp). The URL slug is the name people type (`den-bosch`, `den-haag`, `hoofddorp`). CBS counts 2501 BAG woonplaatsen on 1 January 2024. |
| **Like** | One signed-in visitor, one row per spot. Rank unit on the woonplaats board. |
| **Credit** | The photo a like came through: the gallery photo in view when the visitor tapped like, else the hero. It tells a photographer their photo helped the spot and counts for them on the leaderboard. It never adds a like or moves a spot's rank. |
| **Adder** | The account that added the spot. |
| **Leaderboard** | Person board at `/nl/leaderboard`. Rank is the likes an account earned: likes on spots it added plus likes credited to its photos, each like once. |
| **Passport** | Public profile of every photo that account posted, in any country. The photo that created a spot carries an **Ontdekt** mark. The `UserSlug` exists at signup. |
| **Photo** | One hosted image on the spot. Create requires the adder’s photo. That photo is the hero and the first gallery row. The app may attach more visitor photos to the same spot. Hosted on brag.fast. |
| **Claim** | Paid ownership of the spot page (v2). Tools and a conversion CTA, never rank. **Geclaimd** means someone is paying for that page, not that we verified the business. |

Do not call a woonplaats a gemeente. Gemeente boards are retired.

## v1 vs later

**Ship in v1**

- Crawlable site, NL woonplaats boards, spot + profile + leaderboard pages
- Homepage: woonplaats autocomplete over the BAG gazetteer; IP local-favorites when that woonplaats board has at least 3 listed spots with a photo; the four-step band; the app section with per-store Coming soon. No featured woonplaatsen. No GPS. No spot search on `/`. No national feed.
- Woonplaats page: list of spots added in the app, empty state when none, list default, map toggle when spots exist
- Empty woonplaats: `noSpotsYet` and `emptyBoardAppHint`. No add control. No sort or map on empty. `noindex, follow` and out of the sitemap until the first spot.
- Woonplaats index `/nl`: every board with at least one live spot, A to Z.
- Spot page: name, address, like count, the adder’s photo as hero, and a gallery of hosted photos on that spot. Hours stay in data and JSON-LD, not in seeker chrome.
- Ranking: like count on the spot. Tie-break is the most recent like, then recency of the add
- Auth: Better Auth with Google, Apple, and `emailAndPassword`. Unique public `username` (`UserSlug`) at signup. Password login accepts email or username. Google or Apple first login that lacks a username stays on the same dialog until the username is set. No magic link.
- Like: signed-in, one per spot, toggle off to unlike. Signed-out like opens the sign-in dialog and writes nothing
- Leaderboard: accounts ranked by earned likes (likes on spots they added plus likes credited to their photos, each once). Tie-break is number of spots added, then who first added a spot or posted a photo. An account with no add and no earned like is absent.
- Photo upload on add, Convex storage
- i18n: `nl` / `en` UI on the **same** URLs
- SEO: server-rendered HTML, JSON-LD `FoodEstablishment` on spots and `WebSite` + `Organization` on `/`, a canonical URL and share card on every public page, `robots.txt`, sitemap of chrome pages, woonplaatsen with a live spot, and live spots
- Admin: reports, closed override

**Not v1**

- Stripe/claim (see **Claim (v2)**. Do not implement until a v2 task names it), pay-to-rank, TikTok/YouTube OAuth
- Type chips (Café/lunch, Bakker, Hotel, Overig) are v2. `spotType` may exist in data. Do not expose woonplaats filters until a v2 task.
- Instagram connect, `#bragfast` import, social embeds as catalog, maker votes, magic email link, nightly Places hygiene
- Comments, followers, notifications beyond transactional email
- Cuisine taxonomy, guests-only hotel flag, AI-written spot articles
- ChatGPT-placement promises, national spot board
- Extra-upload button on the website spot page. Extra photos write from the app only.

The owner sets the "idea is working" bar. Do not block v1 on a metric.

## Hard rules

1. Discovery owns the product. Likes feed the woonplaats board. Do not build a national live feed as the homepage. IP local-favorites are that one woonplaats board, not a radius and not a ticker.
2. Rank **spots**, not dishes. The person board ranks the people behind them: adders and photographers, by earned likes.
3. Catalog of boards = NL woonplaatsen. One GPS point, one woonplaats. Board and spot URLs are country-prefixed for a future `/be/...`. Profiles are not: a person posts photos in more than one country.
4. A like is a vote. No star ratings. Do not surface Google rating as "best."
5. One like per signed-in visitor per spot. Many photos on the same spot do not add likes. A like credits at most one photo, and the credit moves no spot's rank.
6. Board numbers are earned from likes. An empty woonplaats shows the empty state, not a scraped tail.
7. Host only media the user uploaded on brag.fast.
8. Claim (v2) is ownership and tools. Rank stays 100% likes. Paid extras are **additive** (CTA, official hero, Geclaimd mark). Unpaid pages keep the same board rules. Owners cannot hide visitor photos.
9. LLM pitch = public, factual, crawlable pages + schema for **every** spot. No generated brochure copy. No guaranteed chatbot mentions. Do not give claimed spots an exclusive machine layer (`llms.txt`, extra schema, "AI visibility").
10. Browse signed-out. Sign-in for like and passport identity. Signed-out like opens sign-in.

## URLs

```
/                         homepage
/nl                       city index (boards with a live spot)
/nl/{city}                woonplaats page
/nl/{city}/{spot}         spot page
/u/{slug}                 public passport (no country; /nl/u/{slug} redirects 308)
/nl/leaderboard           person leaderboard
/how-it-works             how it works (chrome page, explainer)
```

- `{city}` and `{spot}` are English-safe slugs (e.g. `haarlem`, `de-bakkerswinkel`).
- `{city}` is the canonical woonplaats slug. Well-known names (`den-bosch`, `den-haag`, `hoofddorp`) are the slug people type. Point-in-polygon on woonplaats rings assigns a new Place to a board. Google address components are fallback when a point misses every polygon.
- `/nl/` is **country**, not language. Language is a UI switch (cookie or `Accept-Language`, default Dutch).
- Do not clone the tree under `/en/...` in v1.
- Passports with zero photos: noindex. After the first photo: index.
- Woonplaats boards with zero live spots: noindex, follow, and not in the sitemap. After the first spot: index. Search still reaches every board.
- A live spot is listed and has a hosted photo, the same rule the board uses.

## Ranking

**Spot board (woonplaats)**  
Score = count of likes on that spot.  
Tie-break: timestamp of the most recent like, then when the spot was added.  
Show the like count on the spot page and on the woonplaats list.

**When a like counts**

- Signed-in visitor clicks like on that spot. That writes one row.
- A second click from the same session removes the row.
- Signed-out click opens sign-in and writes nothing.

**Person leaderboard**

- Score = likes the account earned: every like on a spot it added, plus every like credited to one of its photos. A like that is both (the adder's own hero) counts once. A like without credit counts for the adder only.
- Discovery still pays most: the adder earns every like on the spot, a photographer only the likes that came through their photo.
- Tie-break: number of spots added, then who first added a spot or posted a photo.
- Hide accounts with no add and no earned like. Under each name: spots added, or the photo count when there are none. Empty leaderboard has its own copy.
- The passport's like count is this score.

**Recency:** likes have no 90-day window in v1. Do not add decay curves.

## What a spot is

On the site if a guest can **buy** breakfast or brunch there (café, bakery, lunchroom that opens for breakfast, hotel). Home kitchens and offices stay out. Fast food stays out: Places type `fast_food_restaurant`, plus a short name blocklist (McDonald’s, Burger King, KFC, Subway, FEBO, New York Pizza). Chains that serve breakfast as hospitality stay in (Anne&Max, Bagels & Beans, Van der Valk).

Generic Google type `restaurant` or `meal_takeaway` is not breakfast. Those stay out unless stored hours show at least one opening **before 11:00**. A café, bakery, coffee shop, `breakfast_restaurant`, or `brunch_restaurant` stays in when hours are unknown, and drops when hours never open before 11:00. Hotels stay even with dinner hours. Lunch-only and dinner restaurants (Loetje, bistros that open 11:30+) are not listed.

**User-add.** Place types that go live immediately: café, bakery, restaurant, meal_takeaway, lodging or hotel equivalents from Places. Reject petrol station, office, and generic store. They do not go live. Fast food fails the type gate. Duplicate `placeId` redirects to the existing spot.

Google Place ID is the add helper only. Autocomplete and one Place Details call fill name, address, and geo. Do not crawl Places to fill woonplaats boards.

Permanently closed (`business_status` CLOSED): strip from woonplaats lists and search; keep the page with a clear "Gesloten" state. Passport keeps it as history, not a recommendation. Temporarily closed follows opening hours, not gravestone.

## Pages

### Homepage

**Hero.** One sentence of what it is (breakfast and brunch spots per woonplaats), then an intro that says what the site and app do: search a place, visitors add spots with a photo in the app, likes set the order. One search box: woonplaats autocomplete over the BAG gazetteer (`searchWoonplaatsHits` / `NL_CITIES`). English intro starts "Search a city." Dutch intro keeps woonplaats. Exact pick navigates to `/nl/{city}`. Nothing sits under the search. The search needs script; the header and footer links to **Hoe het werkt** (`/how-it-works`) and **Steden** (`/nl`) are how a crawler leaves `/`. There is no `/?q=` results list, no GPS or near-me control, no spot search on `/`, and no nationwide ticker or live social feed.

**Local favorites.** Optional block under the search. Infer a point from the request IP (GeoIP/MaxMind-style). No browser geolocation prompt. Map that point through BAG point-in-polygon to one woonplaats (same assignment as add).

Render the block only when that woonplaats has at least **3** listed spots with a hosted photo. Otherwise omit it: too few spots, IP outside NL, the point misses every ring, or a VPN/datacenter with no Dutch woonplaats. No fallback city. Do not title the block with a foreign city.

When it renders: heading is that woonplaats (copy not frozen). Order is `sortCityBoard` (likes, then recency). At most **6** cards. Each card: the brag photo, spot name, like count. No address, no hours. Click goes to `/nl/{city}/{spot}`. One extra link goes to the woonplaats board `/nl/{city}`. Spots without a photo do not count toward the threshold of 3.

Do not ship featured woonplaatsen or **Steden om te ontdekken**. Stock city scenes are not a homepage module.

**Steps.** One berry band under favorites (or under the hero when favorites is omitted), titled **Zo werkt brag.fast**: the four verbs of how it works (Zoek, Brag, Like, Klim) as stickers, one sentence each, each card linking to its poster on `/how-it-works`, and one link to the whole page. Always show it. It explains; it does not list woonplaatsen or spots.

**App section.** One band under the steps band, titled **Je bord op het board.** Always show it. It covers both things the app does with one photo, as two acts:

1. **Brag als eerste**: the place is new, so the photo puts it on its woonplaats board with the photographer's name (create in the app).
2. **Laat je bord zien**: the place is listed, so the photo joins its gallery (extra photos in the app).

The device frame shows the app at work: its own Dutch screens and copy play the two acts once when the band is half in view, and the photo comes out of the phone as a print on the board or in the gallery. Every place, handle and photo in it is example data under a **Voorbeeld** label. Visitors can pause, replay, or play either act; reduced motion shows the finished first act. Then a line of copy and the per-store download controls.

No third act. No recent-brags feed on `/`. GPS stays in the app. Copy is not frozen; do not put **adder** in Dutch UI sentences.

Store buttons: one iOS, one Android. Each is independently **live** (href to that store URL) or **disabled + Coming soon**. iOS ships first; Android may stay coming-soon after iOS is live. Do not href a store that is not actually listed.

### Woonplaats `/nl/{city}`

One list of listed spots in that woonplaats. Default order is like count, then recency (`sortCityBoard`). Seeker sort is two native `<select>`s: key Likes or Naam, direction Aflopend or Oplopend. No distance. No Open nu.

Default view: list. Toggle: map. Header is berry (`#4a1534`) with the woonplaats name, no photograph.  
v2 chips: Café/lunch · Bakker · Hotel · Overig (do not ship until a v2 task).

When the woonplaats has zero spots, show `noSpotsYet` and `emptyBoardAppHint`. There is no add control. Empty boards have no sort selects and no map toggle. `?view=map` on an empty board still returns 200 with that empty state.

### Spot `/nl/{city}/{spot}`

Name, address, woonplaats.  
Like count and like control.  
The adder’s photo as the card and page hero. A gallery of hosted photos on that spot, including the adder’s photo. Signed-in visitors can delete a gallery row they uploaded. Extra-upload is the app, not this page. Empty hero is berry with no broken image.  
The gallery lightbox carries the same like control, under the uploader and date, beside the likes that photo brought (**12 likes via deze foto**, hidden at zero). Under the Photos heading one credit line names every uploader with a passport once, most likes brought first, then who posted first: **In beeld dankzij @anna, @bram en @cor**. Past six names it names five and counts the rest.  
Share URL. Report.  
Hours stay in the spot record and in JSON-LD. They are not a seeker heading, weekday list, or Open nu chip.  
No menu, price, booking, phone-as-a-product in **v1** (optional tel link is fine). No comments. v2 claimed spots may add one owner conversion CTA. See Claim (v2).

JSON-LD `FoodEstablishment` (or `Restaurant`/`Bakery`/`Hotel` when type is clear): name, address, geo, opening hours, url, image from the uploaded photo.

### Passport `/u/{slug}`

Username (`UserSlug`), photo count, count of spots discovered, leaderboard standing and its like count (hidden at zero). The body is every photo the account posted, newest first, each linking to its spot, with a list/map toggle (the map pins each photographed spot once). The photo whose publish created the spot carries an **Ontdekt** sticker (`photos.discovery`); a later photo never inherits it when that one is deleted. One stamp per woonplaats the account posted a photo in. No avatar, no display name, no email. Header is berry, no photograph. One-line bio optional. No follow. Mint the public URL at signup. Index after the first photo.

The path has no country prefix: profiles span countries while boards stay per country. `/nl/u/{slug}` redirects there.

### Leaderboard `/nl/leaderboard`

List of adders and photographers. Readable signed-out. Header and footer link here. Empty copy when nobody has added yet.

### Woonplaats index `/nl`

Every woonplaats board with at least one live spot, A to Z by the name the visitor reads (`'s-Hertogenbosch` under H), grouped by letter, each with its spot count. A board joins with its first spot. The order is the alphabet; this is an index, not featured woonplaatsen, and it never ranks boards. Berry header with the search box, so a place that is not listed is one search away. With no boards yet: an empty state and `noindex`. Header and footer link here.

### How it works `/how-it-works`

Chrome page. Header and footer link here. English slug. Dutch default title **Hoe het werkt**.

The explainer runs in four steps, in the order a spot lives: **Zoek** (every woonplaats has a board; the real search box), **Brag** (the first photo in the app creates the spot under your name), **Like** (one like per person per spot, tap again to undo, most likes on top, a tie goes to the newest like, no stars and no paid placement), **Klim** (likes on spots you added and likes through your photos count toward the leaderboard; the passport gets a stamp per woonplaats you posted a photo in). Then house rules (what counts as a spot, likes are not for sale, browse without an account, delete your own photos, closed spots leave the board) and the store buttons.

Demo pieces (the photo print, the example board, the podium, the stamp) use made-up spots and usernames, labelled **Voorbeeld**. They never link to a real spot or passport, and demo likes write nothing. The example board sorts with the same rule as `sortCityBoard`.

## Auth and identity

- **Better Auth**, v1 providers: Google, Apple, `emailAndPassword`. Apple `clientSecret` is the short-lived JWT Better Auth expects, not a Google-style static secret. Set it on the Convex deployment with `APPLE_CLIENT_ID`.
- Unique public `username` (`UserSlug`) at signup. Mint the passport row then.
- Google or Apple first login without a username opens the same dialog on the username field. Do not create a user without a `UserSlug`.
- Password login accepts email or username.
- Transactional email only: "your spot is live."
- Keep `AuthControl` mounted. `requestSignIn()` opens that dialog.

## Add a spot

The website has no add UI. The app creates a spot when a user publishes the first photo of a Place (`api.places.publish`). Extra photos stay in the app too.

- Sign-in is required in the app.
- Places autocomplete, then one Place Details call at confirm.
- Point-in-polygon sets the woonplaats from geo. Do not trust the page `{city}` slug as the board.
- Exactly one photo on create. Convex `_storage`. That write also inserts the first `photos` row.
- Duplicate Place ID on an existing spot attaches a gallery photo from the app.
- The Place is a breakfast or brunch tent on the honor system. No GPS required from the visitor.
- User can delete their own gallery photo later (AVG). Deleting the hero promotes the oldest remaining photo, or leaves the hero empty. Report hides pending owner review.
- No pre-moderation of every upload.
- The website gallery must show app photos. Do not add an extra-upload control on the website spot page.

## Likes

- Sign-in required to write.
- Table unique on `(userId, spotId)`.
- `likeCount` on the spot stays in sync in the same mutation, or is derived. The count on the spot page matches the woonplaats list.
- Signed-out click calls `requestSignIn()` and writes nothing.

**Credit.** The write that creates a like records `viaPhotoId`:

- A like from the gallery lightbox credits the photo in view. A like anywhere else (the spot hero, a board card) credits the hero photo.
- A visitor never credits their own photo. The like still counts for the spot.
- Unlike deletes the row, so the credit goes with it. A later like credits afresh.
- Deleting a photo clears its credit; the likes stay on the spot. No photo inherits it.
- Likes from before credit carry none. Do not backfill.

## Default stack

Empty repo: use this unless the human names another.

- Next.js App Router + TypeScript, **server-rendered** HTML for all public pages
- Convex
- Better Auth (Google, Apple, `emailAndPassword`)
- Google Places (autocomplete + Place Details as the add helper. Place ID, hours, types)
- i18n: `nl` + `en` message files; UGC never machine-translated
- Object storage for **in-app** spot photos only

Do not add a second framework. Do not ship a client-only SPA for public pages.

## Data (conceptual)

- `User`. brag.fast account, `UserSlug`, email
- `Spot`. place_id unique, slug, woonplaats slug, country=`nl`, types, hours, `closed_permanently`, `addedBy`, hero photo storage id, like count
- `Photo`. spot_id, storage id, uploaded_by, created_at, discovery (the photo that created the spot). Many per spot. Hero stays `Spot.photoId`.
- `Like`. user_id, spot_id, created_at, via_photo_id (optional credit). Unique `(user_id, spot_id)`
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
Ontbijt and brunch: say the pair where copy states what the site is (hero, meta titles and descriptions, board title and lead, SEO, llms.txt). Elsewhere talk about the **plek** or the **bord**, or use both verbs (*ontbijt of brunch je*, *ontbeten of gebruncht*). Never **ontbijt** or **breakfast** alone. The slogan is **Eerst de foto, dan de hap.** / **Photo first, then the bite.** (footer and App Store subtitle).  
Hashtag in UI: `#bragfast`.  
Homepage app-section and local-favorites headings: not frozen; owner rewrites later. Do not use **adder** in Dutch UI sentences. Disabled store buttons: **Coming soon**.  
Board empty: **Nog geen plekken in deze stad.** (`noSpotsYet`) plus `emptyBoardAppHint`.  
Closed: **Gesloten**.  
Leaderboard chrome (NL and EN): **Leaderboard**.  
How it works chrome: **Hoe het werkt**. English UI: **How it works**.  
Woonplaats index chrome: **Steden**. English UI: **Cities**.  
Signed-in header control: **Mijn profiel** dropdown to the passport and sign out. English UI: **My profile**. No email or display name in the header.  
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

5. **App first photo.** The website has no add UI. Haarlem shows `emptyBoardAppHint`. The app publishes the first photo through `api.places.publish` and that write creates the spot.  
   *Done:* Haarlem HTML includes `emptyBoardAppHint`. The website has no add UI.

6. **Likes.** One per session per spot. Signed-out click opens sign-in.  
   *Done:* the woonplaats list orders by like count. Counts match the spot page.

7. **Leaderboard.** `/nl/leaderboard` and the passport at `/u/{slug}`.  
   *Done:* two adders with different like sums appear in that order. A user with no spot and no earned like is absent.

8. **Homepage.** Local favorites from IP when the board has ≥3 photo spots; the app section; featured woonplaatsen gone.  
   *Done:* `/` HTML has no **Steden om te ontdekken**. A board under the 3-spot gate does not render the favorites block. The app section includes per-store **Coming soon** (disabled until that store URL exists).

## Out of scope reminders

If a task would require Stripe, TikTok login, submitting the app to a store, a comment thread, Google stars on the board, generating unique blog copy per spot, woonplaats type chips, Instagram, or magic link, stop and leave it out. Disabled **Coming soon** store badges on `/` are in scope; going live on App Store or Play is not a website task. Claim and type chips are v2. A v1 task that touches Stripe, Geclaimd, type chips, Instagram, or magic link is out of scope. Extra photos write from the app. The website gallery is in scope.

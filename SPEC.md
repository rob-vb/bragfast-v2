# brag.fast — agent spec

Read this before writing code. It is the product source of truth. UI copy is Dutch (English UI strings exist as a language switch on the same URLs). Code, slugs, and path segments are English.

If this file and the code disagree, this file wins until a human changes it.

## What you are building

A **website** (not a native app) that is the breakfast/brunch **directory** for the Netherlands: *where do I eat breakfast in city X*. The primary user is a seeker planning a weekend or already in town — TripAdvisor without the everything-else.

**Spots** (cafés, bakeries, lunchrooms, hotels that sell breakfast/brunch) are the unit. **Brags** (photo/video proof of a visit) are how spots climb. A live social feed is not the product.

The brand is English (`brag.fast`, hashtag `#bragfast`). The first market is NL because the owner lives there; more countries later via the same URL shape.

## Leading words

| Word | Meaning |
|------|---------|
| **Spot** | One hospitality venue, canonicalized by Google Place ID. |
| **City** | One Dutch **gemeente** board. The URL slug is the name people type (`den-bosch`, `zaandam`) when that is well-known, otherwise the gemeente name (`haarlemmermeer`, `westland`). Neighbourhoods and dorpen are not boards. Search aliases land on the canonical slug. |
| **Catalog** | All spots in NL. Seeded and maintained by Places. Does not rank. |
| **Seed** | A catalog spot with zero makers. Visible, not numbered. |
| **Brag** | Proof of a visit: in-app media *or* a social embed pointing at the original. |
| **Maker** | The identity that bragged. One maker = one vote per spot. Unconnected Instagram user id counts. Connecting merges identities. |
| **Board** | Numbered city ranking of spots that have ≥1 maker in the ranking window. |
| **Catalog tail** | Seed spots in a city (zero makers). They sit in the same city list as the board, without the egg. |
| **Passport** | Public profile of unique spots a linked brag.fast user has bragged. |
| **Claim** | Paid ownership of the spot page (v2). Tools and a conversion CTA, never rank. **Geclaimd** means someone is paying for that page, not that we verified the business. |

## v1 vs later

**Ship in v1**

- Crawlable site, NL catalog, city + spot + profile pages
- Homepage: search (city or spot), featured cities, near-me
- City page: one list of listed spots, egg on bragged spots, list default, map toggle
- Filters: open now, has brags
- Spot page: name, address, hours, 90-day rank + all-time maker count, brag feed
- In-app brag: signed-in, one photo or short video, replaceable, deletable, reportable
- Ranking: unique makers in 90 days; tie-break = most recent brag
- Auth: Better Auth with Google + magic email link
- Instagram connect: then auto-import `#bragfast` with a hard place tag
- Social posts: official embed + permalink; never host a copy of IG/TT/YT media
- Hard location tag → auto-attach + maker vote
- Caption-only → AI suggestion → owner moderation queue (not an auto vote)
- Public passport from first brag; bragger boards: unique spots (default) + posts this week
- Closed: dropped from lists, URL remains as a gravestone
- i18n: `nl` / `en` UI on the **same** URLs
- SEO: server-rendered HTML, JSON-LD `FoodEstablishment`, sitemap
- Admin: AI-match queue, reports, closed override

**Not v1**

- Native app, Stripe/claim (see **Claim (v2)** — do not implement until a v2 task names it), pay-to-rank, TikTok/YouTube OAuth
- Type chips (Café/lunch, Bakker, Hotel, Overig) — v2; `spotType` may exist in data, do not expose city filters until a v2 task
- User-add spot (signed-in Places autocomplete; hospitality/lodging go live, other types to owner queue) — v2; do not mount add-spot UI until a v2 task
- Likes, comments, followers, notifications beyond transactional email
- Cuisine taxonomy, guests-only hotel flag, AI-written spot articles
- ChatGPT-placement promises, national spot board, auto-AI matching (until the owner flips it)
- Apple login (add later on Better Auth)

The owner sets the “idea is working” bar. Do not block v1 on a metric.

## Hard rules

1. Discovery owns the product. Brags feed the board. Do not build a national live feed as the homepage.
2. Rank **spots**, not dishes. Person boards exist only as passport + weekly heat.
3. Catalog = NL. Board = gemeente. One GPS point, one board. URLs are country-prefixed for a future `/be/...`.
4. A brag is a vote. No star ratings. Do not surface Google rating as “best.”
5. One maker per spot. Many posts from the same maker appear in the feed; they still count as one vote.
6. Board numbers are earned. Seed never gets a rank number.
7. Host only media the user uploaded on brag.fast. Third-party UGC is embed + link to origin.
8. Claim (v2) is ownership and tools. Rank stays 100% makers. Paid extras are **additive** (CTA, official hero, Geclaimd mark). Unpaid pages keep the full brag feed and the same board rules. Owners cannot hide maker brags.
9. LLM pitch = public, factual, crawlable pages + schema for **every** spot. No generated brochure copy. No guaranteed chatbot mentions. Do not give claimed spots an exclusive machine layer (`llms.txt`, extra schema, “AI visibility”).
10. Browse signed-out. Sign-in for in-app brag, passport, Instagram connect. (v2: also add-spot.)

## URLs

```
/                         homepage
/nl                       NL home (same as / if NL-only chrome)
/nl/{city}                city page
/nl/{city}/{spot}         spot page
/nl/u/{slug}              public passport
```

- `{city}` and `{spot}` are English-safe slugs (e.g. `haarlem`, `de-bakkerswinkel`).
- `{city}` is the canonical gemeente slug. Well-known names that are not the CBS naam (`den-bosch`, `den-haag`, `zaandam`) are the slug. Other names people type (`hoofddorp`) are search aliases of the canonical page, not a second board.
- `/nl/` is **country**, not language. Language is a UI switch (cookie / `Accept-Language`, default Dutch).
- Do not clone the tree under `/en/...` in v1.
- Profiles with zero brags: noindex. After first brag: index.

## Ranking

**Spot board (city)**  
Score = count of distinct makers with a brag on that spot in the last **90 days**.  
Tie-break: timestamp of the most recent brag.  
Show all-time distinct makers on the spot page as a separate figure.

**When a brag counts for a spot**

- In-app: signed-in user + media + chosen spot → that user is the maker.
- Social with a **hard** place tag that resolves to this Place ID → maker = platform user id (Instagram in v1).
- Social with only a caption/city → **not** a spot vote until a human (owner queue) or later the linked author confirms.
- Same human on two platforms counts as two makers until they connect both to one brag.fast account; connect **merges**.

**Bragger boards** (signed-in, linked users only)

- Default: count of unique spots on the passport (all-time).
- Tab: count of posts in the current week (venue reach / heat).
- No third board in v1.

**Recency:** the 90-day window *is* the recency rule for spots. Do not add decay curves.

## What a spot is

In the catalog if a guest can **buy** breakfast or brunch there (café, bakery, lunchroom that opens for breakfast, hotel). Home kitchens and offices stay out. Fast food stays out: Places type `fast_food_restaurant`, plus a short name blocklist (McDonald’s, Burger King, KFC, Subway, FEBO, New York Pizza). Chains that serve breakfast as hospitality stay in (Anne&Max, Bagels & Beans, Van der Valk).

Generic Google type `restaurant` or `meal_takeaway` is not breakfast. Those stay out unless stored hours show at least one opening **before 11:00**. A café, bakery, coffee shop, `breakfast_restaurant`, or `brunch_restaurant` stays in when hours are unknown, and drops when hours never open before 11:00. Hotels stay even with dinner hours. Lunch-only and dinner restaurants (Loetje, bistros that open 11:30+) are not catalog.

**v2 user-add** (do not ship in v1): Place types that go live immediately: café, bakery, restaurant, meal_takeaway, lodging/hotel equivalents from Places. Petrol station, office, generic store → owner queue, not live.

Permanently closed (`business_status` CLOSED): strip from city lists and search; keep the page with a clear “Gesloten” state. Passport keeps it as history, not a recommendation. Temporarily closed follows opening hours, not gravestone.

## Pages

### Homepage

One sentence of what it is (breakfast/brunch spots per city). One search box (cities **and** spots from the catalog). Featured cities (prefer cities that already have makers; always include major NL cities). Secondary: near-me if geolocation is granted.

No nationwide brag ticker.

Search: catalog only. Exact spots first, then cities. Ambiguous tent names show city beside the name.

### City `/nl/{city}`

One list of listed spots in that city, sortable by name or distance.

Spots with ≥1 maker in 90 days wear the logo egg, top-right on the card. Seed spots have no egg and no rank number on this page. Rank numbers stay on the spot page.

Default view: list. Toggle: map.  
Chips in v1: Open nu · Met brags.  
v2 chips: Café/lunch · Bakker · Hotel · Overig (do not ship until a v2 task).  
“Met brags” shows only spots with the egg.

Visual distinction: egg vs none. Do not split the page into Board and “Nog niet gebragd”.

### Spot `/nl/{city}/{spot}`

Name, address, city, opening hours / open-now from Places.  
90-day rank in that city (or “nog niet op de board”). All-time maker count.  
Feed: newest first; in-app media + social embeds (click through to origin).  
Share URL. Report.  
If signed in: brag here (upload or confirm Instagram match).  
No menu, price, booking, phone-as-a-product in **v1** (optional tel link is fine). No comments/likes. v2 claimed spots may add one owner conversion CTA — see Claim (v2).

JSON-LD `FoodEstablishment` (or `Restaurant`/`Bakery`/`Hotel` when type is clear): name, address, geo, opening hours, url, image from a brag only when we have a license (in-app). Social embeds are not our images.

### Passport `/nl/u/{slug}`

Display name, avatar, unique-spot count, posts-this-week count, list/map of spots with that user’s brag. One-line bio optional. No follow. Create the public URL only after brag 1.

## Auth and identity

- **Better Auth**, v1 providers: Google, magic email link.
- Transactional email only: magic link, “your brag is live.”
- Instagram is **linking**, not the front door.
- v1 social link: **Instagram only**. After link: pull the user’s media with `#bragfast`; hard place tag auto-brags onto passport + spot; unmatched items go to that user’s optional match list (and owner AI queue if AI proposed a spot).

## In-app brag

- Sign-in required (we host the file).
- Exactly one photo or short video per brag; replace in place (still one vote).
- Honor system: meal and/or venue from that visit. No GPS required.
- User can delete (AVG). Report hides pending owner review.
- No pre-moderation of every upload.

## Social ingest

**Display:** platform embed + permalink. Do not download/rehost Instagram/TikTok/YouTube files. A disclaimer is not a license.

**YouTube:** Data API search for `#bragfast` + official embed is allowed. Do not cache video bytes.

**Instagram:** official APIs after App Review. Hashtag search is a **campaign** tool (`#bragfast`), not a scrape farm. Hashtag API coverage is mostly professional accounts; personal posters appear when they **connect**.

**Unconnected posts**

- Hard Place ID tag: show embed on that spot; count maker via IG user id.
- Otherwise: city-level teaser wall optional; **not** on a spot and **not** a vote. AI may suggest a spot; owner queue applies.

**Owner queue:** AI caption-matches only. Hard tags skip the queue. User reports always enter the queue. A future “auto-AI” flag stays off until the owner enables it.

## Catalog maintenance

Daily job is **hygiene**, not ranking: upsert by Place ID, refresh hours/address, mark closed, discover new breakfast/brunch hospitality across all Dutch gemeenten (~340). No LLM. Discovery Text Search uses `ontbijt` / `brunch` with included types café, bakery, hotel, `breakfast_restaurant`, `brunch_restaurant`, coffee shop. It does not search generic `restaurant`. The catalog gate is those breakfast types, plus the fast-food skip above. Generic `restaurant` / `meal_takeaway` enter only when hours already prove a morning open. Listed spots that fail the gate drop from city lists (same close path as listed fast food).

Place Details on the free Pro SKU omits `regularOpeningHours`. A recurring job fills `hours` on listed spots that are still null from OpenStreetMap `opening_hours` (Overpass around those pins). OSM never inserts a spot, never writes a Place ID, and never overwrites hours that already exist. If Places later sends hours, those win. Catch-up may run from the VPS because Overpass often throttles Convex cloud.

Each night mixes **discover** (new Place IDs) and **refresh** (oldest listed spots first). A city cursor stores the next **gemeente slug** and walks Dutch gemeenten **largest first** (CBS inwoners on 1 January; 20,000+ before the rest). Changing the walk order must resume at that slug — never restart at Amsterdam to save Place Details. Budget is finite (~200 Place Details per run, 4000/month). Text Search uses the gemeente bounding box. Point-in-polygon on CBS gemeente boundaries assigns `citySlug`. Google address components are fallback when a point misses every polygon.

Listed fast food found on refresh is dropped from lists. Permanently closed listed spots become gravestones.

## Default stack

Empty repo: use this unless the human names another.

- Next.js App Router + TypeScript, **server-rendered** HTML for all public pages
- Postgres
- Better Auth (Google, magic link)
- Google Places (Place ID, hours, types, photos only as Places-attributed place photos if used — still not a brag)
- i18n: `nl` + `en` message files; UGC never machine-translated
- Object storage for **in-app** brag media only

Do not add a second framework. Do not ship a client-only SPA for public pages.

## Data (conceptual)

- `User` — brag.fast account, slug, linked Instagram id(s)
- `Spot` — place_id unique, slug, city slug, country=`nl`, types, hours, `closed_permanently`, raw Places payload as needed
- `Brag` — spot_id, maker_key (`user:{id}` | `ig:{id}` | later other), source (`in_app` | `instagram` | `youtube_embed`), media (our file **or** embed permalink), created_at, replaced_at, hidden_at
- Unique constraint: one active brag **vote** per (maker_key, spot_id); extra posts from the same maker are feed rows that do not add votes (or store posts separately and derive the vote). Pick one model; keep the rule.
- `AiMatchQueue` — social post, proposed spot_id, status pending/approved/rejected
- `Report` — brag or spot, reason, status

Maker_key merge: when Instagram is linked, rewrite `ig:{id}` brags to `user:{id}` and collapse duplicate votes on the same spot to one.

## Claim (v2)

Do not implement until a task explicitly starts v2 claim. Stripe, claim UI, and Geclaimd marks stay out of v1.

The venue’s job is customers. Brags are the free etalage: good food → guests post proof → the spot page markets the tent. Claim is how brag.fast charges for **catching** that demand, not for existing on the board.

**Price:** €29 per spot per month, cancel anytime. One price, no Bronze/Gold, no yearly discount in the first paid version. A chain pays per location. One active claim per spot (first subscriber). Stop paying: conversion CTA, official hero, and Geclaimd marks disappear; the public page matches never-claimed.

**Additive only.** Unclaimed and claimed spots share the same board number, the same full brag feed, and the same crawl (HTML, JSON-LD, sitemap). A directory-wide `llms.txt` (if we add one) lists the catalog, not only paying tents. Do not throttle unpaid photos, do not exclusive-sort “most popular” for payers, do not sell ChatGPT placement.

**Owners cannot hide maker brags.** Report (spam, wrong place, illegal) stays the existing moderation path. Paid may add an owner-uploaded official hero on the spot page, labeled as the house, **beside** the feed — not instead of it.

**First paid SKU** (and nothing else until a later spec edit):

1. One conversion CTA on the **spot page only** (owner-pasted URL: reserve / order / website). Not on the city board, not on the map as a button.
2. Official hero (owner upload).
3. **Geclaimd** mark on the spot page, the city board, and the map.

Geclaimd means “this page has a paying owner,” not “we checked KvK” and not “this breakfast is better.” No identity-verification flow in this SKU; disputes are handled by the site owner out of band.

**Not in the first SKU:** signature dish, diet fields, replies to brags, analytics dashboard, exclusive LLM files, extra schema. Those need a spec change before anyone builds them.

**Seeker chrome:** the public spot page may show a small **Jouw zaak?** with no price. Pitch and Stripe live behind that link. Do not put €29 on the breakfast etalage.

## Copy (Dutch default)

Homepage one-liner: **Beste ontbijt- en brunchplekken, per stad.**  
Hashtag in UI: `#bragfast`.  
Board empty: the city list still shows seed spots.  
Closed: **Gesloten**.  
Open now: **Open nu**.  
Claim entry (v2): **Jouw zaak?**  
Claimed mark (v2): **Geclaimd**.

English UI translates chrome and our sentences only.

## Build order

Stop each step when the criterion is true. Do not start Instagram ingest before step 5 works.

1. **Shell** — Next.js, i18n nl/en, Better Auth Google + magic link, Postgres, layout.  
   *Done:* signed-in and signed-out both render; language switch keeps the URL.

2. **Catalog + public pages** — Spot/city ingest by Place ID; homepage search; city two-block page; spot page with hours; JSON-LD + sitemap. Gravestone for closed.  
   *Done:* a seeded city lists spots; `/nl/{city}/{spot}` is view-source HTML with schema; search finds city and spot.

3. **In-app brag + board** — upload, one-maker vote, 90-day numbering, egg on the city list, filters, map toggle, report/delete/replace.  
   *Done:* two users bragging the same spot still produce one numbered standing with two feed items; a third spot with no brags sits in the same city list without an egg.

4. **Passport + bragger boards** — slug, unique spots, weekly posts tab.  
   *Done:* `/nl/u/{slug}` shows after first brag; noindex before.

5. **Instagram + embeds + owner queue** — connect, hard-tag auto, caption AI to queue, embed-only display.  
   *Done:* a hard-tagged `#bragfast` post appears on the spot without our S3 copy; a caption-only post sits in the owner queue and does not change rank until approved.

6. **Polish** — near-me, featured cities, transactional “brag is live” email, admin reports/closed override.  
   *Done:* seeker can filter “open nu” + “met brags”; owner can hide a reported in-app brag.

## Out of scope reminders

If a task would require Stripe, TikTok login, a store listing, a comment thread, Google stars on the board, generating unique blog copy per spot, city type chips, or user-add spot — stop and leave it out. Claim, type chips, and user-add are v2; a v1 task that touches Stripe, Geclaimd, type chips, or add-spot UI is out of scope.

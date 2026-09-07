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
| **City** | The seeker’s query unit (Haarlem, not a neighbourhood). Board is always city-scoped. |
| **Catalog** | All spots in NL. Seeded and maintained by Places/scrape. Does not rank. |
| **Seed** | A catalog spot with zero makers. Visible, not numbered. |
| **Brag** | Proof of a visit: in-app media *or* a social embed pointing at the original. |
| **Maker** | The identity that bragged. One maker = one vote per spot. Unconnected Instagram user id counts. Connecting merges identities. |
| **Board** | Numbered city ranking of spots that have ≥1 maker in the ranking window. |
| **Catalog tail** | Unnumbered list of seed spots on the same city page, under the board. |
| **Passport** | Public profile of unique spots a linked brag.fast user has bragged. |
| **Claim** | Restaurant takes ownership of the spot page. v2. Never buys rank. |

## v1 vs later

**Ship in v1**

- Crawlable site, NL catalog, city + spot + profile pages
- Homepage: search (city or spot), featured cities, near-me
- City page: numbered board + catalog tail, list default, map toggle
- Filters: open now, has brags, type chips (Café/lunch, Bakker, Hotel, Overig)
- Spot page: name, address, hours, 90-day rank + all-time maker count, brag feed
- In-app brag: signed-in, one photo or short video, replaceable, deletable, reportable
- Ranking: unique makers in 90 days; tie-break = most recent brag
- Auth: Better Auth with Google + magic email link
- User-add spot: signed-in Places autocomplete, hospitality/lodging types go live
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

- Native app, Stripe/claim, pay-to-rank, TikTok/YouTube OAuth
- Likes, comments, followers, notifications beyond transactional email
- Cuisine taxonomy, guests-only hotel flag, AI-written spot articles
- ChatGPT-placement promises, national spot board, auto-AI matching (until the owner flips it)
- Apple login (add later on Better Auth)

The owner sets the “idea is working” bar. Do not block v1 on a metric.

## Hard rules

1. Discovery owns the product. Brags feed the board. Do not build a national live feed as the homepage.
2. Rank **spots**, not dishes. Person boards exist only as passport + weekly heat.
3. Catalog = NL. Board = city. URLs are country-prefixed for a future `/be/...`.
4. A brag is a vote. No star ratings. Do not surface Google rating as “best.”
5. One maker per spot. Many posts from the same maker appear in the feed; they still count as one vote.
6. Board numbers are earned. Seed never gets a rank number.
7. Host only media the user uploaded on brag.fast. Third-party UGC is embed + link to origin.
8. Claim (v2) is ownership and tools. Rank stays 100% makers.
9. LLM pitch = public, factual, crawlable pages + schema. No generated brochure copy. No guaranteed chatbot mentions.
10. Browse signed-out. Sign-in for in-app brag, add-spot, passport, Instagram connect.

## URLs

```
/                         homepage
/nl                       NL home (same as / if NL-only chrome)
/nl/{city}                city page
/nl/{city}/{spot}         spot page
/nl/u/{slug}              public passport
```

- `{city}` and `{spot}` are English-safe slugs (e.g. `haarlem`, `de-bakkerswinkel`).
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

In the catalog if a guest can **buy** breakfast or brunch there (café, bakery, lunchroom, hotel). Home kitchens and offices stay out. McDonald’s may exist; makers will rank it.

Place types allowed on user-add (live immediately): café, bakery, restaurant, meal_takeaway, lodging/hotel equivalents from Places. Petrol station, office, generic store → owner queue, not live.

Permanently closed (`business_status` CLOSED): strip from city lists and search; keep the page with a clear “Gesloten” state. Passport keeps it as history, not a recommendation. Temporarily closed follows opening hours, not gravestone.

## Pages

### Homepage

One sentence of what it is (breakfast/brunch spots per city). One search box (cities **and** spots from the catalog). Featured cities (prefer cities that already have makers; always include major NL cities). Secondary: near-me if geolocation is granted.

No nationwide brag ticker.

Search: catalog only. Exact spots first, then cities. Ambiguous tent names show city beside the name.

### City `/nl/{city}`

1. Numbered **board** — spots with ≥1 maker in 90 days.
2. **Catalog tail** — remaining spots in that city, unnumbered, sortable by distance or name.

Default view: list. Toggle: map.  
Chips: Open nu · Met brags · Café/lunch · Bakker · Hotel · Overig.  
“Met brags” shows only block 1.

Visual distinction: seed vs earned is the two-block split, not a fake #12 badge on seed.

### Spot `/nl/{city}/{spot}`

Name, address, city, opening hours / open-now from Places.  
90-day rank in that city (or “nog niet op de board”). All-time maker count.  
Feed: newest first; in-app media + social embeds (click through to origin).  
Share URL. Report.  
If signed in: brag here (upload or confirm Instagram match).  
No menu, price, booking, phone-as-a-product (optional tel link is fine). No comments/likes.

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

Daily/periodic job is **hygiene**, not ranking: upsert by Place ID, refresh hours/address, mark closed, discover new breakfast/brunch hospitality in NL cities. Initial fill: Places text search per city for breakfast/brunch. Grok/LLM may help classify “is this breakfast hospitality?” — it must not write board order.

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

## Copy (Dutch default)

Homepage one-liner: **Beste ontbijt- en brunchplekken, per stad.**  
Hashtag in UI: `#bragfast`.  
Board empty: catalog tail still shows.  
Seed block heading: **Nog niet gebragd**.  
Closed: **Gesloten**.  
Open now: **Open nu**.

English UI translates chrome and our sentences only.

## Build order

Stop each step when the criterion is true. Do not start Instagram ingest before step 5 works.

1. **Shell** — Next.js, i18n nl/en, Better Auth Google + magic link, Postgres, layout.  
   *Done:* signed-in and signed-out both render; language switch keeps the URL.

2. **Catalog + public pages** — Spot/city ingest by Place ID; homepage search; city two-block page; spot page with hours; JSON-LD + sitemap. Gravestone for closed.  
   *Done:* a seeded city lists spots; `/nl/{city}/{spot}` is view-source HTML with schema; search finds city and spot.

3. **In-app brag + board** — upload, one-maker vote, 90-day numbering, catalog tail, filters, map toggle, report/delete/replace, user-add via Places autocomplete.  
   *Done:* two users bragging the same spot still produce one numbered position with two feed items; a third spot with no brags sits unnumbered below.

4. **Passport + bragger boards** — slug, unique spots, weekly posts tab.  
   *Done:* `/nl/u/{slug}` shows after first brag; noindex before.

5. **Instagram + embeds + owner queue** — connect, hard-tag auto, caption AI to queue, embed-only display.  
   *Done:* a hard-tagged `#bragfast` post appears on the spot without our S3 copy; a caption-only post sits in the owner queue and does not change rank until approved.

6. **Polish** — near-me, type chips mapped from Places, featured cities, transactional “brag is live” email, admin reports/closed override.  
   *Done:* seeker can filter “open nu” + “met brags”; owner can hide a reported in-app brag.

## Out of scope reminders

If a task would require Stripe, TikTok login, a store listing, a comment thread, Google stars on the board, or generating unique blog copy per spot — stop and leave it out.

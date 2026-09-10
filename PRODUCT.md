# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is a seeker planning a weekend breakfast or already in a Dutch woonplaats, asking where to eat. Secondary users are adders who list a tent and upload one photo, visitors who like a spot after they sign in, and one owner who reviews reports and closed spots. Inferred from `SPEC.md`.

## Product Purpose

A crawlable breakfast and brunch directory for the Netherlands. Spots are the unit. Visitors add them. Likes are how spots climb a woonplaats board. Success is a seeker who can pick a place in a stad or dorp without treating Google stars as "best." Inferred from `SPEC.md`.

## Positioning

TripAdvisor without the everything-else. Rank is like count, not dishes, not stars, not paid placement. Empty woonplaatsen show an empty state until someone adds a tent. Adders climb `/nl/leaderboard` by likes on spots they added. Inferred from `SPEC.md`.

## Operating Context

Public pages are server-rendered Next.js on a VPS. The owner-facing preview is http://77.42.31.66/ (nginx → pm2 `next start` on 3002). Never localhost. UI changes are not live until `next build` and a pm2 restart. Data lives in Convex. Dutch is the default UI language on the same URLs as English. Brand is English (`brag.fast`, `#bragfast`). First market is NL. Owner lives there.

## Capabilities and Constraints

Specified in `SPEC.md`, not all shipped yet: woonplaats boards for every Dutch BAG woonplaats, visitor-add with Places autocomplete and one required photo, signed-in likes (one per spot), adder leaderboard, Better Auth Google + `emailAndPassword`.

Shipped in the current tree and still true until later PRs land: homepage search and featured cities, near-me, city list, map toggle, open-now filter, spot page with hours, sign-in chrome, admin reports.

Type chips (Café/Bakker/Hotel/Overig) were removed on purpose. Do not put them back.

Live Google Places autocomplete is live when `GOOGLE_PLACES_API_KEY` is set on the Convex deployment. Use it only as the add helper.

Not v1: native app, Stripe/claim, pay-to-rank, TikTok/YouTube OAuth, Instagram, magic link, maker votes, nightly Places crawl, comments, followers, cuisine taxonomy, AI spot articles, national spot board, Apple login.

Do not host third-party UGC. Do not invent Google ratings. Do not invent a nationwide ticker.

## Brand Commitments

Name: `brag.fast`. Hashtag: `#bragfast`. Homepage one-liner: **Ontbijt- en brunchplekken, per stad.** Empty board: **Nog geen plekken in deze stad.** Closed: **Gesloten**. Open now: **Open nu**.

User-pinned visual for this redesign: kawaii egg mascot, strawberry-milk header (`#ffe5f0`), white content, berry ink (`#4a1534`), blush/candy/yolk stickers, Bagel Fat One + Nunito, SVG lockup `/brag_fast_logo.svg`. Cocoa brown (`#3d1d09`) stays on the egg only, not on chrome, type, or footer.

## Evidence on Hand

Featured city rows and atmospheric breakfast stills used as city scenes must not be labeled as those cafés. Do not fabricate real venue photography or customer quotes. The live Haarlem catalog is leftover scrape data. Treat it as gone once the operator approves the wipe. Empty woonplaats pages are the intended board until visitors add tents.

## Product Principles

1. Discovery owns the product. Likes feed the woonplaats board. The homepage is not a national live feed.
2. Rank spots, not dishes. Board numbers are earned from likes.
3. Browse signed-out. Sign-in for add-spot, like, and passport identity. A signed-out like opens the sign-in dialog.
4. Host only media the user uploaded on brag.fast.
5. SPEC.md wins when it and the code disagree, until a human edits SPEC.md.

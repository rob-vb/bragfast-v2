# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is a seeker planning a weekend breakfast or already in a Dutch city, asking where to eat. Secondary users are makers who brag a visit, and one owner who reviews reports and closed spots. Inferred from `SPEC.md`.

## Product Purpose

A crawlable breakfast and brunch directory for the Netherlands. Spots are the unit. Brags (photo or video proof, or a social embed) are how spots climb a city board. Success is a seeker who can pick a place in a city without treating Google stars as "best." Inferred from `SPEC.md`.

## Positioning

TripAdvisor without the everything-else. Rank is unique makers in 90 days, not dishes, not stars, not paid placement. Seed spots with zero makers stay visible and unnumbered. Inferred from `SPEC.md`.

## Operating Context

Public pages are server-rendered Next.js on a VPS. The owner-facing preview is http://77.42.31.66/ (nginx → pm2 `next start` on 3002). Never localhost. UI changes are not live until `next build` and a pm2 restart. Catalog lives in Convex. Dutch is the default UI language on the same URLs as English. Brand is English (`brag.fast`, `#bragfast`). First market is NL. Owner lives there.

## Capabilities and Constraints

Shipped in the current tree: homepage search and featured cities, near-me, city board plus catalog tail, map toggle, open-now and has-brags filters, spot page with hours and brag feed, in-app brag, passport, admin queues, Instagram embed display, user-add write path.

Type chips (Café/Bakker/Hotel/Overig) were removed on purpose. Do not put them back.

Live Google Places autocomplete is live when `GOOGLE_PLACES_API_KEY` is set on the Convex deployment. Hygiene cron runs daily. Instagram connect is built (OAuth, #bragfast import, maker merge, disconnect, privacy + Meta data-deletion callback). It stays dark until `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` are set and Meta reviews the app. Redirect URI to register: `https://focused-deer-318.eu-west-1.convex.site/instagram/callback`. Privacy: `http://77.42.31.66/privacy`. Data deletion: `http://77.42.31.66/privacy/data-deletion`. Callback: `https://focused-deer-318.eu-west-1.convex.site/instagram/data-deletion`.

Not v1: native app, Stripe/claim, pay-to-rank, TikTok/YouTube OAuth, likes, comments, followers, cuisine taxonomy, AI spot articles, national spot board, Apple login.

Do not host third-party UGC. Do not invent Google ratings. Do not invent a nationwide brag ticker.

## Brand Commitments

Name: `brag.fast`. Hashtag: `#bragfast`. Homepage one-liner: **Ontbijt- en brunchplekken, per stad.** Seed heading: **Nog niet gebragd**. Closed: **Gesloten**. Open now: **Open nu**.

User-pinned visual for this redesign: kawaii egg mascot, strawberry-milk header (`#ffe5f0`), white content, berry ink (`#4a1534`), blush/candy/yolk stickers, Bagel Fat One + Nunito, SVG lockup `/brag_fast_logo.svg`. Cocoa brown (`#3d1d09`) stays on the egg only — not chrome, type, or footer.

## Evidence on Hand

Seeded Haarlem catalog (Anne&Max, STACH, Jopenkerk, and others), featured city rows, in-app brag photos when a maker uploaded them. Do not fabricate real venue photography or customer quotes. Atmospheric breakfast stills used as city scenes must not be labeled as those cafés.

## Product Principles

1. Discovery owns the product. Brags feed the board. The homepage is not a national live feed.
2. Rank spots, not dishes. Board numbers are earned.
3. Browse signed-out. Sign-in for brag, add-spot, passport, Instagram connect.
4. Host only media the user uploaded on brag.fast.
5. SPEC.md wins when it and the code disagree, until a human edits SPEC.md.

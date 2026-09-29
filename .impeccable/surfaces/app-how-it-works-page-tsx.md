---
version: 1
slug: "app-how-it-works-page-tsx"
primary_target: "app/how-it-works/page.tsx"
related_targets: []
---

# How it works (`/how-it-works`)

Scope: one chrome page, header and footer link here. Mode: Persuade. Seekers first (trust the order), then turn them into people who brag in the app. Demo pieces are made up and labelled Voorbeeld / Example; no live data, no links from demo names.

Constraints: SPEC.md truths only (likes rank, one like per person per spot, tie goes to the newest like, no stars, no pay-to-rank, app-only adds, stores Coming soon). NL and EN copy in `domain/messages.ts`.

## Direction contract

THESIS: How it works is four posters, Zoek, Brag, Like, Klim, each word set edge to edge with a working miniature of the page where that verb happens pressed onto it. It refuses the three-icon-cards-plus-FAQ explainer.

OWN-WORLD: DESIGN.md unchanged. Berry slabs alternate with milk and white grounds (hero berry, Zoek milk, Brag berry, Like white, Klim berry, rules white). One Bagel Fat One size runs through all four words: white on berry, berry on milk. White print slabs with the print cast, blush like pills, yolk/candy/mint podium steps, rubber-stamp ink, the egg.

STORY: Every town has a board, and likes set its order: no stars, no money. One photo in the app puts a spot there under your name. Likes on your spots move you up the leaderboard. The visitor searches a place, or waits for the app.

FIRST VIEWPORT: Berry slab under the milk header. Left: h1 "Hoe het werkt" at display size in white, then the lede "Eén foto zet een plek op de board. Likes bepalen de volgorde." Right: the four verbs stacked as tilted stickers (yolk, candy, mint, milk) that jump to their posters.

FORM: Four posters. Structure #7 on my list of 7, dealt as THE ROLL, seed 4eec1df3. Signature interaction: on the Like poster's demo board, tapping a heart re-sorts the prints with a view transition, and a tie goes to the newest like. Motion grammar: as each poster enters view it replays its page's own moment once. The dot map of 2503 woonplaatsen fills in and lights up under the search, the print lands, the heart pops and the board glides, the podium rises and the stamp presses.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

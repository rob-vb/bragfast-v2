---
name: brag.fast
description: Kawaii egg on strawberry milk. Berry ink, blush stickers, SVG lockup.
colors:
  berry: "#4a1534"
  milk: "#ffe5f0"
  shell: "#fff5f8"
  candy: "#ff9ebe"
  blush: "#fa715a"
  yolk: "#feb62a"
  mint: "#bfead3"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Bagel Fat One, Arial Rounded MT Bold, sans-serif"
    fontSize: "clamp(3rem, 10vw, 7rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "0.025em"
  headline:
    fontFamily: "Bagel Fat One, Arial Rounded MT Bold, sans-serif"
    fontSize: "clamp(2.4rem, 8vw, 5.5rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.025em"
  section:
    fontFamily: "Bagel Fat One, Arial Rounded MT Bold, sans-serif"
    fontSize: "clamp(1.875rem, 1.5rem + 1vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.025em"
  title:
    fontFamily: "Bagel Fat One, Arial Rounded MT Bold, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.025em"
  lede:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1rem + 0.6vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  script:
    fontFamily: "Bagel Fat One, Arial Rounded MT Bold, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  card: "28px"
  field: "16px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
  2xl: "40px"
  3xl: "56px"
  4xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.blush}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.berry}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.white}"
    textColor: "{colors.blush}"
  button-ghost:
    textColor: "{colors.berry}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.milk}"
  chip-candy:
    backgroundColor: "{colors.candy}"
    textColor: "{colors.berry}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  chip-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.berry}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  chip-yolk:
    backgroundColor: "{colors.yolk}"
    textColor: "{colors.berry}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  chip-active:
    backgroundColor: "{colors.blush}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  segment:
    backgroundColor: "{colors.white}"
    textColor: "{colors.berry}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px"
  segment-active:
    backgroundColor: "{colors.blush}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  search-pill:
    backgroundColor: "{colors.white}"
    textColor: "{colors.berry}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "64px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.berry}"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "48px"
  photo-card:
    textColor: "{colors.white}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "20px"
  panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.berry}"
    rounded: "{rounded.card}"
    padding: "20px"
  rank-sticker:
    backgroundColor: "{colors.yolk}"
    textColor: "{colors.berry}"
    typography: "{typography.title}"
    size: "2.5rem"
  stamp:
    backgroundColor: "{colors.candy}"
    textColor: "{colors.berry}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  nav-bar:
    backgroundColor: "{colors.milk}"
    textColor: "{colors.berry}"
    height: "64px"
    padding: "0 20px"
  footer:
    backgroundColor: "{colors.blush}"
    textColor: "{colors.berry}"
    typography: "{typography.section}"
    padding: "40px 20px"
---


# Design System: brag.fast

Every rule below is read off the shipped tree: tokens from `app/globals.css`, fonts from
`app/layout.tsx`, the rest from `components/` and `app/**/page.tsx`. When this file and the
code disagree, the code is the fact and this file is the bug.

## Overview

**Creative North Star: "Kawaii egg on strawberry milk."**

The home page opens inside a full-bleed breakfast still. Every other page — city, spot,
passport, leaderboard — opens on a **berry slab** (`bg-berry`, `#4a1534`) that the milk header
sits over. Only the spot page puts a photo behind its slab, at 45% opacity, so the berry still
reads as the ground. Chrome around either is strawberry milk, berry ink, blush and yolk
stickers. Cocoa brown lives on the egg SVG and nowhere else.

The header is pink milk at 85% with a backdrop blur. Content sits on white. Ink is berry —
never black, never cocoa, never indigo. Buttons and pressed segments are flat blush; nothing
in this system carries a CSS gradient. Density is generous and rounded: pills for anything
pressable, 28px slabs for anything that holds content.

Dutch is the default UI language. The brand is English (`brag.fast`, `#bragfast`).

**Key characteristics**

- Photo-first on home only. City, spot, passport and leaderboard heroes are berry slabs. The
  city slab is a poster: the woonplaats name set edge to edge, ending in a bakery-awning
  scallop.
- The wordmark is the SVG lockup `/brag_fast_logo.svg`, rendered through `<Logo>`. The mascot
  is `/brag_fast_egg.svg`, rendered through `<Egg>` in the footer and as the favicon. Neither
  is ever recreated in CSS.
- Two type voices: Bagel Fat One shouts names and `#bragfast`; Nunito carries body, labels
  and controls.
- Flat blush for primary buttons and pressed segments. White trays with a berry/12 hairline
  for the things they sit in.
- Spot cards are milk slabs holding an inset 4:3 photo print, the name in Bagel Fat One on the
  caption and the heart like pill beside it. No egg overlay, no rank badge.

## Colors

Eight tokens, all declared in `@theme` in `app/globals.css`. Berry is the ink; the photograph
supplies the warmth.

### Primary

- **Berry** (`{colors.berry}`, `#4a1534`): all text (`body { color }`), the hero slab on city,
  spot, passport and leaderboard, and selection background. At alpha it does the quiet work —
  `berry/70` for secondary text, `berry/12`–`berry/15` for hairlines, `berry/45` for a photo
  scrim.
- **Milk** (`{colors.milk}`, `#ffe5f0`): the header (at 85%, blurred), spot-card and
  leaderboard-row surfaces, ghost-button hover, and the selection foreground on berry.

### Secondary

- **Blush** (`{colors.blush}`, `#fa715a`): the action colour. Primary button fill, pressed
  segment, the footer band, the search icon, outline-button hover ink, Leaflet popups, and the
  stroke on a map marker.
- **Yolk** (`{colors.yolk}`, `#feb62a`): the attention colour. **Every focus ring in the app is
  2px yolk at 2px offset** — set once on `:focus-visible` in `globals.css` and repeated as
  `ring-yolk` on composite controls. Also the leaderboard rank circle, the empty-state icon
  disc, and map-marker fill.

### Tertiary

- **Shell** (`{colors.shell}`, `#fff5f8`): the quietest surface — empty-state wells and
  leaderboard-row hover.
- **Candy** (`{colors.candy}`, `#ff9ebe`): mixed 28% into milk for the Leaflet canvas.
- **Mint** (`{colors.mint}`, `#bfead3`): declared for the candy set; no component uses it
  today. Reach for it before inventing a ninth colour.

### White

Card interiors, outline-button fill, the search pill (at 92%), segmented and language trays,
and all display type set on a photograph or a berry slab.

### Named rules

**The Berry Ink Rule.** Text is berry, never `#000`. Berry at alpha tints hairlines and
secondary copy. It does not wash a photograph.

**The Yolk Focus Rule.** Focus is always yolk, always 2px, always offset 2px, on every ground.
Do not restyle a focus ring per component.

**The Flat Fill Rule.** No CSS gradient on a button, chip, tray or type face. Depth comes from
the shadow vocabulary below, not from a ramp.

**The Warm Inside the Frame Rule.** Warmth comes from the photograph and the candy set. Page
grounds are white, milk or shell. No beige, cream or maple surface exists here.

## Typography

**Display:** Bagel Fat One 400 (fallback Arial Rounded MT Bold, sans-serif), loaded in
`app/layout.tsx` as `--font-bagel` and exposed as `font-display`.
**Body:** Nunito 400/600/700/800 (fallback system-ui, sans-serif), `--font-nunito`, exposed as
`font-body` and set on `body`.
**Wordmark:** the SVG lockup `/brag_fast_logo.svg`. Not a font role.

**Character.** Bagel Fat One is a single-weight rounded fat face that shouts a name across a
photograph or a berry slab in solid white, and names a card in berry on milk. Nunito is the
calm counterweight that keeps addresses, hours and controls legible without competing. Two
voices, no third.

### Hierarchy

- **Poster** (Bagel Fat One, fitted, line-height 0.86, tracking 0.012em, white): the city name
  on a city hero, via `PageHeroPoster`. `lib/display-fit.ts` holds the face's advance widths
  and hands CSS the name's width in ems; `.poster-title` divides the hero's container width by
  it, so the name runs edge to edge between 2.25rem and 11.5rem. A long name breaks between
  words (and after hyphens) at up to 5.5rem instead of shrinking to one thin line.
- **Display** (Bagel Fat One, `clamp(3rem, 10vw, 7rem)`, line-height 0.92, tracking wide,
  white): `PageHeroTitle size="lg"`.
- **Headline** (Bagel Fat One, `clamp(2.4rem, 8vw, 5.5rem)`, white): spot, passport and
  leaderboard hero titles.
- **Home hero** (Bagel Fat One, `clamp(1.875rem, 6vw, 3.25rem)`, line-height 1.05, white with
  `text-shadow-photo`): deliberately smaller than a city name — the still is the loud thing.
- **Section** (Bagel Fat One, `text-3xl`→`text-4xl`, berry): section heads such as local
  favorites.
- **Card title** (Bagel Fat One, `text-2xl`, berry on the milk caption; the featured print
  steps to `text-3xl`/`text-4xl`).
- **Lede** (Nunito 600, `text-lg`, white on a hero, berry in content).
- **Body** (Nunito 400, 1rem, line-height 1.75, berry or berry/70).
- **Label** (Nunito 700, 0.875rem): buttons, segments, card meta, footer nav. Counts are
  `tabular-nums`.

### Named rules

**The Two Voices Rule.** Bagel Fat One shouts names and `#bragfast`. Everything else is Nunito.
There is no script face.

**The Painted Title Rule.** A title over a still or a berry slab is Bagel Fat One in solid
white; over a photo it also takes `text-shadow-photo`. Card names sit on the milk caption in
berry — never white on the still.

**The Photo-Copy Rule.** Legibility on a bright still comes from `text-shadow-photo`
(`0 1px 1px berry/40, 0 10px 28px berry/32`), never from a full-bleed overlay. The one
exception is the spot hero, where the photo runs at 45% behind the berry slab.

## Layout

The shell is `flex min-h-dvh flex-col`: header, page, footer, toaster.

Content columns are `max-w-6xl` with `px-5` / `sm:px-8` gutters; reading columns (spot body,
legal pages) narrow to `max-w-3xl`, and the search pill to `max-w-xl`.

Heroes pull up under the fixed-height header with `-mt-16` / `sm:-mt-[4.5rem]` and pad back
down with `pt-28`, so the header floats on the hero. Hero heights come from `PageHero`:
`board` 42svh, `poster` 46svh (city), `spot` 58svh; home is its own `92svh` section. The
hero's inner column is a size container, which is what the poster title measures.

Spot grids are `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`. The city board is a podium when
it is sorted by likes, descending, and its top spot has at least one like: that print spans
two columns (and two rows on `lg` once there are three spots), and the rest stack beside it.
Any other sort, or a board with no likes yet, is a plain grid of equal prints.

## Elevation & Depth

Four shadow tokens, all tinted — no grey or black drop shadows anywhere.

- **`shadow-lift`** (`0 8px 0 berry/12, 0 12px 24px berry/14`): the search pill. A hard berry
  foot plus a soft cast — the object sits on the page rather than floating above it.
- **`shadow-stamp`** (`inset 0 2px 0 white/55, 0 3px 0 blush/22`): the empty-state icon disc. An
  inset highlight plus a short blush foot reads as an enamel sticker.
- **`drop-shadow-sticker`** (a white 2px outline on four sides plus `0 6px 16px berry/22`): the
  hero lockup and the empty-board egg, so the SVG survives any ground behind it.
- **`.sticker`** (a 3px white die-cut ring plus a deep berry cast): the yolk count chip on the
  city poster, tilted -3deg, so it reads as a sticker pressed onto the slab.
- **Card lift**: a spot print rises 4px and takes `shadow-lift` on fine-pointer hover.
- **`shadow-rest`** and **`drop-shadow-burst`** are declared but unused. Leave them alone or
  delete them; do not invent a use.

**The Tinted Shadow Rule.** Every shadow is berry or blush at alpha. A grey or black shadow, or
a border standing in for elevation, is off-system.

## Shapes

Two silhouettes and one well.

- **Pill** (`rounded-full`): anything pressable — buttons, segments, the language switch, the
  search pill, the rank circle, the header lockup's focus target.
- **Slab** (`rounded-slab`, 28px): anything that holds content — spot cards, leaderboard rows,
  panels, empty wells.
- **Print** (20px): the photo inside a spot card. It is not a third silhouette but the slab's
  concentric inner radius (28px minus the 8px card padding).
- **Field** (`rounded-field`, 16px): text inputs and the combobox popup.

**The Pill or Slab Rule.** If a user can press it, it is a pill. If it holds content, it is a
slab. There is no third radius; a print inside a slab takes the slab's concentric radius.

**The Awning Edge.** The city poster ends in a row of berry scallops (`.scallop-edge`, a
repeat-`round` mask so the row always ends on a whole scallop). Only the city hero has it.

## Components

### Header

`bg-milk/85` with `backdrop-blur-md`, `h-16` / `sm:h-[4.5rem]`, `z-20`. Left: the `<Logo>`
lockup linked to `/` with `aria-label="brag.fast"`, then `#bragfast` in Bagel Fat One blush
(hidden on mobile). Right: chrome links, language switch, auth control.

### Footer

`bg-blush` with berry ink, `py-10`, its columns on the same `max-w-6xl px-5 sm:px-8` gutter as
the header. The egg at 56px rotated `-6deg`, the footer line in Bagel
Fat One `text-3xl`, `#bragfast` at `text-2xl`, then a wrapped nav of chrome and legal links in
Nunito 700.

### Buttons (`components/ui/button.tsx`)

`rounded-full`, Nunito 700 `text-sm`, `active:scale-[0.97]` over `duration-press`
(`ease-out-strong`), yolk focus ring with offset. Sizes: `sm` h-8, default h-10 px-5, `lg`
h-12, `icon` size-10.

- `default` — blush fill, white ink; hover brightens 110% on fine pointers only.
- `outline` — white fill, berry ink, `berry/15` hairline; hover turns border and ink blush.
- `ghost` — berry ink, milk on hover.

### Search pill

The hero's one control. `h-16`, `rounded-full`, white at 92% with a `white/40` hairline and
`shadow-lift`; blush search glyph, then the input, then a `sm` blush button. Focus is a
`ring-2 ring-yolk` on the whole group, not the bare input. The suggestion popup is anchored to
the pill with collision avoidance off, so it never flips above the fold.

### Spot card (`SpotLinkCard`)

An `<article>` milk slab with 8px padding holding a 4:3 photo print (20px radius, `candy/40`
while loading, a `berry/10` inset ring), scaling to 1.045 on fine-pointer hover while the slab
lifts. Under it, the name in Bagel Fat One `text-2xl` berry as an `h2`/`h3` link, and meta in
Nunito 600 `berry/70` (the city board shows the street line only; the woonplaats is already
the page). The link stretches over the whole slab with `::after`, which also carries the yolk
focus ring, so the optional action (the like pill) sits beside the name without nesting
controls. `featured` enlarges the title; the caller sizes the photo well. **No egg overlay and
no rank number on a card.**

### Like pill (`LikeButton`)

A `sm` pill: a blush Lucide heart and the count in `tabular-nums`, `outline` at rest, flat
blush with a filled white heart when liked. The accessible name stays "Leuk, N likes". The
hit area extends 6px past the pill to 44px. Toggling is optimistic, and a new like pops the
heart once (`.like-pop`). Signed out, it opens sign-in and writes nothing.

### Segmented control and language switch

A white tray, `rounded-full`, `p-0.5`, `border-berry/12`. Keys are pills using the `candy-key`
utility; the active one is blush with white ink via `aria-current` (segments) or
`aria-pressed` (language). The language switch carries flag marks and `role="group"`.

### Selects

shadcn primitives in the `base-vega` style (Base UI, not Radix) from `components/ui/`. The city
board uses two `sm` triggers — sort key and direction — and they mount only when the board has
spots.

### Rank

Rank exists **only on the leaderboard**: a `size-10` yolk circle with the position in Bagel Fat
One `tabular-nums`, at the head of a milk `rounded-slab` row that turns shell on hover. No
burst, no zero-padding, no rank on spot cards or city tiles.

### City poster (`app/nl/[city]/page.tsx`)

The `poster` `PageHero` with the scallop edge: `PageHeroPoster` for the name, then a row with
the yolk `.sticker` count ("3 plekken") and a milk lede ("Ontbijt en brunch, op volgorde van
likes."). An empty board shows the name alone. Below the scallop, the toolbar puts the sort
selects (list view only) left and the Lijst/Kaart segment right, icons plus labels, labels
screen-reader-only under `sm`.

### Empty states (`BoardEmpty`)

A shell well with a milk hairline, `max-w-xl`, `py-14`: a yolk `size-12` disc carrying a blush
Lucide glyph with `shadow-stamp`, then a bold berry title and optional `berry/70` description.
An empty board is a designed state, not a failure — it is the intended look of a woonplaats
nobody has photographed yet. The empty city board swaps the disc for the egg (76px, -8deg,
`drop-shadow-sticker`) and sets the title in Bagel Fat One.

### Photo frame

`PhotoFrame` is absolute-inset `object-cover`. With `ken`, it runs `hero-ken` — a 22s
scale 1.04 → 1.14 alternating drift, disabled under `prefers-reduced-motion`. Used full-bleed
on the home hero and at `opacity-45` behind the spot hero.

### Map

Leaflet, client-only. The canvas is candy mixed 28% into milk; popups and their tips are blush
with berry ink and bold berry links; markers are yolk fill at 90% with a blush stroke. Map view
is a URL (`?view=map`), so it is a link, not a toggle.

### Toast

`components/ui/toast.tsx`, mounted once in the root layout.

## Motion

Three durations and three easings, all tokens:

- `duration-press` 160ms — presses, hovers, segment changes.
- `duration-popover` 180ms — combobox, select, menu.
- `duration-modal` 220ms — dialog and drawer.
- `ease-out-strong` for arrivals and presses, `ease-in-out-strong` for symmetric moves,
  `ease-drawer` for sheets.
- `ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`), a single overshoot, for exactly two
  sticker moments: the poster letters landing and the like heart popping. Nothing else
  springs.

**The city page's one authored moment** is the poster name: each letter lands from a small
drop and tilt with a 34ms stagger (`.poster-letter`), starting from a visible 20% opacity. The
heading keeps the plain name as its `aria-label` and text. Re-sorting the board runs the state
change inside `document.startViewTransition`, with each card named `spot-{slug}`, so prints
glide to their new places and the podium print morphs; new snapshots are solid from the first
frame and old ones clear in 140ms.

Press feedback is uniform: `active:scale-[0.97]`. Hover effects are gated behind the
`pointer-fine` variant so a touch device never sticks in a hover state. Under
`prefers-reduced-motion` the ken-burns, poster letters, like pop and sort glide stop, and every
popup transition falls back to opacity with transforms removed.

## Do's and Don'ts

### Do

- **Do** open home with a full-bleed still under the milk header, copy bottom-left in white
  with `text-shadow-photo`.
- **Do** give city, spot, passport and leaderboard a berry `PageHero` slab — with a photo
  backdrop at 45% only on spot.
- **Do** use `<Logo>` (`/brag_fast_logo.svg`) in the header and hero, and `<Egg>` in the footer
  and favicon.
- **Do** use flat blush for primary buttons and the pressed segment.
- **Do** make anything pressable a pill and anything holding content a 28px slab.
- **Do** keep every focus ring 2px yolk at offset 2.
- **Do** put card names in Bagel Fat One berry on the milk caption.
- **Do** reach for `components/ui/*` before writing a primitive; add missing ones with
  `npx shadcn@latest add` and restyle to this palette.
- **Do** gate hover behind `pointer-fine` and honour `prefers-reduced-motion`.

### Don't

- **Don't** reintroduce indigo, foam, flare, citrus, sun or sky — those tokens are retired and
  do not exist in `globals.css`.
- **Don't** set type in Lilita One, Pacifico or Figtree, or use the painted `/wordmark.png`.
  The lockup is the SVG.
- **Don't** recreate the lockup or the egg with CSS gradient text.
- **Don't** put a CSS gradient on a button, chip, tray or type face.
- **Don't** use `#000` for text or a grey/black drop shadow; ink is berry and shadows are
  tinted.
- **Don't** wash a hero with a full-bleed overlay — use `text-shadow-photo`.
- **Don't** put white type on a spot card still; names sit on the milk caption.
- **Don't** draw board rank as a burst, and don't put rank or the egg on a spot card.
- **Don't** add type chips (Café / Bakker / Hotel / Overig) — they were removed on purpose.
- **Don't** split a city page into a board and a "Nog niet gebragd" tail.
- **Don't** put a small uppercase kicker above a headline.
- **Don't** give a card a "most liked" stamp or number; the podium print's size is the only
  rank signal on the city board.

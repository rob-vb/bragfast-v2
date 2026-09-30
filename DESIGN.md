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
    lineHeight: 0.92
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
  spot-card:
    backgroundColor: "{colors.milk}"
    textColor: "{colors.berry}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "8px"
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
passport, leaderboard, how it works — opens on a **berry slab** (`bg-berry`, `#4a1534`) that the milk header
sits over. The spot slab carries the adder's photo as a tilted print instead of a backdrop,
and the print's own light pools softly around it, so the berry still reads as the ground. Chrome around either is strawberry milk, berry ink, blush and yolk
stickers. Cocoa brown lives on the egg SVG and nowhere else.

The header is an opaque strawberry-milk band that lifts into a milk pill once the page scrolls. Content sits on white. Ink is berry —
never black, never cocoa, never indigo. Buttons and pressed segments are flat blush; nothing
in this system carries a CSS gradient. Density is generous and rounded: pills for anything
pressable, 28px slabs for anything that holds content.

Dutch is the default UI language. The brand is English (`brag.fast`, `#bragfast`).

**Key characteristics**

- Photo-first on home only. City, spot, passport and leaderboard heroes are berry slabs. The
  city slab is a poster: the woonplaats name set edge to edge, ending in a bakery-awning
  scallop. The spot slab holds the brag print, which hangs over the slab's bottom edge. The
  passport slab carries the adder's woonplaatsen as rubber stamps; the leaderboard slab is a
  stage whose podium stands on its floor. The how-it-works slab carries the four verbs as
  tilted stickers that jump to four verb posters below it, each poster alternating berry,
  milk and white grounds.
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
  spot, passport, leaderboard and how it works, and selection background. At alpha it does the quiet work —
  `berry/70` for secondary text, `berry/12`–`berry/15` for hairlines, `berry/45` for a photo
  scrim.
- **Milk** (`{colors.milk}`, `#ffe5f0`): the header band and its lifted pill (always opaque), spot-card and
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
- **Candy** (`{colors.candy}`, `#ff9ebe`): the second podium step, a passport stamp ink, the
  heart on a white/12 like pill, the **Gesloten** and **Voorbeeld** stickers, the photo well
  while a print loads (at 40%), and the Leaflet canvas (28% into milk).
- **Mint** (`{colors.mint}`, `#bfead3`): the third podium step, a passport stamp ink, and the
  Like sticker in the how-it-works hero. Reach for it before inventing a ninth colour.

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
- **Spot poster** (`PageHeroPoster fit="spot"`, `.poster-title--spot`): the spot name, fitted
  to the text column beside the print between 2.5rem and 7rem, line-height 0.92. A name that
  fits one line big takes it; a long one takes its most even two-line break (`--fit-pair`)
  at up to 4.5rem. Its letters do not land; the print is the spot page's moment.
- **Handle** (`PageHeroPoster fit="handle"`): the passport's username behind a blush `@`,
  sized like the spot poster to the column beside the stamps. `lib/display-fit.ts` carries
  digits, `@` and `#` so a handle measures true.
- **Verb poster** (`.verb-word`, Bagel Fat One, fitted, line-height 0.8, tracking 0.012em):
  the four verbs on how it works (Zoek, Brag, Like, Klim). All four share one size:
  `verbFit()` takes the widest verb's `displayFit` line width for the locale, and every
  poster divides 98% of its `max-w-6xl` container width by it, capped at 30rem. White on a
  berry poster, berry on milk or white.
- **Display** (Bagel Fat One, `clamp(3rem, 10vw, 7rem)`, line-height 0.92, tracking wide,
  white): `PageHeroTitle size="lg"`.
- **Headline** (Bagel Fat One, `clamp(2.4rem, 8vw, 5.5rem)`, white): hero titles that are
  neither a name nor a poster. The leaderboard title is Display (`PageHeroTitle size="lg"`).
- **Home hero** (Bagel Fat One, fitted, line-height 1, tracking 0.012em): fitted like a poster
  but capped below a city name — the still is the loud thing. `.hero-title` is
  `min(96cqi / --fit-word, clamp(2.5rem, 1.6rem + 4.4vw, 5.25rem))`, where `--fit-word` is the
  lead's widest word from `lib/display-fit.ts`, so no word breaks the column. Line-height is 1,
  looser than a city name, because this title has descenders. The copy splits at its last
  `, `: the lead is painted in white with `text-shadow-photo` (`max-width: 11em`, balanced
  wrap), and the tag after the comma is a yolk `.sticker` pill in berry ink at 0.86em, tilted
  -3deg. Copy without a comma is all paint and no sticker. The heading keeps the whole line
  as its `aria-label`.
- **Home lede** (Nunito 600, `clamp(1.0625rem, 0.95rem + 0.4vw, 1.25rem)`, line-height 1.5,
  white with `text-shadow-photo-copy`, `max-w-xl`, pretty wrap): the intro under the home
  title.
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
(`0 1px 1px berry/40, 0 10px 28px berry/32`) on Bagel titles and `text-shadow-photo-copy`
(`0 1px 1px berry/55, 0 2px 10px berry/55, 0 8px 28px berry/40`) on Nunito copy, never from a
full-bleed overlay. No title sits
on a photo outside home: the spot name sits on flat berry beside its print.

## Layout

The shell is `flex min-h-dvh flex-col`: header, page, footer, toaster.

Content columns are `max-w-6xl` with `px-5` / `sm:px-8` gutters; reading columns (spot body,
legal pages) narrow to `max-w-3xl`, and the search pill to `max-w-xl`.

Heroes pull up under the sticky header with `-mt-16` / `sm:-mt-[4.5rem]` and pad back
down with `pt-28`, so the header floats on the hero. `html` carries `scroll-padding-top: 5rem`
so focus and anchors land clear of the header; the how-it-works verb posters cancel it
(`-scroll-mt-20`) because their own top padding already clears it, and the house-rules column
sticks at `lg:top-28`. Hero heights come from `PageHero`:
`board` 42svh, `poster` 46svh (city), `spot` 58svh; home is its own `92svh` section, clipped,
with its copy column bottom-aligned (`pb-12` / `md:pb-20`). The hero's inner column is a size
container, which is what the poster title and the home title measure.

The spot page runs a 7/5 split on `lg`: name, address and actions left; the print right,
hanging 152px (lg) / 96px (mobile) below the slab. Under the slab the same split holds the
gallery left and **Zo kom je er** right, the right column padded to clear the print. **Meer
in {woonplaats}** runs full width below both.

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
  city poster, tilted -3deg, so it reads as a sticker pressed onto the slab. The home title's
  tag is the same sticker at display size: its die-cut scales as `max(3px, 0.05em)`, its cast
  as `0 0.16em 0.3em` deep-berry/35, and it carries the step-enamel lip in ems
  (`inset 0 0.06em 0 white/45`).
- **Photo text shadows** (`text-shadow-photo`, `text-shadow-photo-copy`): type on the home
  still. The copy shadow is tighter and denser because Nunito's strokes are thinner than
  Bagel's; it carries the home lede. There is no shade, scrim or overlay on the
  hero.
- **Card lift**: a spot print rises 4px and takes `shadow-lift` on fine-pointer hover.
- **Print cast** (`.brag-print`: `0 1px 0 berry/6, 0 3px 0 deep-berry/12, 0 24px 48px -12px
  deep-berry/55`, where deep berry is `rgb(22 4 14)`, the `.sticker` cast): the spot hero print,
  so it reads as paper lying on the slab and, where it hangs, on the white page.
- **Step enamel** (`inset 0 3px 0 white/45`): the top lip of a filled podium step, the same
  highlight `shadow-stamp` puts on a sticker, with no cast because the step stands on the
  floor.
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

`HeaderShell` (`components/header-shell.tsx`): `sticky top-0 z-30`, `h-16` / `sm:h-[4.5rem]`.
Every control in the row is 40px tall. The milk is its own layer (`.header-milk`), so the row
never moves when the milk does.

- **At the top** the milk is an opaque full-bleed band of `#ffe5f0`. It is never see-through:
  milk at any alpha over a berry slab turns mauve.
- **Once the page has scrolled 40px** (an `IntersectionObserver` on a sentinel, no scroll
  listener) the band lifts off into a pill on the content column: 4px (phone) / 8px (`sm`)
  from the top, its ends 8px outside the row so the lockup's egg and the last pill nest in its
  curves, radius 2rem, a white inset lip, a `berry/6` hairline, a short `berry/7` foot and a
  soft `berry/34` cast. The geometry glides over 560ms `ease-out-strong` and reverses at the
  top. The page shows around the pill.
- **Lockup.** `<HeaderLockup>` (`components/visual.tsx`) shows `/brag_fast_logo.svg` twice,
  one copy clipped to the wordmark and one to the egg, so the egg rocks -11deg on its base on
  fine-pointer hover. One file, one fetch; the lockup is never redrawn.
- **`#bragfast`** from `xl`: a candy sticker (Bagel Fat One berry, 2px white die-cut, enamel
  lip, deep-berry cast, -4deg) pressed onto the band. It peels off (scale 0.5, -22deg, fading)
  when the band lifts and is pressed back on at the top.
- **Page links** (`HeaderNav`, from `lg`): **Hoe het werkt**, **Woonplaatsen** and
  **Leaderboard** from `chromeLinks("header")`, as Nunito 700 `h-10` pills in `berry/70`, the current
  page in full berry. One white pill (`.nav-pill`) rests on the current page and glides to
  whichever link the mouse is over (420ms `ease-out-strong`, width and position), fading out
  in place when nothing is current or hovered. Arriving from nowhere it appears in place
  rather than sliding in. The owner's **Beheer** joins the row.
- A `berry/15` hairline, 20px tall, separates the links from the utilities.
- **Language switch** in its `bar` variant (see below), then the auth control: signed out a
  default blush **Inloggen**; signed in a white `h-10` pill with a berry/12 hairline holding a
  yolk initial disc (Bagel Fat One, `shadow-stamp`), **Mijn profiel**, and a chevron
  that turns over while the menu is open. The account menu is a white slab padded 6px with
  `h-10` pill rows that turn milk when highlighted.

Below `lg` the right side is one **Menu** pill (`components/mobile-menu.tsx`): white, `h-10`,
`berry/12` hairline, a Lucide menu glyph and the word, its hit area grown 4px. It raises a
bottom sheet (Base UI Drawer, swipe down to dismiss) shaped like the phone sign-in dialog: a
white slab floating 12px from the edges over a `berry/45` blurred backdrop, rising over
`duration-modal` on `ease-drawer`. Inside: a `berry/15` handle; the egg (44px, -8deg,
`drop-shadow-sticker`) dropping in beside **Menu** in Bagel Fat One with a ghost close key;
every page from `chromeLinks("menu")` (plus **Beheer** for the owner) as a `h-16` milk pill,
the name in Bagel Fat One `text-2xl` and a 48px white disc with a blush arrow 8px inside its
end, candy/45 on hover and yolk for the current page; then a shell well holding the account
(signed out: a full-width blush **Inloggen**; signed in: `@username` with a blush `@`, an
outline **Paspoort** pill and a ghost **Uitloggen**) above the language switch. The header's
AuthControl stays mounted but hidden below `lg` and still owns the sign-in dialog; the sheet's
**Inloggen** closes the sheet and asks for sign-in once it is gone. Following a link closes the
sheet, and so does any route change.

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
`shadow-lift`; blush search glyph, then the input, then a blush `h-12` key (`px-6`,
`text-base`), which sits 8px inside the pill on every side so the radii stay concentric. On
phones (under `sm`) the leading glyph hides, the pill pads 24px left, and the key is a 48px
blush circle holding a Lucide search glyph with its label screen-reader-only, so the
placeholder keeps its line; the input ellipsizes a placeholder that still overflows. Focus is a
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
`aria-pressed` (language). The language switch carries flag marks and `role="group"`. The
Menu sheet uses the default `tray` variant (rectangular flags). The header uses `bar`: a 40px
tray (`p-[3px]`) whose flags are cut to 20px coins; the pressed coin takes a 2px white
die-cut on the blush key, so it reads as a sticker on a key rather than a rectangle on a disc.
Its keys use the global yolk focus outline.

### Selects

shadcn primitives in the `base-vega` style (Base UI, not Radix) from `components/ui/`. The city
board uses two `sm` triggers — sort key and direction — and they mount only when the board has
spots.

### Rank

Rank exists **only on the leaderboard**, and as the passport's pill that links there (a
white/12 pill with a yolk Lucide trophy: "#2 op de leaderboard"). No burst, no zero-padding,
no rank on spot cards or city tiles.

### Podium (`components/podium.tsx`)

The leaderboard's first three stand on a podium on the berry slab's floor: second left, first
centre, third right (the DOM stays 1, 2, 3). Steps are `rounded-t-slab` with step enamel, first
yolk, second candy, third mint, the place in Bagel Fat One berry. Over each step: the
`@username` (blush `@`) fitted to the step's width by its widest unbreakable chunk
(`.podium-name`, up to three lines), a white/12 like pill with a candy heart, and the spot
count in `milk/70`. The egg sits over first place. A place nobody holds is an open step: a
dashed `white/22` outline, the number at `white/25`, and **Nog vrij** above it. The whole
column is the link to the passport; hover tilts the step's number.

### Leaderboard rows

Fourth place down: a milk `rounded-slab` row that turns shell on hover, the `size-10` yolk rank
circle, the `@username` in Bagel Fat One over the spot count, a like bar (a white track with a
blush fill at the adder's share of the leader's likes, from `sm`, absent at zero likes), and
the like count with a blush heart. Below the rows, **Zo klim je** in a shell well with the egg;
on an empty board the well's title is the empty copy. Store keys join it only once a store is
live.

### Passport stamps (`components/passport-stamps.tsx`)

One rubber stamp per woonplaats, in the order the adder first bragged there (`passportStamps`
in `domain/passport.ts`). A stamp is an inline SVG in a single ink: a heavy outer ring and a
fine inner ring, the woonplaats in Bagel Fat One capitals on a 240° arc over the top (sized to
fit the arc), the first-brag date in Nunito 800 capitals along the bottom, a dot where they
meet, and the count with its noun inside. The `#stamp-ink` filter knocks grain out of the
fill and warps the edge a little so it reads as ink, not vector. Inks cycle yolk, mint,
candy, milk, blush at 94%; tilts alternate; every other stamp drops 22% and they overlap like
a filled passport page. Two stamps sit side by side at 12.5rem on `lg`; three or more pack
three to a row at 9.25rem. Past six, the last stamp reads `#bragfast` / `+N steden`. Each
stamp links to its board, and hover or keyboard focus straightens it and scales it 1.06.

### City poster (`app/nl/[city]/page.tsx`)

The `poster` `PageHero` with the scallop edge: `PageHeroPoster` for the name, then a row with
the yolk `.sticker` count ("3 plekken") and a milk lede ("Ontbijt en brunch, op volgorde van
likes."). An empty board shows the name alone. Below the scallop, the toolbar puts the sort
selects (list view only) left and the Lijst/Kaart segment right, icons plus labels, labels
screen-reader-only under `sm`.

### Empty states (`BoardEmpty`, `EggEmpty`)

A shell well with a milk hairline, `max-w-xl`, `py-14`: a yolk `size-12` disc carrying a blush
Lucide glyph with `shadow-stamp`, then a bold berry title and optional `berry/70` description.
An empty board is a designed state, not a failure — it is the intended look of a woonplaats
nobody has photographed yet. `EggEmpty` swaps the disc for the egg (76px, -8deg,
`drop-shadow-sticker`) and sets the title in Bagel Fat One; the empty city board and the empty
passport use it.

### Spot print (`components/spot-print.tsx`)

The adder's photo as a white slab (`rounded-slab`, 8px pad, 10px on `lg`) holding a 4:3 photo
at the concentric inner radius, tilted -2deg (mobile) / 2.5deg (`lg`), with the print cast.
Its lip is a `figcaption`: "Ontdekt door" in Nunito 700 `text-xs` `berry/70` over the adder's
`@username` in Bagel Fat One berry with a blush `@`, linked to the passport, and the add date
right-aligned in `tabular-nums`. A spot whose adder has no passport captions `#bragfast` in
blush instead. Closed spots desaturate the photo to 10% and show a candy `.sticker` **Gesloten**
beside the name. `PrintGlow` renders the same photo blurred 72px at 50% with `screen` blend,
masked to a soft pool around the print; it is light, not a wash.

### Spot gallery (`components/spot-photos.tsx`)

**Foto's** with the count in Nunito 800 `berry/50`. A two-column grid of square prints (milk
slab, 8px pad, 20px photo) that lift like spot cards on hover and open the lightbox. The
last cell is the app slot: a shell well with a 2px dashed candy border, the yolk camera disc
with `shadow-stamp`, and the app-row copy; it spans both columns when it would sit alone.
Your own photo carries a white trash pill that arms on the first press ("Echt wissen?", blush)
and deletes on the second, disarming after 4s or on blur.

The lightbox is a Base UI dialog over `berry/94` with a blur: counter top-left, white/12 pill
controls, the photo `object-contain` at the 20px radius, and the uploader's `@username` and
date below. Arrow keys and a 48px swipe page through; arrows sit at the sides from `sm` and in
the caption row below it.

### Location slab (`components/spot-location.tsx`)

A milk slab holding a still Leaflet print (no pan, zoom or keyboard, so it never traps a
scrolling thumb) with the egg at 52px on the door, then the street in Bagel Fat One `text-2xl`,
the postcode line in `berry/70`, and a blush **Route** button to Google Maps directions. Leaflet
loads only when the slab is within 320px of the viewport; until then the well is the candy
canvas with the egg centred. `.spot-map` isolates its stacking context so Leaflet's pane
z-indexes never paint over a dialog.

### Board tile

The last cell of **Meer in {woonplaats}**: a berry slab linking to the board, with up to three
of the board's photos fanned top-right (3px white die-cut, deep-berry cast, ±8deg, opening to
±12deg on hover), the yolk count `.sticker`, `seeAllInCity` in Bagel Fat One, and a blush
arrow disc. Neighbour spots before it are ordinary `SpotLinkCard`s, at most two.

### How-it-works page (`app/how-it-works/page.tsx`, `components/how-it-works.tsx`)

The page is four verb posters between a berry hero and a milk close. Grounds run hero berry,
Zoek milk, Brag berry, Like white, Klim berry, house rules white, close milk. Every demo
piece that shows made-up data wears a candy **Voorbeeld** label (a `.sticker` pill on the
print and the podium, a plain candy chip under the example board).

- **Hero.** The default `board` `PageHero`: `PageHeroTitle size="lg"` and a milk lede on the
  left seven columns; on the right, `VerbStickers`, a `nav` list of the four verbs as
  `.sticker` pills in yolk, candy, mint and milk, Bagel Fat One berry (`text-2xl` →
  `text-5xl` on `lg`), each ending in a `white/70` disc with a Lucide arrow-down. Each is
  tilted (-6, 4, -3, 6deg); on `lg` they stack and every other one steps in 4rem. Hover
  (fine pointer) or focus straightens a sticker and scales it 1.05 over 360ms.
- **Verb poster** (`VerbPoster`). A full-width section on its ground, a `max-w-6xl`
  `@container` column padded `pt-16`/`sm:pt-24` and `pb-20`/`sm:pb-28`, the verb as the
  section's `h2`, then the working piece 2–2.5rem under it. `floor` drops the bottom
  padding so the piece stands on the poster's edge; `backdrop` puts something behind the
  column.
- **Zoek: town map and search** (`TownSearch`). The real `SearchBox` pill (its
  `onQueryChange` feeds the map) with a `berry/70` note under it, beside a dot map of every
  woonplaats: one round 8-unit berry/35 dot per board at its own lat/lng, in an
  equirectangular frame squeezed by cos 52°. A yolk `.sticker` count ("2.503 plaatsen")
  sits on the map's top-left at -3deg. The pin is a yolk dot in a 3px white die-cut with a
  blush/45 ring pulsing out of it and the name on a berry pill above. Typing dims the country
  to berry/16 and draws every hit in 13-unit blush; the pin follows the active suggestion.
  Nobody typing, the pin tours eight boards, big and small, every 2.6s.
- **Brag: demo print** (`DemoPrint`). A `.brag-print` at -3deg with the spot print's
  caption ("Ontdekt door" over `@handle`, "vandaag" right), pulled up into the verb on `lg`.
  `PrintGlow at="28% 72%"` pools its light behind it on the berry. Beside it, the body and
  `BragFacts`: three milk lines, each behind a `white/12` disc holding a yolk Lucide glyph.
  The store buttons hang under the print on `lg` and follow the copy on mobile.
- **Like: example board** (`LikeDemo`). Three milk-slab prints laid out like the city
  board's podium (the top print spans two columns, and two rows on `lg`), each with its own
  like pill (outline at rest, flat blush when yours, `like-pop` on a new like). Beside it
  the body and three rule pills (milk, a white disc with a blush heart); the tie rule turns
  yolk and scales 1.03 while the top two are tied. Order is likes, then newest like, then
  newest add — the real board's order. The top spot is announced in a polite live region.
- **Klim: demo podium and stamp** (`DemoPodium`, `DemoStamp`). The leaderboard podium in
  miniature on the berry poster's floor: yolk, candy and mint `rounded-t-slab` steps with
  step enamel, one handle size on every step (it truncates rather than shrinks), a
  `white/12` like pill with a candy heart, the spot count in `milk/70`, the egg over first
  place. A candy passport stamp (`StampFace`/`StampDefs`, -11deg) overlaps the verb at the
  top right. The copy column ends in a white `h-12` pill link to the leaderboard whose ink
  turns blush on hover.
- **House rules** (`HouseRules`). White ground; the egg (76px, -8deg) and the title in
  Bagel Fat One `text-4xl`/`text-5xl` held sticky on `lg`, beside a `dl` of five rules
  between `berry/12` hairlines: the term in Bagel Fat One `text-2xl`, the detail in Nunito
  `berry/75` at `max-w-prose`.
- **Close.** Milk, centred in `max-w-3xl`: the egg at 96px, 6deg with
  `drop-shadow-sticker`, the app line as an `h2`, a `berry/80` lede, then a blush search
  button back to home beside the store buttons.

### Photo frame

`PhotoFrame` is absolute-inset `object-cover` over a `Scene` (`lib/scenes.ts`): a `<picture>`
with AVIF and WebP landscape widths for `srcset`, and a centred 3:4 crop for portrait screens,
all cut from one PNG by `scripts/hero-scene.mjs`. The image is `fetchpriority="high"`: it is
home's largest paint. `sizes` defaults to `100vw`; a zoomed still paints wider than its frame,
so home passes `(max-height: 50rem) 180vw, 140vw`. With `ken`, it runs `hero-ken` — a 22s
alternating drift from scale 1.22 to 1.32 (1.36 to 1.46 when the screen is under 50rem tall),
anchored bottom-left (`object-position: 50% 100%`, origin `0% 100%`; origin 12% in a short
landscape screen, `object-position: 0% 100%` in a short portrait one), so the café signage
rides up under the header and away from the title. The base rule holds the start scale, so
reduced motion keeps the framing and loses only the drift. Used full-bleed on the home hero.

### Home steps (`Steps` in `components/home-view.tsx`)

A berry band under local favorites (or the hero), titled in Section type in white. Four slabs
of `white/7` with a `white/10` ring, each holding one how-it-works verb as its `.sticker`
(the same ink and tilt as `VerbStickers`) and one milk/85 sentence. The whole slab links to
that verb's poster on how it works; hover or focus straightens the sticker and scales it 1.05,
as on the how-it-works hero. Mobile sets the sticker beside its sentence; `sm` and up stack
them in two, then four, columns. The band ends in the white `h-12` pill link to how it works.

### Woonplaats index (`app/nl/woonplaatsen/page.tsx`)

A `board` berry `PageHero`: Display title, the yolk count `.sticker` ("2 plaatsen"), a milk
lede and the search pill. Below, on white, one row per letter between `berry/12` hairlines:
the letter in Bagel Fat One `text-4xl`/`text-5xl` berry in a fixed left column, and the
boards as milk pills (Bagel Fat One name, white count chip in Nunito 700 `berry/75`) that
turn candy/45 on hover. No boards yet: `EggEmpty`.

### Map

Leaflet, client-only. The canvas is candy mixed 28% into milk; popups and their tips are blush
with berry ink and bold berry links; markers are yolk fill at 90% with a blush stroke. Map view
is a URL (`?view=map`), so it is a link, not a toggle.

### Toast

`components/ui/toast.tsx`, mounted once in the root layout.

### Motion

Three durations and three easings, all tokens:

- `duration-press` 160ms — presses, hovers, segment changes.
- `duration-popover` 180ms — combobox, select, menu.
- `duration-modal` 220ms — dialog and drawer.
- `ease-out-strong` for arrivals and presses, `ease-in-out-strong` for symmetric moves,
  `ease-drawer` for sheets.
- `ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`), a single overshoot, for exactly two
  sticker moments: the poster letters landing and the like heart popping. Nothing else
  springs.

**Home's one authored moment** is the title arriving. The lead's words come into focus one
after another (`hero-focus`: from 0.45 opacity, a 0.09em blur and a 0.08em drop; 1100ms
`ease-out-strong`, 130ms apart), then the tag is pressed on (`hero-tag-press`: from scale
1.45, -11deg and no opacity, overshooting to 0.95 before it settles at -3deg; 640ms
`ease-out-strong`) while its cast tightens. The search is static and usable from the first
frame; nothing waits for the moment. Ambient: the ken-burns drift, and, where the browser has
scroll timelines (`@supports (animation-timeline: view())`) and motion is not reduced, the
still falls behind the page as the hero exits (`hero-drift`, translating 22% over the hero's
exit view-timeline).

**The spot page's one authored moment** is the print landing: it drops from 2.5rem above,
tilted 2.5 times its resting angle and scaled 1.07, at 20% opacity, and settles over 1000ms
`ease-out-strong` while its cast tightens from a wide soft shadow to the print cast. The glow
fades in behind it. Lightbox photos slide 2rem in the paging direction over 320ms.

**The passport's one authored moment** is the stamps being pressed: each lands from scale 1.55
and no opacity, overshoots to 0.96 and settles, 560ms `ease-out-strong`, 170ms apart. The tilt
lives on the link and the press on the ink inside, so hover can still straighten a stamp.

**The leaderboard's one authored moment** is the podium rising out of the slab's floor, third
step first and first step last (900ms `ease-out-strong`, clipped by the slab), then the egg
dropping onto first place with a tilt that settles. Like bars fill from the left once.

**The city page's one authored moment** is the poster name: each letter lands from a small
drop and tilt with a 34ms stagger (`.poster-letter`), starting from a visible 20% opacity. The
heading keeps the plain name as its `aria-label` and text. Re-sorting the board runs the state
change inside `document.startViewTransition`, with each card named `spot-{slug}`, so prints
glide to their new places and the podium print morphs; new snapshots are solid from the first
frame and old ones clear in 140ms.

**How it works has one moment per poster, and each is its page's own moment played once.**
Zoek: the country fills in from the south, eight bands of dots each rising 14px out of
nothing (640ms `ease-out-strong`, 60ms apart), then the pin starts its tour. Brag: the print
lands exactly as on the spot page (`print-land`, 120ms in). Like: 1.3s after the board is
half in view, someone else's like lands on the runner-up — a candy **+1** floats off its
pill, the heart pops, and the board glides into its new order through
`document.startViewTransition` (each print named `hiw-{id}`), the newest like breaking the
tie. Your own taps glide the same way. Klim: the podium rises third step first (`podium-rise`,
120/270/420ms), the egg drops at 1.1s, and the stamp is pressed at 1.5s (`stamp-press`).

**The Stage.** `components/stage.tsx` holds a poster's moment until it arrives. A stage that
is off-screen when the page wakes is marked `data-stage="armed"`, which pauses every
animation inside it on its first frame; at 30% in view it turns `live` and plays, once. A
stage already on screen at wake, a reduced-motion visitor, or a page without script gets no
`data-stage`, and the staged classes only animate under `[data-stage]`, so the piece simply
stands in its final state. Nothing jumps back to replay. Pieces that react rather than play
(the pin tour, the like nudge) use `useSeen`, which fires once at a threshold.

**The header's motion is chrome, not a moment.** It has no entrance. It answers the visitor:
the band lifts into the pill on scroll, the `#bragfast` sticker peels and is pressed back, the
nav pill glides, the lockup's egg rocks on hover. None of it springs. Under reduced motion the
band changes shape without gliding (its shadow still fades), the nav pill moves without
sliding, the sticker only fades, and the egg stays still.

Press feedback is uniform: `active:scale-[0.97]`. Hover effects are gated behind the
`pointer-fine` variant so a touch device never sticks in a hover state. Under
`prefers-reduced-motion` the ken-burns, scroll drift, home title focus and tag press, poster letters, print landing, glow fade, lightbox
slide, like pop, sort glide, stamp press, podium rise, egg drop (the menu egg included) and like-bar fill stop — and on how it works the
staged print, map bands, pin ring, pin glide and pin tour, town label, +1 float, demo
podium rise, demo egg drop and demo stamp press stop, and the like demo re-sorts without a
view transition — and
every popup transition falls back to opacity with transforms removed.

## Do's and Don'ts

### Do

- **Do** open home with a full-bleed still under the milk header, copy bottom-left in white:
  the title with `text-shadow-photo`, the lede and links with `text-shadow-photo-copy`.
- **Do** give city, spot, passport, leaderboard and how it works a berry `PageHero` slab —
  with a photo print on spot.
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
- **Don't** wash a hero with a full-bleed overlay — use `text-shadow-photo` and
  `text-shadow-photo-copy`.
- **Don't** put white type on a spot card still; names sit on the milk caption.
- **Don't** draw board rank as a burst, and don't put rank or the egg on a spot card.
- **Don't** add type chips (Café / Bakker / Hotel / Overig) — they were removed on purpose.
- **Don't** split a city page into a board and a "Nog niet gebragd" tail.
- **Don't** put a small uppercase kicker above a headline.
- **Don't** give a card a "most liked" stamp or number; the podium print's size is the only
  rank signal on the city board.

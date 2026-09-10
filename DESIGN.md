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
    size: "4.35rem"
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
    textColor: "{colors.white}"
    typography: "{typography.section}"
    padding: "40px 20px"
---

# Design System: brag.fast

## Overview

**Creative North Star: "Kawaii egg on strawberry milk"**

Every public surface of brag.fast still opens inside a photograph. The still is the product. Chrome around it is strawberry-milk ground, berry ink, blush cheeks, yolk stickers. Cocoa brown stays on the egg SVG only. The lockup is `/brag_fast_logo.svg`. The mascot is `/brag_fast_egg.svg`. Do not recreate either with CSS gradient text.

The header is pink milk (`#ffe5f0`). Content sits on white. Ink is berry (`#4a1534`), never cocoa brown, never black, never indigo. The candy set is candy pink, blush coral, yolk, and mint. Buttons and selected chips are flat blush, no gradient. Rank is a yolk oval with a blush outline and blush cheeks, not a 12-point burst. The footer is blush, not a brown slab.

Density stays generous and rounded. Controls are flat colour pills. Panels are 28px slabs. Dutch is the default UI language. The atmosphere stamp reads **Sfeerbeeld**. Anti-references: indigo ink, cool sky-white foam, Lilita One, Pacifico, Figtree, painted `/wordmark.png`, circular rank badges, directory thumbnail-plus-column cards, full-bleed cocoa hero overlays.

**Key Characteristics:**
- Photo-first: hero, city and spot headers are full-bleed stills with no overlay. Copy uses `text-shadow-photo`.
- Wordmark is the SVG lockup. Header and hero use `<Logo>`. Favicon and footer use `<Egg>`.
- Pink header, white content: milk nav, white page, white panels, shell wells.
- Flat blush pills for primary buttons, selected chips, and the pressed language side. No button gradient.
- Cocoa ink on light surfaces. White Bagel Fat One with `text-shadow-photo` on photographs.
- Filter chips are candy / mint / yolk at rest and blush when pressed. 28px slabs for content.
- Two voices: Bagel Fat One shouts names and `#bragfast`. Nunito is body, labels, controls.

## Colors

A cold, pale base with indigo ink and a candy set, where the photograph supplies the warmth.

### Primary
- **Flare** (`{colors.flare}`, bubblegum pink): the active and selected voice. Top of the brand gradient, language-toggle pressed side, search-field accent, text selection, outline-button hover, error text. Never used as CSS text-fill on a display face.
- **Citrus** (`{colors.citrus}`, tangerine): bottom of the brand gradient; on its own it colours the Pacifico `#bragfast` on an Instagram embed. Never used as a flat button fill alone.

### Secondary
- **Sun** (`{colors.sun}`, yellow): the link-and-focus colour on dark or photographic ground, the atmosphere stamp fill, the "open now" candy key and spot-hero badge, the header `#bragfast` tag, the footer signature, map popup links, and every page-level focus ring (2px, offset 2px). Sun is how the eye finds the next tap on a photograph.

### Tertiary
- **Sky** (`{colors.sky}`): rest-state candy keys (default chip), the brag-card media fallback, a tint in the Leaflet canvas. The cool counterweight named by the world.
- **Mint** (`{colors.mint}`): rest-state candy key for the "has brags" filter. Same 3D key as sky and sun; different candy colour so filters read as a set, not a row of white pills.

### Neutral
- **Night** (`{colors.night}`, deep indigo): all text on light surfaces, the header (at 75% over the photo, blurred), the footer, the closed-spot badge, map popups. Tinted for secondary text (night/70, /75, /55), borders (night/8, /10, /12, /15) and placeholders (night/45). A local foot fade on photo cards uses night/55; that is not a full-bleed overlay.
- **Foam** (`{colors.foam}`, sky-white): the page ground, ghost-button hover, inner note panels, the auth field well.
- **White** (`{colors.white}`): card and panel surface, outline-button fill, the search pill (at 92%), segmented trays, and all display type on photographs (tinted /15 for frosted badges).

### Named Rules
**The Warm Inside the Frame Rule.** Warm colour comes from the photograph and the candy accents. Page grounds and panels are foam or white; no beige, cream or maple surface exists in this system.

**The One Gradient Rule.** Do not put a CSS gradient on a button, chip, or type face. Photo-card feet may fade. Do not apply CSS gradient-text.

**The Indigo Ink Rule.** Text is night, never `#000`. Night at alpha tints the header, borders, and a short card-foot fade. It does not wash the hero.

**The Sun Points the Way Rule.** On any night or photographic ground, links and focus rings are sun. Flare is for selected state, not for links.

## Typography

**Display Font:** Lilita One (with Impact, sans-serif fallback)
**Script Font:** Pacifico (with cursive fallback), `#bragfast` signatures only
**Body Font:** Figtree (with system-ui, sans-serif fallback), weights 400 / 600 / 700 / 800
**Wordmark:** painted raster at `/wordmark.png` (hero `clamp(4.2rem, 13vw, 9.2rem)` tall; header 32–36px). Not a font role.

**Character:** Highlife-sleeve lettering on a film still. Lilita One is a single-weight fat sans that shouts a name across a photograph in solid white. Pacifico is the brush that signs `#bragfast`. Figtree is the calm, rounded body face that keeps hours, addresses and labels legible without competing. The wordmark is a separate painted object; it does not share a CSS treatment with Lilita.

### Hierarchy
- **Wordmark** (painted PNG): home hero and site header. Drop-shadow `0 2px 16px rgba(27, 21, 64, 0.35)`. Never recreated with `.flare-text` or `background-clip` on Lilita or Pacifico.
- **Display** (Lilita One 400, `clamp(3rem, 10vw, 7rem)`, line-height 0.9, tracking 0.025em, solid white, `.photo-copy`): city names over the city still.
- **Headline** (Lilita One 400, `clamp(2.4rem, 8vw, 5.5rem)`, line-height 0.92, tracking 0.025em, solid white, `.photo-copy`): spot and passport names over the still; admin title in night on foam.
- **Section** (Lilita One 400, 1.875rem → 2.25rem at `sm`, tracking 0.025em, night): section heads such as featured cities, board, seed tail, hours, search results.
- **Title** (Bagel Fat One 400, 1.5rem, tracking 0.025em, berry): the name on a photo-card milk caption.
- **Lede** (Figtree 600, 1.125rem → 1.5rem at `sm`, line-height 1.4, white, `.photo-copy`): the hero sentence under the wordmark. The supporting intro drops to 400.
- **Body** (Figtree 400, 1rem, line-height 1.75, night or night/75): hours, addresses, brag text. Reading columns cap at `max-w-3xl` (48rem).
- **Label** (Figtree 700, 0.875rem, night or white): candy keys, buttons, segments, card meta, back-to-city (sun, below the spot address). The language toggle is the one uppercase label (11px, tracking 0.12em) because it is a two-letter code.
- **Script accent** (Pacifico 400, 1.5rem): `#bragfast` in the footer (sun) and on an Instagram embed (citrus). Short phrases only. The header `#bragfast` is Lilita One in sun, not Pacifico.

### Named Rules
**The Paint, Not Costume Rule.** The wordmark is a painted raster. Never apply a CSS gradient to a geometric display face and call it the wordmark.

**The Painted Title Rule.** A title on a full-bleed page still is Bagel Fat One in solid white with `text-shadow-photo`, placed bottom-left. Card names sit on the milk caption in berry. They are never painted in white on the still.

**The No Eyebrow Rule.** Headlines are not preceded by a small uppercase kicker. The hashtag `#bragfast` is a brand signature in the header and footer, not a label above content.

**The Two Shouts Rule.** Lilita One shouts names. Pacifico signs `#bragfast` only. Body copy, labels and controls are always Figtree.

## Layout

The page is a stack of full-width bands inside a single `max-w-6xl` (72rem) column with 20px side padding on mobile and 32px from `sm` (640px). Spot pages narrow the reading column to `max-w-3xl` (48rem).

Every public page opens with a photo band that pulls up under the translucent header: the header is 64px (72px from `sm`) and the band applies a matching negative top margin so the still runs behind the nav. Band heights are viewport-relative: home `min-h-[92svh]`, spot `58svh`, city `52svh`, passport `42svh`. Content inside the band is bottom-aligned with `pt-28` (112px) clearing the header and `pb-10`–`pb-20` (40–80px) at the foot. On the spot page the back-to-city link sits below the address, not above the h1.

Below the still, sections sit at `py-10`–`py-14` on mobile and `py-20` (80px) from `sm`. Section heads are followed by `mt-6`–`mt-8` before their grid. Photo-card grids use `gap-4` (16px): one column on mobile, two from `sm`, four from `lg` for city grids, where the first city spans two columns and two rows. Candy keys sit in `gap-2` rows; filter rows and view toggles share a `justify-between` line that wraps on narrow screens.

Breakpoints are Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px.

**The Still First Rule.** No public page starts with a heading on a flat ground. The first viewport is a photograph with the title and, on home, the search pill placed on it.

## Elevation & Depth

Depth is made four ways: local text-shadow on photographs, a frosted-glass header, 3D candy-key feet, and two families of soft coloured glow. There are no full-bleed indigo overlays and no grey drop shadows.

Hero, city, spot and passport bands have no scrim. Legibility comes from `text-shadow-photo`. Photo cards put the name on a milk caption under the still, not on the photograph.

### Shadow Vocabulary
- **Photo copy** (`text-shadow: 0 1px 1px rgba(27,21,64,0.4), 0 10px 28px rgba(27,21,64,0.32)`): every line of type on a still.
- **Candy key rest** (`box-shadow: inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -3px 0 rgba(27,21,64,0.12), 0 4px 0 rgba(27,21,64,0.16)`): the 3D drum-machine foot on chips and segments. This is a key, not a card side-tab.
- **Candy key pressed** (`box-shadow: inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(27,21,64,0.18), 0 2px 0 rgba(27,21,64,0.12)` plus `translateY(2px)`): active candy keys.
- **Stamp foot** (`box-shadow: inset 0 2px 0 rgba(255,255,255,0.55), 0 3px 0 rgba(27,21,64,0.18)`): the sun atmosphere stamp.
- **Pink glow** (`box-shadow: 0 8px 20px rgba(255,90,154,0.35)`): under the primary button. Rank burst uses `drop-shadow(0 8px 18px rgba(255,90,154,0.5))`.
- **Ink lift** (`box-shadow: 0 16px 40px rgba(27,21,64,0.25)`): the search pill floating on the hero photo. Wordmark uses `drop-shadow(0 2px 16px rgba(27,21,64,0.35))`.
- **Ink rest** (`box-shadow: 0 12px 32px rgba(27,21,64,0.08)`): brag cards sitting on foam.

### Named Rules
**The Photo-Copy Rule.** Legibility on a bright still comes from local text-shadow (`.photo-copy`), never from a full-bleed indigo overlay.

**The Coloured Glow Rule.** Shadows are tinted with the thing casting them: flare under flare objects, night under white, photographic, or candy-key objects. No grey or black shadow.

**The Candy Key Rule.** Filters and segments are 3D keys. The night-tinted foot is how a key sits on the desk. Do not flatten them into white-bordered chips and do not read the foot as a card side-tab.

## Shapes

Two silhouettes, plus one sticker. Anything pressable is a full pill (`{rounded.pill}`): buttons, candy keys, the search field, badges, the language toggle, the atmosphere stamp. Anything that holds content is a 28px slab (`{rounded.card}`): photo cards, white panels, brag cards, the auth sheet, the map, admin rows. Inputs inside panels take the intermediate 16px (`{rounded.field}`). Rank is the exception: a 12-point SVG burst, 4.35rem, rotated −14°, not a circle.

Borders are night at 8–15% alpha on white and foam surfaces, or white at 35–40% alpha on photographs. They define edges, not depth. Photo cards have no border. Photos are always `object-cover` inside an `overflow-hidden` frame.

**The Pill or Slab Rule.** If a user can press it, it is a pill (and if it is a filter or segment, it is a candy key). If it holds content, it is a 28px slab. Rank is a burst. Nothing else.

**The Burst Rank Rule.** Board rank is a rotated 12-point flare → citrus burst with a zero-padded Lilita number. Never a circle, never a table index.

## Components

### Buttons
Candy-coloured pills: fat, round, and flat.
- **Shape:** full pill; 40px tall with 20px side padding by default, 32px / 12px at `sm` (12px type), 48px / 28px at `lg` (16px type), 40px square for icon-only.
- **Primary:** solid blush fill, white 700 label. Hover brightens to 110%. Sign-in, search submit, and other main actions share this.
- **Outline:** white fill, berry/15 border, berry label. Hover turns border and label blush. Secondary on foam and on the hero ("Dichtbij").
- **Ghost:** no fill, berry label. Hover fills milk.
- **Focus:** 2px yolk ring, offset 2px. Disabled: 50% opacity, no pointer.

### Chips
Flat colour pills, not white outlines.
- **Style:** pill, 16px × 6px padding, 14px 700 label. Unselected fills are candy (default), mint, or yolk, with berry text.
- **Selected:** solid blush fill, white text. Selection is a fill change, not a checkmark.

### Segmented control
A white pill tray (`p-0.5`, berry/12 border) holding pill links at 14px × 6px. The current segment is solid blush with white text via `aria-current`. Inactive segments inherit the tray. The language toggle is the same idea: white tray, blush plus white when pressed.

### Photo card
A 28px slab. The still fills the top of the card (`object-cover`, `min-h-36`–`min-h-72`). Name and meta sit on a milk caption under the photo, in berry Bagel Fat One / Nunito, not painted in white on the still. The image scales to 105% over 700ms on hover. Focus draws the yolk ring.

City tiles use that city's still. Spot cards use a hashed breakfast still (`stillFor(slug)`), never the city still. Bragged spots wear the logo egg (`/brag_fast_egg.svg`), 44px, 8° tilt, top-right on the photo, with the sticker drop-shadow. City tiles have neither egg nor rank. Rank numbers live on the spot page, not on the city list.

### Rank burst
Used on the spot page standing, not on city cards. A 4.35rem yolk ellipse sticker, −12° rotation, berry two-digit number.

### Atmosphere stamp
Retired on spot cards. The egg marks a bragged spot. City stills stay unlabeled.

### Search pill
The hero's one control. 64px tall pill, white at 92% with a white/40 border, ink-lift shadow, 20px side padding, a flare accent at left and a transparent 16px Figtree input with night/45 placeholder.

### Panels
White 28px slabs with 20px padding and either a night/10 border (forms, admin rows) or the ink-rest shadow (brag cards on foam). Inner note wells use foam at 16px radius. Panel dividers are night/8 or night/15 hairlines.

### Brag card
Always a 28px slab. Real hosted photos fill 20rem, cover. Seed 1×1 placeholders are visually a sky slab with the maker name in Lilita night and the time in 14px 700; the hosted `img` stays in the DOM as `sr-only` so predicates still see it. Every card — placeholder or not — shows maker name and time on a white footer bar.

### Inputs / Fields
- **Style:** 48px tall, 16px radius, white fill, night/15 border, 14px text; inside the auth sheet, a foam pill well with the same border.
- **Focus:** 2px flare ring (fields inside panels); page-level controls use the sun ring.

### Navigation
A single bar, night at 75% with `backdrop-blur-md`, 64px tall (72px from `sm`), sitting over the still. Left: the 40px waffle icon and the small painted wordmark, then the `#bragfast` tag in Lilita One 14px sun from `sm`. Right: admin link (white 700), frosted language toggle, auth control with sun links and a primary login pill. No menu, no drawer.

### Footer
Full-width night band, 40px vertical padding. Left: a Lilita One 1.875rem white line. Right: `#bragfast` in Pacifico 1.5rem sun. Top border night/8.

### Badges over photos
Small pills at 12px × 4px, 14px 700: sun fill with night text for "open now"; white/15 frosted with white text for rank and maker counts; solid night with white text for a closed spot. The back-to-city control is a sun 14px 700 text link under the address, with `.photo-copy`.

### Map
A 28px-radius 28rem slab. Canvas is sky mixed into foam. Circle markers: flare stroke, citrus fill. Popups are night with sun links.

### Motion
The home still drifts: `scale(1.04) → scale(1.14)` over 22s, ease-out, alternating, disabled under `prefers-reduced-motion`. Card images ease to 105% over 700ms on hover. Everything else is `transition-colors` at Tailwind's default 150ms.

## Do's and Don'ts

### Do:
- **Do** open every public page with a full-bleed still pulled under the translucent night header, title bottom-left in white Lilita with `.photo-copy`.
- **Do** use the painted `/wordmark.png` in the hero and the header.
- **Do** use solid blush on primary buttons, selected chips, and the pressed language side.
- **Do** make filters and segments colour pills (candy / mint / yolk at rest, blush when pressed) and every content container a 28px slab.
- **Do** mark bragged spot cards with the logo egg, top-right on the still.
- **Do** show maker name and time on every brag card; keep seed placeholder images in the DOM as `sr-only` behind a sky fallback.
- **Do** put the back-to-city link below the spot address.
- **Do** use sun for links and focus rings on photographs and night grounds; flare for selected state.
- **Do** keep body copy, labels and controls in Figtree; Lilita One shouts names; Pacifico signs `#bragfast` only.
- **Do** keep the page ground foam and panels white so the photograph stays the warmest thing on screen.

### Don't:
- **Don't** introduce cream, beige or maple surfaces, or bring back Syne.
- **Don't** restore `.flare-text` or put a CSS gradient on Lilita, Pacifico, or any geometric display face.
- **Don't** wash a hero, city or spot still with a full-bleed indigo overlay.
- **Don't** put white type on a spot card still; names sit on the milk caption.
- **Don't** use one city still for every spot in that city.
- **Don't** draw rank as a circle or a table number.
- **Don't** put a CSS gradient on a button or chip.
- **Don't** turn filter chips into white-bordered outlines.
- **Don't** split the city page into Board and “Nog niet gebragd”.
- **Don't** put a small uppercase kicker above a headline.
- **Don't** use `#000` for text or fades; ink is night.
- **Don't** use grey or black drop shadows, or borders to fake elevation.
- **Don't** hide maker name or time on a brag card.

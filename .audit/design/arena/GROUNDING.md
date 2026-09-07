# brag.fast architecture grounding

Greenfield. No existing code. Product source of truth: `/home/henk/bragfast-v2/SPEC.md`. If this file and SPEC disagree, SPEC wins.

## Product (one sentence)

A crawlable NL breakfast/brunch directory. Spots (venues) are the unit. Brags (visit proof) make spots climb a city board. Discovery owns the homepage. A live social feed is not the product.

## Stack (human override of SPEC's Postgres default)

- Next.js App Router + TypeScript. Public pages must be server-rendered HTML (`view-source` has content). Not a client-only SPA.
- Convex for database and backend functions. Hosted Convex + Vercel for the Next.js app.
- Better Auth via `@convex-dev/better-auth` (official component). v1 providers: Google + magic email link. Instagram is linking later, not the front door. No password as the product sign-in. No Apple in v1.
- shadcn/ui for primitives.
- i18n: `nl` default, `en` switch. Same URLs. `/nl/` is country, not language. Cookie / Accept-Language.

Official Next.js wiring (follow this, do not invent a second auth path):

- `convex@latest` + `@convex-dev/better-auth` + `better-auth@~1.6.15`
- Component registered in `convex/convex.config.ts`
- `convex/auth.config.ts` with `getAuthConfigProvider()`
- `createAuth` in Convex. `auth.api` methods run inside Convex functions, not in Next.js.
- Next.js proxies `/api/auth/[...all]` to Convex via `convexBetterAuthNextJs`.
- `ConvexBetterAuthProvider` replaces `ConvexProvider`. Pass `initialToken` from `getToken()` for SSR.
- Public catalog queries must work signed-out. Auth wraps mutations and passport-of-self.

Docs: https://labs.convex.dev/better-auth/framework-guides/next

## Domain words (from SPEC)

Spot, City, Catalog, Seed, Brag, Maker, Board, Catalog tail, Passport, Claim (v2, ignore).

Ranking: distinct makers with a brag in 90 days. Tie-break = most recent brag. Seed never numbered. One maker per spot. Extra posts from the same maker are feed rows, not extra votes.

SPEC data: User, Spot, Brag, AiMatchQueue, Report.

SPEC vote rule (you must pick one model and encode it):

> Unique constraint: one active brag vote per (maker_key, spot_id); extra posts from the same maker are feed rows that do not add votes (or store posts separately and derive the vote). Pick one model; keep the rule.

`maker_key`: `user:{id}` | `ig:{id}`. Connecting Instagram rewrites `ig:{id}` to `user:{id}` and collapses duplicate votes on the same spot to one.

In-app media is hosted (Convex file storage is in-stack). Third-party UGC is embed + permalink only.

## This design's job

Sketch the v1 domain types, Convex table/index shape, module map, and the public function signatures a Next.js page actually calls.

You are designing for the whole v1 so we do not paint into a corner. Implementation of this run is only SPEC step 1 (Shell: Next.js, i18n, Better Auth, layout). The sketch must still make steps 2–6 obvious.

## Constraints that are not forks

Do not reopen these. The human and SPEC already closed them.

- Convex, not Postgres.
- Better Auth official Convex component, not a custom adapter.
- Same-URL i18n, not `/en/...` clones.
- No national live feed on the homepage.
- No star ratings. No Google rating as "best".
- No Stripe, claim, comments, likes, followers, Apple login.

## Forks you MUST take a stand on (be opinionated, structurally distinct from a middle design)

1. How a vote relates to a post (explicit MakerVote table vs derived from posts vs another shape).
2. How public SSR pages load Convex data (preloadQuery in RSC vs fetchQuery vs Convex HTTP).
3. Where domain types live vs Convex generated types (parse at boundary vs treat Convex docs as the model).
4. How `maker_key` is typed (branded union vs string vs table of identities).
5. How closed spots, hidden brags, and 90-day windows are encoded so illegal combinations cannot be constructed at write time.

Screen yourself against `/root/.cursor/plugins/cache/cursor-public/pstack/fd878692de15a3069c21c8f429eb0b9f2fe178fa/skills/architect/references/design-red-flags.md`.

## Callers to design for (usage first)

Write these call sites before types:

- City page RSC: numbered board + catalog tail, signed-out.
- Spot page RSC: JSON-LD + hours + feed, signed-out. Signed-in "brag here" is a child.
- In-app brag mutation: one photo/video, replace in place, still one vote.
- Maker merge when Instagram is linked.

## Output

Write ALL of these under your assigned candidate directory (and nowhere else):

- `USAGE.md` — caller's view, 2–3 real call sites
- `SHAPE.md` — types, Convex schema sketch, indexes, signatures (`not implemented` bodies)
- `MODULES.md` — file/module map
- `RATIONALE.md` — filled from `/root/.cursor/plugins/cache/cursor-public/pstack/fd878692de15a3069c21c8f429eb0b9f2fe178fa/skills/architect/references/rationale-template.md` (leave Synthesis decision as "orchestrator fills this")
- `REJECTED.md` — alternatives you considered and why they lost

Do not write application code. Do not touch `/home/henk/bragfast-v2` except reading SPEC.md.

# Module map

Organized by domain ownership, not execution order. Tracing any user action touches at most three files: page/island → public function → model helper.

```
domain/                        # pure TS; imports only convex/values (isomorphic). No ctx, no React.
  ids.ts                       # branded slugs + PlaceId, parse functions, DomainParseError
  makerKey.ts                  # MakerKey union, MakerKeyString brand, parse/serialize (sole owners of the wire format)
  spot.ts                      # Spot, SpotLifecycle, BoardStanding, OpeningHours, validators, parseSpot
  post.ts                      # Post union, HostedMedia, SocialEmbed, PostVisibility, validators, parsePost
  vote.ts                      # VoteStanding, desiredVote (pure), VoteOutcome
  ranking.ts                   # RANKING_WINDOW_MS, computeStanding, boardComparator, openNow(hours, now)
  viewModels.ts                # CityPageData, SpotPageData, PassportData, FeedItem, cards + their validators
  jsonld.ts                    # foodEstablishmentJsonLd(spot): pure, hosted-media images only by type

convex/
  convex.config.ts             # registers @convex-dev/better-auth component
  auth.config.ts               # getAuthConfigProvider()
  auth.ts                      # createAuth; requireUser(ctx) helper (the auth boundary)
  schema.ts                    # tables + indexes; validators imported from domain/*
  model/
    votes.ts                   # reconcileVote, recomputeSpotStats, rewritePostMakers — ONLY writers of makerVotes and lifecycle.standing
    posts.ts                   # insert/patch/delete post + storage file lifecycle; always ends by calling votes.reconcileVote
    spots.ts                   # upsert-by-placeId, gravestone transitions, slug assignment
    users.ts                   # ensurePassport (slug on brag 1), user lookup by auth subject
  catalog.ts                   # public queries: cityPage, spotPage, searchCatalog, homepage
  brags.ts                     # authed mutations: createInApp, replaceMedia, remove, report; generateUploadUrl
  identity.ts                  # linkInstagram (merge), passportBySlug
  spots.ts                     # addByPlaceId action + upsertFromPlaces internalMutation
  moderation.ts                # owner queue: resolveReport, aiMatchQueue approve/reject
  ingest.ts                    # (step 5) Instagram pull action → internal post insert, idempotent by platformMediaId
  crons.ts                     # window aging recompute; Places hygiene

app/
  layout.tsx                   # locale resolution (cookie/Accept-Language), ConvexBetterAuthProvider with initialToken
  page.tsx                     # homepage: search box, featured cities, near-me
  api/auth/[...all]/route.ts   # proxy to Convex via convexBetterAuthNextJs
  [country]/[city]/page.tsx    # city board + tail (fetchQuery cityPage)
  [country]/[city]/[spot]/page.tsx  # spot page + JSON-LD (fetchQuery spotPage)
  [country]/u/[slug]/page.tsx  # passport (fetchQuery passportBySlug); noindex when null passport
  sitemap.ts                   # from catalog; gravestones included (URL kept), zero-brag passports excluded

components/
  board.tsx, catalog-tail.tsx, spot-header.tsx, brag-feed.tsx, map-toggle.tsx, filter-chips.tsx   # server-renderable
  brag-here-island.tsx         # "use client": upload → createInApp/replaceMedia/remove
  report-button.tsx, language-switch.tsx, search-box.tsx                                          # "use client"

lib/
  i18n.ts                      # nl/en message loading, same-URL locale switch
  messages/nl.json, en.json
```

## Ownership rules the map encodes

- `makerVotes` and `spots.lifecycle.standing` have exactly one writer module (`convex/model/votes.ts`). Information about the vote invariant cannot leak because no other file can express a vote write.
- The 90-day constant, window math, and board ordering live only in `domain/ranking.ts`. The `by_city_board` index order is documented there as mirroring `boardComparator`.
- `maker_key` wire format exists in two functions in `domain/makerKey.ts`. Everything else sees the union or the brand.
- Public functions in `convex/*.ts` are thin shells: auth check, arg parse, call model, parse to view model. Business decisions live in `domain/` (pure) and `convex/model/` (transactional), per boundary-discipline.
- `app/` and `components/` never import from `convex/model/` or touch `Doc` types; they consume `domain/viewModels.ts` shapes returned by the generated `api`.

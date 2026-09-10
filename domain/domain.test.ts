import assert from "node:assert/strict";
import test from "node:test";
import type { GenericId } from "convex/values";
import { parseCitySlug, parseSpotSlug, parseUserSlug } from "./ids";
import { exactCitySlugFromHits } from "./searchMatch";
import {
  cityCentroid,
  haversineMeters,
  nearestCity,
  sortByDistance,
  assignCitySlug,
} from "./geo";
import { NL_CITIES } from "./cities";
import { canonicalCitySlug, lookupGemeente, NL_INGEST_GEMEENTEN } from "./gemeenten";
import { judgeCatalogFit } from "./catalogVerdict";
import {
  INGEST_POPULATION_FLOOR,
  nextCityIndex,
  orderGemeentenForIngest,
  planIngestTurn,
  resolveIngestIndex,
} from "./ingestTurn";
import {
  billingMonthKey,
  detailsBudgetLeft,
  DISCOVERY_QUERIES,
  DISCOVERY_TYPES,
} from "./placesQuota";
import {
  isOwnerEmail,
  planClosedOverride,
  planReportReview,
} from "./moderation";
import { bragLiveEmail } from "./notify";
import {
  placesHoursToOpeningHours,
  planHygiene,
  type PlacesSnapshot,
} from "./hygiene";
import { classifyPlaceTypes, slugFromPlaceName } from "./placeAdd";
import {
  isInstagramPermalink,
  isYoutubePermalink,
  officialEmbedSrc,
  planCaptionMatch,
  planMakerMatchConfirm,
  planMakerMerge,
  planSocialIngest,
} from "./social";
import {
  instagramEmbed,
  parseInstagramMedia,
  resolveLocationName,
} from "./instagram";
import {
  POSTS_WEEK_MS,
  countPostsThisWeek,
  passportSlugCandidate,
  planPassport,
  slugifyPassportName,
} from "./passport";
import { planSpotUpsert } from "./spot";
import { parseMakerKey, serializeMakerKey } from "./makerKey";
import { createLicensedImage, requireVisiblePost } from "./post";
import { foodEstablishmentJsonLd } from "./jsonld";
import {
  boardComparator,
  computeStanding,
  openNow,
  RANKING_WINDOW_MS,
  standingAsOf,
} from "./ranking";
import { desiredVote, reconcileVote } from "./vote";

test("slugs are parsed at the boundary", () => {
  assert.equal(parseCitySlug("den-haag"), "den-haag");
  assert.throws(() => parseCitySlug("Den Haag"));
});

test("maker keys round-trip through the indexed wire format", () => {
  const userId = "user-1" as GenericId<"users">;
  assert.deepEqual(parseMakerKey(serializeMakerKey({ kind: "user", userId })), {
    kind: "user",
    userId,
  });
  assert.deepEqual(parseMakerKey("ig:123"), {
    kind: "ig",
    igUserId: "123",
  });
  assert.throws(() => parseMakerKey("youtube:123"));
});

test("the desired vote follows visible posts", () => {
  assert.equal(desiredVote([]), null);
  assert.deepEqual(desiredVote([30, 10, 20]), {
    firstPostAt: 10,
    latestVisiblePostAt: 30,
  });
});

test("reconcileVote grants, keeps, and retracts from visible posts", () => {
  const standing = { firstPostAt: 10, latestVisiblePostAt: 30 };
  assert.deepEqual(reconcileVote(null, null), { outcome: "absent" });
  assert.deepEqual(reconcileVote(null, standing), {
    outcome: "granted",
    standing,
  });
  assert.deepEqual(reconcileVote(standing, standing), {
    outcome: "kept",
    standing,
  });
  assert.deepEqual(
    reconcileVote(standing, { firstPostAt: 10, latestVisiblePostAt: 40 }),
    {
      outcome: "kept",
      standing: { firstPostAt: 10, latestVisiblePostAt: 40 },
    },
  );
  assert.deepEqual(reconcileVote(standing, null), { outcome: "retracted" });
});

test("standing counts active makers and exposes the next expiry", () => {
  const now = RANKING_WINDOW_MS + 100;
  assert.deepEqual(
    computeStanding(
      [
        { firstPostAt: 0, latestVisiblePostAt: 99 },
        { firstPostAt: 20, latestVisiblePostAt: 100 },
        { firstPostAt: 30, latestVisiblePostAt: 300 },
      ],
      now,
    ),
    {
      score: 2,
      latestBragAt: 300,
      windowExpiresAt: RANKING_WINDOW_MS + 100,
    },
  );
});

test("board order uses score before recency", () => {
  const higherScore = {
    score: 2,
    latestBragAt: 10,
    windowExpiresAt: 20,
  };
  const moreRecent = {
    score: 1,
    latestBragAt: 30,
    windowExpiresAt: 40,
  };
  assert.ok(boardComparator(higherScore, moreRecent) < 0);
});

test("expired standing drops off the board", () => {
  const standing = {
    score: 1,
    latestBragAt: 10,
    windowExpiresAt: 20,
  };
  assert.equal(standingAsOf(standing, 21), null);
  assert.deepEqual(standingAsOf(standing, 20), standing);
  assert.equal(standingAsOf(null, 19), null);
});

test("social embeds cannot become licensed images", () => {
  assert.equal(
    createLicensedImage({
      kind: "embed",
      embed: {
        platform: "instagram",
        permalink: "https://instagram.com/p/example",
        platformMediaId: "example",
      },
    }),
    null,
  );
  assert.deepEqual(
    createLicensedImage({
      kind: "hosted",
      mediaType: "photo",
      url: "https://example.com/brag.jpg",
    }),
    {
      source: "inApp",
      url: "https://example.com/brag.jpg",
    },
  );
});

test("hidden posts cannot enter the public feed constructor", () => {
  const hidden = {
    id: "post-1" as GenericId<"posts">,
    spotId: "spot-1" as GenericId<"spots">,
    createdAt: 1,
    visibility: {
      kind: "hidden" as const,
      reason: "report" as const,
      reportId: "report-1" as GenericId<"reports">,
      at: 2,
    },
    kind: "inApp" as const,
    maker: { kind: "user" as const, userId: "user-1" as GenericId<"users"> },
    media: {
      mediaType: "photo" as const,
      storageId: "storage-1" as GenericId<"_storage">,
      replacedAt: null,
    },
  };
  assert.throws(() => requireVisiblePost(hidden));
  assert.equal(
    requireVisiblePost({ ...hidden, visibility: { kind: "visible" } }).visibility
      .kind,
    "visible",
  );
});

test("openNow is timezone-aware and closed outside periods", () => {
  const hours = {
    timezone: "Europe/Amsterdam",
    periods: [{ day: 1, open: "08:00", close: "16:00" }],
  };
  assert.equal(
    openNow(hours, new Date("2026-08-31T10:00:00+02:00")),
    true,
  );
  assert.equal(
    openNow(hours, new Date("2026-08-31T18:00:00+02:00")),
    false,
  );
  assert.equal(
    openNow(hours, new Date("2026-08-30T10:00:00+02:00")),
    false,
  );
});

test("JSON-LD cannot take an embed as image", () => {
  const json = foodEstablishmentJsonLd({
    name: "Anne&Max Haarlem",
    address: "Grote Houtstraat 1, Haarlem",
    cityName: "Haarlem",
    geo: { lat: 52.38, lng: 4.63 },
    hours: null,
    spotType: "cafe",
    url: "http://77.42.31.66/nl/haarlem/anne-max",
    image: null,
  });
  assert.equal(json["@type"], "CafeOrCoffeeShop");
  assert.equal("image" in json, false);
});

test("Places can retarget a seed Place ID via the city slug", () => {
  assert.deepEqual(
    planSpotUpsert({
      incomingPlaceId: "ChIJ-real-anne-max-haarlem",
      byPlaceId: null,
      bySlug: { placeId: "seed:nl:haarlem:anne-max" },
    }),
    {
      action: "patch",
      via: "slug",
      placeId: "ChIJ-real-anne-max-haarlem",
    },
  );
});

test("a second Google Place ID cannot steal an occupied slug", () => {
  assert.throws(() =>
    planSpotUpsert({
      incomingPlaceId: "ChIJ-other",
      byPlaceId: null,
      bySlug: { placeId: "ChIJ-real-anne-max-haarlem" },
    }),
  );
});

test("passport names slugify to user slugs", () => {
  assert.equal(slugifyPassportName("Maker A"), "maker-a");
  assert.equal(slugifyPassportName(""), "bragger");
  assert.equal(slugifyPassportName("!!!"), "bragger");
  assert.equal(slugifyPassportName("  ---  "), "bragger");
  assert.equal(parseUserSlug(slugifyPassportName("Maker A")), "maker-a");
  assert.equal(parseUserSlug(slugifyPassportName("!!!")), "bragger");
});

test("passport slug candidates suffix collisions", () => {
  assert.equal(passportSlugCandidate("Maker A", 1), "maker-a");
  assert.equal(passportSlugCandidate("Maker A", 2), "maker-a-2");
  assert.equal(passportSlugCandidate("Maker A", 3), "maker-a-3");
});

test("planPassport keeps a minted slug and mints only when missing", () => {
  assert.deepEqual(planPassport({ slug: "maker-a", since: 10 }, 99), {
    action: "keep",
    slug: "maker-a",
    since: 10,
  });
  assert.deepEqual(planPassport(null, 99), {
    action: "mint",
    since: 99,
  });
});

test("posts this week include the rolling window boundary", () => {
  const now = POSTS_WEEK_MS + 100;
  assert.equal(
    countPostsThisWeek(
      [now, now - POSTS_WEEK_MS, now - POSTS_WEEK_MS - 1],
      now,
    ),
    2,
  );
});

test("haversine puts Haarlem closer than Rotterdam from Amsterdam", () => {
  const amsterdam = cityCentroid("amsterdam");
  const haarlem = cityCentroid("haarlem");
  const rotterdam = cityCentroid("rotterdam");
  assert.ok(amsterdam && haarlem && rotterdam);
  assert.ok(haversineMeters(amsterdam, haarlem) < haversineMeters(amsterdam, rotterdam));
});

test("nearest city and distance sort stay origin-relative", () => {
  const origin = { lat: 52.38, lng: 4.636 };
  const cities = [
    { slug: parseCitySlug("rotterdam"), geo: cityCentroid("rotterdam")! },
    { slug: parseCitySlug("haarlem"), geo: cityCentroid("haarlem")! },
  ];
  assert.equal(nearestCity(origin, cities)?.slug, "haarlem");
  const spots = [
    { slug: parseSpotSlug("jopenkerk"), geo: { lat: 52.3807, lng: 4.6331 } },
    { slug: parseSpotSlug("stach"), geo: { lat: 52.3814, lng: 4.6359 } },
  ];
  assert.equal(sortByDistance(origin, spots)[0]?.slug, "stach");
});

test("report review restores or keeps hidden, and ignores resolved rows", () => {
  const reportId = "report-1" as GenericId<"reports">;
  const hidden = {
    kind: "hidden" as const,
    reason: "report" as const,
    reportId,
    at: 2,
  };
  assert.deepEqual(
    planReportReview({
      reportStatus: "open",
      reportId,
      visibility: hidden,
      action: "restore",
    }),
    { ok: true, reportStatus: "resolved", visibility: { kind: "visible" } },
  );
  assert.deepEqual(
    planReportReview({
      reportStatus: "open",
      reportId,
      visibility: hidden,
      action: "keepHidden",
    }),
    { ok: true, reportStatus: "resolved", visibility: hidden },
  );
  assert.deepEqual(
    planReportReview({
      reportStatus: "resolved",
      reportId,
      visibility: hidden,
      action: "restore",
    }),
    { ok: false, reason: "not-open" },
  );
  assert.deepEqual(
    planReportReview({
      reportStatus: "open",
      reportId,
      visibility: { kind: "visible" },
      action: "restore",
    }),
    { ok: false, reason: "not-hidden" },
  );
});

test("closed override is idempotent on already-closed and already-listed", () => {
  assert.deepEqual(
    planClosedOverride({ listingStatus: "listed", action: "close", now: 50 }),
    { action: "close", listingStatus: "gravestone", closedAt: 50 },
  );
  assert.deepEqual(
    planClosedOverride({
      listingStatus: "gravestone",
      action: "close",
      now: 50,
    }),
    { ok: false, reason: "already-closed" },
  );
  assert.deepEqual(
    planClosedOverride({
      listingStatus: "gravestone",
      action: "reopen",
      now: 50,
    }),
    { action: "reopen", listingStatus: "listed" },
  );
});

test("owner email match is case-insensitive and empty-safe", () => {
  assert.equal(isOwnerEmail("Rob@Example.com", "rob@example.com"), true);
  assert.equal(isOwnerEmail("other@example.com", "rob@example.com"), false);
  assert.equal(isOwnerEmail("rob@example.com", undefined), false);
  assert.equal(isOwnerEmail(null, "rob@example.com"), false);
});

test("brag-live mail escapes the spot name and skips empty urls", () => {
  const mail = bragLiveEmail({
    spotName: "Anne&Max",
    url: "http://77.42.31.66/nl/haarlem/anne-max",
  });
  assert.ok(mail);
  assert.equal(mail.subject, "Je brag is live op brag.fast");
  assert.ok(mail.html.includes("Anne&amp;Max"));
  assert.ok(mail.html.includes("http://77.42.31.66/nl/haarlem/anne-max"));
  assert.equal(bragLiveEmail({ spotName: "X", url: "  " }), null);
});

const HARD_EMBED = {
  platform: "instagram" as const,
  permalink: "https://www.instagram.com/p/BragFastHardTag/",
  platformMediaId: "BragFastHardTag",
};

test("social ingest attaches hard tags, queues captions, and skips the rest", () => {
  assert.deepEqual(
    planSocialIngest(
      {
        caption: "eggs in Haarlem",
        locationPlaceId: "seed:nl:haarlem:stach",
        embed: HARD_EMBED,
      },
      null,
    ),
    { action: "skip", reason: "no-hashtag" },
  );
  assert.deepEqual(
    planSocialIngest(
      {
        caption: "brunch #bragfast",
        locationPlaceId: "seed:nl:haarlem:stach",
        embed: HARD_EMBED,
      },
      null,
    ),
    { action: "attach", placeId: "seed:nl:haarlem:stach" },
  );
  assert.deepEqual(
    planSocialIngest(
      {
        caption: "Jopenkerk #bragfast",
        locationPlaceId: null,
        embed: HARD_EMBED,
      },
      null,
    ),
    { action: "queue", caption: "Jopenkerk #bragfast" },
  );
  assert.deepEqual(
    planSocialIngest(
      {
        caption: "brunch #bragfast",
        locationPlaceId: "seed:nl:haarlem:stach",
        embed: HARD_EMBED,
      },
      "BragFastHardTag",
    ),
    { action: "skip", reason: "duplicate" },
  );
});

test("caption match proposes a unique spot name and refuses ties", () => {
  const spots = [{ name: "Jopenkerk" }, { name: "STACH Haarlem" }];
  assert.deepEqual(planCaptionMatch("Breakfast at Jopenkerk #bragfast", spots), {
    name: "Jopenkerk",
  });
  assert.equal(
    planCaptionMatch("Jopenkerk and STACH Haarlem #bragfast", spots),
    null,
  );
  assert.equal(planCaptionMatch("somewhere #bragfast", spots), null);
});

test("maker merge rewrites ig keys once and keeps a second link", () => {
  assert.deepEqual(
    planMakerMerge({
      alreadyLinkedIgUserId: null,
      incomingIgUserId: "ig-1",
      userMakerKey: "user:abc",
    }),
    { action: "rewrite", from: "ig:ig-1", to: "user:abc" },
  );
  assert.deepEqual(
    planMakerMerge({
      alreadyLinkedIgUserId: "ig-1",
      incomingIgUserId: "ig-1",
      userMakerKey: "user:abc",
    }),
    { action: "keep" },
  );
});

test("instagram permalinks must be https instagram hosts", () => {
  assert.equal(
    isInstagramPermalink("https://www.instagram.com/p/BragFastHardTag/"),
    true,
  );
  assert.equal(isInstagramPermalink("https://evil.example/p/x"), false);
  assert.equal(isInstagramPermalink("not a url"), false);
});

test("official embeds point at Instagram and YouTube players, never a hosted file", () => {
  assert.equal(
    officialEmbedSrc({
      platform: "instagram",
      permalink: "https://www.instagram.com/p/BragFastHardTag/?igsh=abc",
      platformMediaId: "1",
    }),
    "https://www.instagram.com/p/BragFastHardTag/embed",
  );
  assert.equal(
    officialEmbedSrc({
      platform: "instagram",
      permalink: "https://instagram.com/reel/ReelCode99/embed",
      platformMediaId: "2",
    }),
    "https://www.instagram.com/reel/ReelCode99/embed",
  );
  assert.equal(
    officialEmbedSrc({
      platform: "instagram",
      permalink: "https://www.instagram.com/jopenkerk/",
      platformMediaId: "3",
    }),
    null,
  );
  assert.equal(
    officialEmbedSrc({
      platform: "youtube",
      permalink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      platformMediaId: "yt",
    }),
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(
    officialEmbedSrc({
      platform: "youtube",
      permalink: "https://youtu.be/dQw4w9WgXcQ",
      platformMediaId: "yt",
    }),
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(isYoutubePermalink("https://youtu.be/dQw4w9WgXcQ"), true);
  assert.equal(isYoutubePermalink("https://evil.example/watch?v=dQw4w9WgXcQ"), false);
});

test("maker confirm attaches a pending caption post onto the spot the author is on", () => {
  const base = {
    queueStatus: "pending" as const,
    queueMakerKey: "user:abc",
    userMakerKey: "user:abc",
    listingStatus: "listed" as const,
    existingSpotId: null,
    targetSpotId: "spot-jopen",
  };
  assert.deepEqual(planMakerMatchConfirm(base), {
    ok: true,
    action: "attach",
  });
  assert.deepEqual(
    planMakerMatchConfirm({ ...base, existingSpotId: "spot-jopen" }),
    { ok: true, action: "already" },
  );
  assert.deepEqual(
    planMakerMatchConfirm({ ...base, existingSpotId: "spot-other" }),
    { ok: false, reason: "duplicate" },
  );
  assert.deepEqual(
    planMakerMatchConfirm({ ...base, queueMakerKey: "ig:someone" }),
    { ok: false, reason: "not-owner" },
  );
  assert.deepEqual(
    planMakerMatchConfirm({ ...base, queueStatus: "approved" }),
    { ok: false, reason: "not-pending" },
  );
  assert.deepEqual(
    planMakerMatchConfirm({ ...base, listingStatus: "gravestone" }),
    { ok: false, reason: "closed" },
  );
});

test("instagram media parse skips rows without a permalink", () => {
  assert.equal(parseInstagramMedia({ id: "1", caption: "x" }), null);
  const media = parseInstagramMedia({
    id: "1784",
    caption: "Brunch at STACH #bragfast",
    permalink: "https://www.instagram.com/p/Abc/",
    timestamp: "2026-01-15T09:00:00+0000",
    location: { id: "ig-loc", name: "STACH Haarlem" },
  });
  assert.equal(media?.id, "1784");
  assert.equal(media?.locationName, "STACH Haarlem");
  assert.equal(media?.createdAt, Date.parse("2026-01-15T09:00:00+0000"));
  assert.deepEqual(instagramEmbed(media!), {
    platform: "instagram",
    permalink: "https://www.instagram.com/p/Abc/",
    platformMediaId: "1784",
  });
});

test("instagram location name maps to a unique catalog Place ID", () => {
  const spots = [
    { name: "STACH Haarlem", placeId: "seed:stach" },
    { name: "Jopenkerk", placeId: "seed:jopen" },
  ];
  assert.equal(resolveLocationName("STACH Haarlem", spots), "seed:stach");
  assert.equal(resolveLocationName("Breakfast at Jopenkerk", spots), "seed:jopen");
  assert.equal(
    resolveLocationName("STACH Haarlem and Jopenkerk", spots),
    null,
  );
  assert.equal(resolveLocationName("somewhere else", spots), null);
});

test("place types go live for hospitality and queue for petrol", () => {
  assert.deepEqual(classifyPlaceTypes(["cafe", "store"]), {
    action: "live",
    spotType: "cafe",
  });
  assert.deepEqual(classifyPlaceTypes(["lodging"]), {
    action: "live",
    spotType: "hotel",
  });
  assert.deepEqual(classifyPlaceTypes(["breakfast_restaurant"]), {
    action: "live",
    spotType: "cafe",
  });
  assert.deepEqual(classifyPlaceTypes(["brunch_restaurant"]), {
    action: "live",
    spotType: "cafe",
  });
  assert.deepEqual(classifyPlaceTypes(["gas_station"]), {
    action: "queue",
    reason: "disallowed-type",
  });
  assert.equal(slugFromPlaceName("De Koffiesalon Haarlem"), "de-koffiesalon-haarlem");
});

const CAFE: PlacesSnapshot = {
  placeId: "seed:nl:haarlem:bregje",
  name: "Bregje",
  address: "Barteljorisstraat 10, Haarlem",
  geo: { lat: 52.3812, lng: 4.636 },
  types: ["cafe"],
  hours: null,
  businessStatus: "OPERATIONAL",
  citySlug: "haarlem",
};

test("hygiene closes listed petrol so it leaves the city list", () => {
  assert.deepEqual(
    planHygiene(
      { ...CAFE, types: ["gas_station"], name: "Shell Hygiene" },
      { placeId: "seed:nl:haarlem:hygiene-petrol", listingStatus: "listed" },
      10,
    ),
    { action: "close", closedAt: 10 },
  );
});

test("hygiene skips new fast food and closes listed fast food", () => {
  const mcd = {
    ...CAFE,
    name: "McDonald's Haarlem",
    types: ["fast_food_restaurant", "restaurant"],
  };
  assert.deepEqual(planHygiene(mcd, null, 10), {
    action: "skip",
    reason: "fast-food",
  });
  assert.deepEqual(
    planHygiene(mcd, { placeId: mcd.placeId, listingStatus: "listed" }, 40),
    { action: "close", closedAt: 40 },
  );
});

test("hygiene skips a newly discovered permanently closed bakery", () => {
  assert.deepEqual(
    planHygiene(
      {
        ...CAFE,
        types: ["bakery"],
        businessStatus: "CLOSED_PERMANENTLY",
        name: "Ghost Bakery",
      },
      null,
      10,
    ),
    { action: "skip", reason: "closed-unknown" },
  );
});

test("hygiene closes a listed permanently closed cafe", () => {
  assert.deepEqual(
    planHygiene(
      { ...CAFE, businessStatus: "CLOSED_PERMANENTLY" },
      { placeId: CAFE.placeId, listingStatus: "listed" },
      50,
    ),
    { action: "close", closedAt: 50 },
  );
});

test("hygiene noops gravestones and does not reopen them", () => {
  const grave = {
    placeId: "seed:nl:haarlem:oude-banketbakker",
    listingStatus: "gravestone" as const,
  };
  assert.deepEqual(
    planHygiene(
      {
        ...CAFE,
        placeId: grave.placeId,
        types: ["bakery"],
        businessStatus: "CLOSED_PERMANENTLY",
      },
      grave,
      10,
    ),
    { action: "noop" },
  );
  assert.deepEqual(
    planHygiene(
      {
        ...CAFE,
        placeId: grave.placeId,
        types: ["bakery"],
        name: "De Oude Banketbakker",
      },
      grave,
      10,
    ),
    { action: "noop" },
  );
});

test("hygiene inserts an operational cafe with no row", () => {
  assert.deepEqual(planHygiene(CAFE, null, 10), {
    action: "insert",
    spotType: "cafe",
  });
});

test("hygiene refreshes a listed operational bakery", () => {
  assert.deepEqual(
    planHygiene(
      { ...CAFE, types: ["bakery"], name: "Bakkerij Honing" },
      { placeId: CAFE.placeId, listingStatus: "listed" },
      10,
    ),
    { action: "refresh", spotType: "bakery" },
  );
});

test("hygiene inserts a temporarily closed cafe", () => {
  assert.deepEqual(
    planHygiene({ ...CAFE, businessStatus: "CLOSED_TEMPORARILY" }, null, 10),
    { action: "insert", spotType: "cafe" },
  );
});

test("Places hours map same-day clocks and drop overnight periods", () => {
  assert.deepEqual(
    placesHoursToOpeningHours(
      [
        {
          open: { day: 1, hour: 6, minute: 30 },
          close: { day: 1, hour: 16, minute: 0 },
        },
      ],
      "Europe/Amsterdam",
    ),
    {
      timezone: "Europe/Amsterdam",
      periods: [{ day: 1, open: "06:30", close: "16:00" }],
    },
  );
  assert.equal(
    placesHoursToOpeningHours(
      [
        {
          open: { day: 5, hour: 18, minute: 0 },
          close: { day: 6, hour: 2, minute: 0 },
        },
      ],
      "Europe/Amsterdam",
    ),
    null,
  );
  assert.equal(
    placesHoursToOpeningHours(
      [{ open: { day: 1, hour: 8, minute: 0 } }],
      "Europe/Amsterdam",
    ),
    null,
  );
  assert.deepEqual(
    placesHoursToOpeningHours(
      [
        {
          open: { day: 0, hour: 9, minute: 0 },
          close: { day: 0, hour: 12, minute: 0 },
        },
        {
          open: { day: 1, hour: 8, minute: 0 },
          close: { day: 2, hour: 1, minute: 0 },
        },
      ],
      "",
    ),
    {
      timezone: "Europe/Amsterdam",
      periods: [{ day: 0, open: "09:00", close: "12:00" }],
    },
  );
});

test("exact city search matches slug and localized names only", () => {
  const haarlem = {
    kind: "city" as const,
    slug: parseCitySlug("haarlem"),
    nameNl: "Haarlem",
    nameEn: "Haarlem",
  };
  const denHaag = {
    kind: "city" as const,
    slug: parseCitySlug("den-haag"),
    nameNl: "Den Haag",
    nameEn: "The Hague",
  };
  assert.equal(exactCitySlugFromHits("Haarlem", [haarlem, denHaag]), "haarlem");
  assert.equal(exactCitySlugFromHits("the hague", [haarlem, denHaag]), "den-haag");
  assert.equal(exactCitySlugFromHits("hoofddorp", [haarlem, denHaag]), "haarlemmermeer");
  assert.equal(exactCitySlugFromHits("ha", [haarlem, denHaag]), null);
  assert.equal(exactCitySlugFromHits("h", [haarlem]), null);
});

test("gazetteer is Dutch gemeenten, not dorpen", () => {
  const slugs = NL_CITIES.map((city) => city.slug);
  assert.ok(NL_CITIES.length >= 300);
  assert.ok(
    NL_CITIES.filter((city) => city.featuredOrder !== undefined).length === 9,
  );
  assert.ok(slugs.includes("maastricht"));
  assert.ok(slugs.includes("leiden"));
  assert.ok(slugs.includes("den-bosch"));
  assert.ok(slugs.includes("bloemendaal"));
  assert.ok(slugs.includes("haarlemmermeer"));
  assert.ok(!slugs.includes("hoofddorp"));
  assert.ok(!slugs.includes("schoorl"));
  assert.equal(canonicalCitySlug("hoofddorp"), "haarlemmermeer");
  assert.equal(canonicalCitySlug("den bosch"), "den-bosch");
  assert.equal(lookupGemeente("zaandam")?.nameNl, "Zaandam");
  for (const city of NL_CITIES) {
    assert.equal(parseCitySlug(city.slug), city.slug);
  }
});

test("assignCitySlug maps a point to the gemeente polygon", () => {
  assert.equal(assignCitySlug({ lat: 52.3812, lng: 4.636 }), "haarlem");
  assert.equal(assignCitySlug({ lat: 50.85, lng: 5.69 }), "maastricht");
  assert.equal(assignCitySlug({ lat: 52.3025, lng: 4.6889 }), "haarlemmermeer");
  assert.equal(assignCitySlug({ lat: 53.4, lng: 7.2 }), null);
});

test("Places free-tier budget stays on the Pro SKU cap", () => {
  assert.deepEqual(
    [...DISCOVERY_TYPES],
    [
      "cafe",
      "bakery",
      "hotel",
      "breakfast_restaurant",
      "brunch_restaurant",
      "coffee_shop",
    ],
  );
  assert.deepEqual([...DISCOVERY_QUERIES], ["ontbijt", "brunch"]);
  assert.equal(detailsBudgetLeft(0, 4000), 4000);
  assert.equal(detailsBudgetLeft(4000, 4000), 0);
  assert.equal(billingMonthKey(Date.UTC(2026, 8, 7)), "2026-09");
});

test("catalog fit rejects fast food before hospitality types", () => {
  assert.deepEqual(
    judgeCatalogFit({
      name: "McDonald's Haarlem",
      types: ["restaurant", "fast_food_restaurant"],
    }),
    {
      kind: "fast-food",
      evidence: { kind: "google-type", value: "fast_food_restaurant" },
    },
  );
  assert.equal(
    judgeCatalogFit({ name: "Burger King Enschede", types: ["restaurant"] })
      .kind,
    "fast-food",
  );
  assert.deepEqual(
    judgeCatalogFit({ name: "Anne&Max Haarlem", types: ["cafe"] }),
    { kind: "hospitality", spotType: "cafe" },
  );
  assert.deepEqual(
    judgeCatalogFit({ name: "Van der Valk", types: ["lodging", "hotel"] }),
    { kind: "hospitality", spotType: "hotel" },
  );
});

const LOETJE_HOURS = {
  timezone: "Europe/Amsterdam",
  periods: [{ day: 0, open: "11:30", close: "21:00" }],
};

test("catalog fit keeps breakfast types and drops dinner restaurants", () => {
  assert.deepEqual(
    judgeCatalogFit({ name: "Loetje Enschede", types: ["restaurant"] }),
    { kind: "not-hospitality" },
  );
  assert.deepEqual(
    judgeCatalogFit({
      name: "Loetje Enschede",
      types: ["restaurant"],
      hours: LOETJE_HOURS,
    }),
    { kind: "not-hospitality" },
  );
  assert.deepEqual(
    judgeCatalogFit({
      name: "Loetje Enschede",
      types: ["cafe"],
      hours: LOETJE_HOURS,
    }),
    { kind: "not-hospitality" },
  );
  assert.deepEqual(
    judgeCatalogFit({
      name: "Bakers & Roasters",
      types: ["restaurant"],
      hours: {
        timezone: "Europe/Amsterdam",
        periods: [{ day: 1, open: "08:00", close: "16:00" }],
      },
    }),
    { kind: "hospitality", spotType: "cafe" },
  );
  assert.deepEqual(
    judgeCatalogFit({
      name: "ETN Breakfast",
      types: ["breakfast_restaurant"],
    }),
    { kind: "hospitality", spotType: "cafe" },
  );
  assert.deepEqual(
    judgeCatalogFit({
      name: "Van der Valk",
      types: ["lodging", "hotel"],
      hours: {
        timezone: "Europe/Amsterdam",
        periods: [{ day: 1, open: "17:00", close: "23:00" }],
      },
    }),
    { kind: "hospitality", spotType: "hotel" },
  );
});

test("hygiene closes a listed steak restaurant once hours prove it is not breakfast", () => {
  assert.deepEqual(
    planHygiene(
      {
        ...CAFE,
        name: "Loetje Enschede",
        types: ["restaurant"],
        hours: LOETJE_HOURS,
      },
      { placeId: "seed:nl:enschede:loetje", listingStatus: "listed" },
      80,
    ),
    { action: "close", closedAt: 80 },
  );
  assert.deepEqual(
    planHygiene(
      { ...CAFE, name: "Loetje Enschede", types: ["restaurant"], hours: null },
      {
        placeId: "seed:nl:enschede:loetje",
        listingStatus: "listed",
        hours: LOETJE_HOURS,
      },
      80,
    ),
    { action: "close", closedAt: 80 },
  );
});

test("ingest walks the largest gemeenten first", () => {
  assert.deepEqual(
    orderGemeentenForIngest([
      { slug: "tiny", population: 900 },
      { slug: "haarlem", population: 160_000 },
      { slug: "amsterdam", population: 900_000 },
      { slug: "midsize", population: 25_000 },
      { slug: "eemnes", population: 10_065 },
      { slug: "oostzaan", population: 9_778 },
    ]).map((row) => row.slug),
    ["amsterdam", "haarlem", "midsize", "eemnes", "oostzaan", "tiny"],
  );
  assert.equal(INGEST_POPULATION_FLOOR, 20_000);
  assert.equal(NL_INGEST_GEMEENTEN[0]?.slug, "amsterdam");
  assert.equal(NL_INGEST_GEMEENTEN[1]?.slug, "rotterdam");
  assert.equal(NL_INGEST_GEMEENTEN[2]?.slug, "den-haag");
  assert.equal(NL_INGEST_GEMEENTEN.at(-1)?.slug, "schiermonnikoog");
  const firstSmall = NL_INGEST_GEMEENTEN.findIndex(
    (row) => row.population < INGEST_POPULATION_FLOOR,
  );
  assert.equal(firstSmall, 278);
  assert.ok(
    NL_INGEST_GEMEENTEN
      .slice(0, firstSmall)
      .every((row) => row.population >= INGEST_POPULATION_FLOOR),
  );
  const amsterdam = NL_INGEST_GEMEENTEN.findIndex((row) => row.slug === "amsterdam");
  const haarlem = NL_INGEST_GEMEENTEN.findIndex((row) => row.slug === "haarlem");
  assert.ok(amsterdam < haarlem);
  assert.equal(NL_INGEST_GEMEENTEN.length, 342);
});

test("ingest turn mixes oldest refresh with discovery and rotates the cursor", () => {
  assert.deepEqual(
    planIngestTurn({
      budget: 4,
      discoveredIds: ["new-a", "new-b", "new-c"],
      staleListedIds: ["old-a", "old-b"],
    }).fetch,
    [
      { placeId: "old-a", intent: "refresh" },
      { placeId: "new-a", intent: "discover" },
      { placeId: "old-b", intent: "refresh" },
      { placeId: "new-b", intent: "discover" },
    ],
  );
  assert.equal(nextCityIndex(341, 342), 0);
  assert.equal(nextCityIndex(0, 342), 1);
  const slugs = ["amsterdam", "rotterdam", "den-haag", "hellendoorn"];
  assert.equal(resolveIngestIndex(slugs, "den-haag", 0), 2);
  assert.equal(resolveIngestIndex(slugs, "hellendoorn", 0), 3);
  assert.equal(resolveIngestIndex(slugs, null, 2), 2);
  assert.equal(resolveIngestIndex(slugs, "gone", 1), 1);
});


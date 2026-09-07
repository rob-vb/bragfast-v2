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
} from "./geo";
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
  planCaptionMatch,
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

test("hygiene skips petrol even when a row exists", () => {
  assert.deepEqual(
    planHygiene(
      { ...CAFE, types: ["gas_station"], name: "Shell Hygiene" },
      { placeId: "seed:nl:haarlem:hygiene-petrol", listingStatus: "listed" },
      10,
    ),
    { action: "skip", reason: "not-hospitality" },
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
  assert.equal(exactCitySlugFromHits("ha", [haarlem, denHaag]), null);
  assert.equal(exactCitySlugFromHits("h", [haarlem]), null);
});

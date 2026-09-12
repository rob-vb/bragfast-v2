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
import { NL_CITIES, canonicalCitySlug } from "./cities";
import { assignPlaceSlug } from "./woonplaatsen";
import {
  isOwnerEmail,
  planClosedOverride,
  planReportReview,
} from "./moderation";
import { bragLiveEmail } from "./notify";
import { classifyPlaceTypes, planPlaceAdd, slugFromPlaceName } from "./placeAdd";
import { isMissingConvexFunction } from "./convexQuery";
import {
  POSTS_WEEK_MS,
  countPostsThisWeek,
  passportSlugCandidate,
  planMintPassport,
  planPassport,
  slugifyPassportName,
} from "./passport";
import { openNow, planSpotUpsert } from "./spot";
import { foodEstablishmentJsonLd } from "./jsonld";

test("slugs are parsed at the boundary", () => {
  assert.equal(parseCitySlug("den-haag"), "den-haag");
  assert.throws(() => parseCitySlug("Den Haag"));
});

test("user slugs require three characters, allow hyphens, and reject underscores", () => {
  assert.throws(() => parseUserSlug("ab"));
  assert.equal(parseUserSlug("abo"), "abo");
  assert.throws(() => parseUserSlug("foo_bar"));
  assert.equal(parseUserSlug("maker-a"), "maker-a");
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

test("JSON-LD omits image when none is licensed", () => {
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
  assert.equal(json.name, "Anne&Max Haarlem");
  assert.equal("image" in json, false);
});

test("JSON-LD keeps the name when an uploaded photo is present", () => {
  const json = foodEstablishmentJsonLd({
    name: "Anne&Max Haarlem",
    address: "Grote Houtstraat 1, Haarlem",
    cityName: "Haarlem",
    geo: { lat: 52.38, lng: 4.63 },
    hours: null,
    spotType: "cafe",
    url: "http://77.42.31.66/nl/haarlem/anne-max",
    image: { url: "https://focused-deer-318.convex.cloud/api/storage/photo" },
  });
  assert.equal(json.name, "Anne&Max Haarlem");
  assert.equal(
    json.image,
    "https://focused-deer-318.convex.cloud/api/storage/photo",
  );
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

test("planMintPassport keeps one passport, rejects a taken slug, and mints a free slug", () => {
  const slug = parseUserSlug("maker-a");
  assert.deepEqual(
    planMintPassport({
      existing: { slug: "kept-name", since: 10 },
      occupiedByOther: true,
      slug,
      now: 99,
    }),
    { action: "keep", slug: "kept-name", since: 10 },
  );
  assert.deepEqual(
    planMintPassport({
      existing: null,
      occupiedByOther: true,
      slug,
      now: 99,
    }),
    { action: "reject", reason: "collision" },
  );
  assert.deepEqual(
    planMintPassport({
      existing: null,
      occupiedByOther: false,
      slug,
      now: 99,
    }),
    { action: "mint", slug, since: 99 },
  );
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

test("report review resolves an open row and ignores already resolved", () => {
  const reportId = "report-1" as GenericId<"reports">;
  assert.deepEqual(
    planReportReview({
      reportStatus: "open",
      reportId,
      action: "restore",
    }),
    { ok: true, reportStatus: "resolved" },
  );
  assert.deepEqual(
    planReportReview({
      reportStatus: "open",
      reportId,
      action: "keepHidden",
    }),
    { ok: true, reportStatus: "resolved" },
  );
  assert.deepEqual(
    planReportReview({
      reportStatus: "resolved",
      reportId,
      action: "restore",
    }),
    { ok: false, reason: "not-open" },
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

test("place types go live for hospitality and reject petrol and fast food", () => {
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
    action: "reject",
    reason: "disallowed-type",
  });
  assert.deepEqual(classifyPlaceTypes(["fast_food"]), {
    action: "reject",
    reason: "disallowed-type",
  });
  assert.deepEqual(classifyPlaceTypes(["fast_food", "cafe"]), {
    action: "reject",
    reason: "disallowed-type",
  });
  assert.deepEqual(classifyPlaceTypes(["fast_food_restaurant"]), {
    action: "reject",
    reason: "disallowed-type",
  });
  assert.deepEqual(classifyPlaceTypes(["restaurant", "fast_food_restaurant"]), {
    action: "reject",
    reason: "disallowed-type",
  });
  assert.deepEqual(classifyPlaceTypes(["cafe"]), {
    action: "live",
    spotType: "cafe",
  });
  assert.equal(slugFromPlaceName("De Koffiesalon Haarlem"), "de-koffiesalon-haarlem");
});

test("isMissingConvexFunction swallows only a missing Convex function", () => {
  assert.equal(
    isMissingConvexFunction(
      new Error(
        "[Request ID: 70ff8c6e6a202263] Server Error\nCould not find public function for 'catalog:listedSpotsByCity'.",
      ),
    ),
    true,
  );
  assert.equal(
    isMissingConvexFunction(
      new Error("fetchQuery failed", {
        cause: new Error("Could not find function for 'catalog:spotPage'."),
      }),
    ),
    true,
  );
  assert.equal(isMissingConvexFunction(new Error("Convex timeout")), false);
  assert.equal(isMissingConvexFunction(new Error("Server Error")), false);
  assert.equal(
    isMissingConvexFunction({ data: "Could not find public function for 'catalog:listedSpotsByCity'." }),
    true,
  );
});

test("planPlaceAdd lives a café, redirects a duplicate placeId, and rejects fast food", () => {
  const haarlem = { lat: 52.3812, lng: 4.636 };
  const hoofddorp = { lat: 52.3025, lng: 4.6889 };
  assert.deepEqual(
    planPlaceAdd({
      types: ["cafe"],
      geo: haarlem,
      photo: true,
      existing: null,
    }),
    { action: "live", spotType: "cafe", placeSlug: "haarlem" },
  );
  assert.deepEqual(
    planPlaceAdd({
      types: ["cafe"],
      geo: haarlem,
      photo: true,
      existing: { spotSlug: "anne-max", placeSlug: "haarlem" },
    }),
    { action: "redirect", spotSlug: "anne-max", placeSlug: "haarlem" },
  );
  assert.deepEqual(
    planPlaceAdd({
      types: ["fast_food"],
      geo: haarlem,
      photo: true,
      existing: null,
    }),
    { action: "reject", reason: "disallowed-type" },
  );
  assert.deepEqual(
    planPlaceAdd({
      types: ["cafe"],
      geo: haarlem,
      photo: false,
      existing: null,
    }),
    { action: "reject", reason: "photo-required" },
  );
  assert.deepEqual(
    planPlaceAdd({
      types: ["cafe"],
      geo: hoofddorp,
      photo: true,
      existing: null,
    }),
    { action: "live", spotType: "cafe", placeSlug: "hoofddorp" },
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
  assert.equal(exactCitySlugFromHits("hoofddorp", [haarlem, denHaag]), "hoofddorp");
  assert.equal(exactCitySlugFromHits("ha", [haarlem, denHaag]), null);
  assert.equal(exactCitySlugFromHits("h", [haarlem]), null);
});

test("gazetteer is Dutch woonplaatsen, not gemeenten", () => {
  const slugs = NL_CITIES.map((city) => city.slug);
  assert.ok(NL_CITIES.length >= 2500);
  assert.ok(
    NL_CITIES.filter((city) => city.featuredOrder !== undefined).length === 9,
  );
  assert.ok(slugs.includes("hoofddorp"));
  assert.ok(slugs.includes("den-bosch"));
  assert.ok(slugs.includes("giethoorn"));
  assert.ok(slugs.includes("haarlem"));
  assert.ok(!slugs.includes("haarlemmermeer"));
  assert.equal(canonicalCitySlug("den bosch"), "den-bosch");
  assert.equal(canonicalCitySlug("hoofddorp"), "hoofddorp");
  assert.equal(canonicalCitySlug("giethoorn"), "giethoorn");
  for (const city of NL_CITIES) {
    assert.equal(parseCitySlug(city.slug), city.slug);
  }
});

test("assignPlaceSlug maps a point to the woonplaats polygon", () => {
  assert.equal(assignPlaceSlug({ lat: 52.3812, lng: 4.636 }), "haarlem");
  assert.equal(assignPlaceSlug({ lat: 50.85, lng: 5.69 }), "maastricht");
  assert.equal(assignPlaceSlug({ lat: 52.3025, lng: 4.6889 }), "hoofddorp");
  assert.equal(assignPlaceSlug({ lat: 53.4, lng: 7.2 }), null);
});

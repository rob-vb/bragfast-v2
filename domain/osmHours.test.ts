import assert from "node:assert/strict";
import test from "node:test";
import type { GenericId } from "convex/values";
import {
  matchHourlessSpots,
  overpassHoursQueries,
  parseOsmOpeningHours,
  planOsmHoursWalk,
  readOverpassVenues,
  scoreVenueName,
  type HourlessSpot,
  type OsmVenue,
} from "./osmHours";

const TZ = "Europe/Amsterdam";

function period(
  day: number,
  open: string,
  close: string,
): { day: number; open: string; close: string } {
  return { day, open, close };
}

test("OSM weekday ranges and PH off become weekly periods", () => {
  const hours = parseOsmOpeningHours(
    "Mo-Sa 10:00-16:00; Su 12:00-16:00; PH off",
    TZ,
  );
  assert.deepEqual(hours, {
    timezone: TZ,
    periods: [
      period(0, "12:00", "16:00"),
      period(1, "10:00", "16:00"),
      period(2, "10:00", "16:00"),
      period(3, "10:00", "16:00"),
      period(4, "10:00", "16:00"),
      period(5, "10:00", "16:00"),
      period(6, "10:00", "16:00"),
    ],
  });
});

test("OSM later off rule replaces that weekday", () => {
  const hours = parseOsmOpeningHours("Mo-Fr 08:00-18:00; We off", TZ);
  assert.deepEqual(
    hours?.periods.map((row) => row.day),
    [1, 2, 4, 5],
  );
});

test("OSM same-day extra range and extra Saturday stay", () => {
  assert.deepEqual(
    parseOsmOpeningHours("Mo-Fr 08:00-12:00,13:00-17:00", TZ)?.periods.filter(
      (row) => row.day === 1,
    ),
    [period(1, "08:00", "12:00"), period(1, "13:00", "17:00")],
  );
  assert.equal(
    parseOsmOpeningHours("Mo-Fr 08:00-17:00, Sa 09:00-14:00", TZ)?.periods.some(
      (row) => row.day === 6 && row.open === "09:00",
    ),
    true,
  );
});

test("OSM 24/7 is every day; overnight-only and closed stay null", () => {
  assert.equal(parseOsmOpeningHours("24/7", TZ)?.periods.length, 7);
  assert.equal(parseOsmOpeningHours("Mo-Su 08:30-01:00", TZ), null);
  assert.equal(parseOsmOpeningHours("closed", TZ), null);
  assert.equal(parseOsmOpeningHours("Mo-Fr 08:00-18:00; Dec 25 off", TZ), null);
});

test("OSM comma day lists and 24:00 close parse", () => {
  const hours = parseOsmOpeningHours("Mo-We,Sa-Su 08:30-24:00; Th-Fr 08:30-01:00", TZ);
  assert.equal(hours?.periods.some((row) => row.day === 1 && row.close === "24:00"), true);
  assert.equal(hours?.periods.some((row) => row.day === 4), false);
});

test("OSM name match strips the gemeente and accepts slug containment", () => {
  assert.equal(
    scoreVenueName("Anne&Max Haarlem", "Anne & Max", "haarlem"),
    "exact",
  );
  assert.equal(scoreVenueName("Toast", "Toast", "haarlem"), "exact");
  assert.equal(scoreVenueName("Cafe Brinkmann", "Café Brinkmann", "haarlem"), "exact");
  assert.equal(scoreVenueName("Intertoys", "Het Broodjeshuis", "haarlem"), null);
  assert.equal(
    scoreVenueName("Teds Amsterdam de Pijp - All Day Brunch", "Teds", "amsterdam"),
    "subset",
  );
  assert.equal(
    scoreVenueName("Locals All Day Brunch", "Locals", "amsterdam"),
    "exact",
  );
  assert.equal(scoreVenueName("Cafe de Pijp", "Café", "amsterdam"), null);
});

test("OSM hours fill matches a nearby same-name cafe and skips a florist", () => {
  const spot: HourlessSpot = {
    id: "spot-1" as GenericId<"spots">,
    name: "Anne&Max Haarlem",
    geo: { lat: 52.381, lng: 4.637 },
    citySlug: "haarlem",
  };
  const venues: OsmVenue[] = [
    {
      name: "Anne & Max",
      geo: { lat: 52.3811, lng: 4.6371 },
      hours: {
        kind: "parsed",
        hours: parseOsmOpeningHours("Mo-Sa 08:00-17:00; Su 09:00-17:00")!,
      },
    },
    {
      name: "Bloemenwinkel Anne",
      geo: { lat: 52.3812, lng: 4.6369 },
      hours: {
        kind: "parsed",
        hours: parseOsmOpeningHours("Mo-Fr 09:00-18:00")!,
      },
    },
  ];
  const decisions = matchHourlessSpots([spot], venues);
  assert.equal(decisions[0]?.action, "fill");
  if (decisions[0]?.action === "fill") {
    assert.deepEqual(decisions[0].hours.periods[0], period(0, "09:00", "17:00"));
  }
});

test("OSM hours fill skips when two nearby same-name venues disagree", () => {
  const spot: HourlessSpot = {
    id: "spot-2" as GenericId<"spots">,
    name: "Toast",
    geo: { lat: 52.38, lng: 4.636 },
    citySlug: "haarlem",
  };
  const decisions = matchHourlessSpots(
    [spot],
    [
      {
        name: "Toast",
        geo: { lat: 52.3801, lng: 4.6361 },
        hours: { kind: "parsed", hours: parseOsmOpeningHours("Mo-Su 08:00-17:00")! },
      },
      {
        name: "Toast",
        geo: { lat: 52.3802, lng: 4.6362 },
        hours: { kind: "parsed", hours: parseOsmOpeningHours("Mo-Su 09:00-18:00")! },
      },
    ],
  );
  assert.deepEqual(decisions[0], { action: "skip", spot, reason: "ambiguous" });
});

test("OSM hours fill skips an unparseable assigned venue instead of falling through", () => {
  const spot: HourlessSpot = {
    id: "spot-4" as GenericId<"spots">,
    name: "Seasonal",
    geo: { lat: 52.381, lng: 4.637 },
    citySlug: "haarlem",
  };
  const decisions = matchHourlessSpots(
    [spot],
    [
      {
        name: "Seasonal",
        geo: { lat: 52.381, lng: 4.637 },
        hours: { kind: "unparseable" },
      },
    ],
  );
  assert.deepEqual(decisions[0], { action: "skip", spot, reason: "unparseable" });
});

test("OSM hours walk skips empty gemeenten and stops after the Overpass budget", () => {
  const walk = planOsmHoursWalk({
    startIndex: 0,
    slugs: ["amsterdam", "haarlem", "rotterdam"],
    hasHourless: (slug) => slug !== "amsterdam",
    overpassBudget: 1,
  });
  assert.deepEqual(walk.visit, ["haarlem"]);
  assert.equal(walk.nextIndex, 2);
});

test("Overpass around query stays scoped to our pins", () => {
  const queries = overpassHoursQueries([{ lat: 52.38, lng: 4.636 }]);
  assert.equal(queries.length, 1);
  assert.match(queries[0] ?? "", /around:75,52.38000,4.63600/);
});

test("Overpass parse drops fast food and nameless elements", () => {
  const venues = readOverpassVenues({
    elements: [
      {
        type: "node",
        lat: 52.38,
        lon: 4.63,
        tags: {
          name: "Haerlemsche Vlaamse",
          amenity: "fast_food",
          opening_hours: "Mo-Su 12:00-18:00",
        },
      },
      {
        type: "node",
        lat: 52.38,
        lon: 4.63,
        tags: {
          name: "Toast",
          amenity: "cafe",
          opening_hours: "Mo-Su 08:00-17:00",
        },
      },
    ],
  });
  assert.equal(venues.length, 1);
  assert.equal(venues[0]?.name, "Toast");
  assert.equal(venues[0]?.hours.kind, "parsed");
});

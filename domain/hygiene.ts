import { catalogTypesFromStored, judgeCatalogFit } from "./catalogVerdict";
import { openingHoursFromPeriods, type OpeningHours, type SpotType } from "./spot";

export type PlacesBusinessStatus =
  | "OPERATIONAL"
  | "CLOSED_TEMPORARILY"
  | "CLOSED_PERMANENTLY";

export type PlacesSnapshot = {
  placeId: string;
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  types: readonly string[];
  hours: OpeningHours | null;
  businessStatus: PlacesBusinessStatus;
  citySlug: string;
};

export type HygieneExisting = {
  placeId: string;
  listingStatus: "listed" | "gravestone";
  hours?: OpeningHours | null;
} | null;

export type HygienePlan =
  | { action: "skip"; reason: "not-hospitality" | "closed-unknown" | "fast-food" }
  | { action: "noop" }
  | { action: "insert"; spotType: SpotType }
  | { action: "refresh"; spotType: SpotType }
  | { action: "close"; closedAt: number };

export type PlacesHoursPeriod = {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
};

function clock(point: { hour: number; minute: number }): string {
  return `${String(point.hour).padStart(2, "0")}:${String(point.minute).padStart(2, "0")}`;
}

export function placesHoursToOpeningHours(
  periods: readonly PlacesHoursPeriod[],
  timezone: string,
): OpeningHours | null {
  const mapped: OpeningHours["periods"] = [];
  for (const period of periods) {
    const close = period.close;
    if (!close || period.open.day !== close.day) {
      continue;
    }
    mapped.push({
      day: period.open.day,
      open: clock(period.open),
      close: clock(close),
    });
  }
  return openingHoursFromPeriods(mapped, timezone);
}

export function snapshotFromListedSpot(input: {
  placeId: string;
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  hours: OpeningHours | null;
  spotType: SpotType;
  citySlug: string;
  placesRaw: unknown;
}): PlacesSnapshot {
  return {
    placeId: input.placeId,
    name: input.name,
    address: input.address,
    geo: input.geo,
    types: catalogTypesFromStored({
      spotType: input.spotType,
      placesRaw: input.placesRaw,
    }),
    hours: input.hours,
    businessStatus: "OPERATIONAL",
    citySlug: input.citySlug,
  };
}

export function planHygiene(
  snapshot: PlacesSnapshot,
  existing: HygieneExisting,
  now: number,
): HygienePlan {
  const fit = judgeCatalogFit({
    name: snapshot.name,
    types: snapshot.types,
    hours: snapshot.hours ?? existing?.hours ?? null,
  });
  if (fit.kind === "fast-food") {
    if (existing?.listingStatus === "listed") {
      return { action: "close", closedAt: now };
    }
    return { action: "skip", reason: "fast-food" };
  }
  if (fit.kind === "not-hospitality") {
    if (existing?.listingStatus === "listed") {
      return { action: "close", closedAt: now };
    }
    return { action: "skip", reason: "not-hospitality" };
  }

  if (snapshot.businessStatus === "CLOSED_PERMANENTLY") {
    if (existing?.listingStatus === "listed") {
      return { action: "close", closedAt: now };
    }
    if (existing === null) {
      return { action: "skip", reason: "closed-unknown" };
    }
    return { action: "noop" };
  }

  if (existing === null) {
    return { action: "insert", spotType: fit.spotType };
  }
  if (existing.listingStatus === "listed") {
    return { action: "refresh", spotType: fit.spotType };
  }
  return { action: "noop" };
}

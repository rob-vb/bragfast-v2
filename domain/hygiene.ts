import { classifyPlaceTypes } from "./placeAdd";
import type { OpeningHours, SpotType } from "./spot";

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
} | null;

export type HygienePlan =
  | { action: "skip"; reason: "not-hospitality" | "closed-unknown" }
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
  const zone = timezone.length > 0 ? timezone : "Europe/Amsterdam";
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
  if (mapped.length === 0) {
    return null;
  }
  return { timezone: zone, periods: mapped };
}

export function planHygiene(
  snapshot: PlacesSnapshot,
  existing: HygieneExisting,
  now: number,
): HygienePlan {
  const classified = classifyPlaceTypes(snapshot.types);
  if (classified.action === "queue") {
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
    return { action: "insert", spotType: classified.spotType };
  }
  if (existing.listingStatus === "listed") {
    return { action: "refresh", spotType: classified.spotType };
  }
  return { action: "noop" };
}

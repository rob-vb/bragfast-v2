import type { GenericId } from "convex/values";
import { v } from "convex/values";
import {
  DomainParseError,
  parseCitySlug,
  parsePlaceId,
  parseSpotSlug,
  type CitySlug,
  type PlaceId,
  type SpotSlug,
} from "./ids";

export const spotTypeValidator = v.union(
  v.literal("cafe"),
  v.literal("bakery"),
  v.literal("hotel"),
  v.literal("other"),
);

export type SpotType = "cafe" | "bakery" | "hotel" | "other";

export const openingHoursValidator = v.union(
  v.null(),
  v.object({
    timezone: v.string(),
    periods: v.array(
      v.object({
        day: v.number(),
        open: v.string(),
        close: v.string(),
      }),
    ),
  }),
);

export type OpeningHours = {
  timezone: string;
  periods: Array<{ day: number; open: string; close: string }>;
};

function minutesFromClock(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) {
    return Number.NaN;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59) {
    return Number.NaN;
  }
  if (hour === 24 && minute === 0) {
    return 24 * 60;
  }
  if (hour > 23) {
    return Number.NaN;
  }
  return hour * 60 + minute;
}

function formatClock(minutes: number): string {
  if (minutes === 24 * 60) {
    return "24:00";
  }
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function hasOpenBefore(hours: OpeningHours, cutoff: string): boolean {
  const limit = minutesFromClock(cutoff);
  if (!Number.isFinite(limit)) {
    return false;
  }
  return hours.periods.some((period) => {
    const open = minutesFromClock(period.open);
    return Number.isFinite(open) && open < limit;
  });
}

export function openingHoursFromPeriods(
  periods: ReadonlyArray<{ day: number; open: string; close: string }>,
  timezone: string,
): OpeningHours | null {
  const zone = timezone.length > 0 ? timezone : "Europe/Amsterdam";
  const mapped: OpeningHours["periods"] = [];
  for (const period of periods) {
    if (!Number.isInteger(period.day) || period.day < 0 || period.day > 6) {
      continue;
    }
    const open = minutesFromClock(period.open);
    const close = minutesFromClock(period.close);
    if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) {
      continue;
    }
    mapped.push({
      day: period.day,
      open: formatClock(open),
      close: formatClock(close),
    });
  }
  mapped.sort((a, b) => a.day - b.day || a.open.localeCompare(b.open));
  if (mapped.length === 0) {
    return null;
  }
  return { timezone: zone, periods: mapped };
}

export type SpotLifecycle =
  | { kind: "listed" }
  | { kind: "gravestone"; closedAt: number };

export type Spot = {
  id: GenericId<"spots">;
  placeId: PlaceId;
  slug: SpotSlug;
  citySlug: CitySlug;
  country: "nl";
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  hours: OpeningHours | null;
  spotType: SpotType;
  lifecycle: SpotLifecycle;
};

export type SpotDoc = {
  _id: GenericId<"spots">;
  placeId: string;
  slug: string;
  citySlug: string;
  country: "nl";
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  hours: OpeningHours | null;
  spotType: SpotType;
  listingStatus: "listed" | "gravestone";
  boardScore?: number;
  latestBragAt?: number;
  windowExpiresAt?: number;
  closedAt?: number;
  allTimeMakers: number;
};

function parseLifecycle(doc: SpotDoc): SpotLifecycle {
  if (doc.listingStatus === "gravestone") {
    if (doc.closedAt === undefined) {
      throw new DomainParseError("SpotLifecycle", JSON.stringify(doc));
    }
    return { kind: "gravestone", closedAt: doc.closedAt };
  }

  if (doc.closedAt !== undefined) {
    throw new DomainParseError("SpotLifecycle", JSON.stringify(doc));
  }

  return { kind: "listed" };
}

export function parseSpot(doc: SpotDoc): Spot {
  return {
    id: doc._id,
    placeId: parsePlaceId(doc.placeId),
    slug: parseSpotSlug(doc.slug),
    citySlug: parseCitySlug(doc.citySlug),
    country: doc.country,
    name: doc.name,
    address: doc.address,
    geo: doc.geo,
    hours: doc.hours,
    spotType: doc.spotType,
    lifecycle: parseLifecycle(doc),
  };
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function openNow(hours: OpeningHours | null, now: Date): boolean {
  if (!hours || hours.periods.length === 0) {
    return false;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: hours.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  const day = weekday ? WEEKDAY_INDEX[weekday] : undefined;
  if (day === undefined || hour === undefined || minute === undefined) {
    return false;
  }

  const current = Number(hour) * 60 + Number(minute);
  return hours.periods.some((period) => {
    if (period.day !== day) {
      return false;
    }
    const open = minutesFromClock(period.open);
    const close = minutesFromClock(period.close);
    return Number.isFinite(open) && Number.isFinite(close) && current >= open && current < close;
  });
}

export function isSeedPlaceId(placeId: string): boolean {
  return placeId.startsWith("seed:");
}

export type SpotUpsertPlan =
  | { action: "insert" }
  | { action: "patch"; via: "placeId" | "slug"; placeId: string };

export function planSpotUpsert(input: {
  incomingPlaceId: string;
  byPlaceId: { placeId: string } | null;
  bySlug: { placeId: string } | null;
}): SpotUpsertPlan {
  const incoming = parsePlaceId(input.incomingPlaceId);

  if (input.byPlaceId) {
    if (input.bySlug && input.bySlug.placeId !== input.byPlaceId.placeId) {
      throw new DomainParseError(
        "SpotUpsert",
        `${input.bySlug.placeId} occupies the slug of ${input.byPlaceId.placeId}`,
      );
    }
    return { action: "patch", via: "placeId", placeId: input.byPlaceId.placeId };
  }

  if (input.bySlug) {
    if (
      !isSeedPlaceId(input.bySlug.placeId) &&
      !isSeedPlaceId(incoming) &&
      input.bySlug.placeId !== incoming
    ) {
      throw new DomainParseError(
        "SpotUpsert",
        `${incoming} conflicts with ${input.bySlug.placeId}`,
      );
    }
    const placeId = isSeedPlaceId(input.bySlug.placeId)
      ? incoming
      : isSeedPlaceId(incoming)
        ? input.bySlug.placeId
        : incoming;
    return { action: "patch", via: "slug", placeId };
  }

  return { action: "insert" };
}

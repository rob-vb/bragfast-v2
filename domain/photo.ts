import { parseCitySlug, parseSpotSlug } from "./ids";
import { lookupWoonplaats } from "./cities";
import {
  planPlaceAdd,
  type PlaceAddPlan,
  type PlaceAddRejectReason,
} from "./placeAdd";

export type PhotoPublishChannel = "web" | "app";

export type PhotoPublishPlan =
  | Extract<PlaceAddPlan, { action: "live" | "reject" | "redirect" }>
  | { action: "attach" };

export type PhotoDeletePlan =
  | { action: "delete" }
  | { action: "reject"; reason: "not-owner" | "missing" };

export type HeroAfterDelete =
  | { kind: "keep"; storageId: string }
  | { kind: "promote"; storageId: string }
  | { kind: "empty" };

export function planPhotoPublish(input: {
  channel: PhotoPublishChannel;
  types: readonly string[];
  geo: { lat: number; lng: number };
  photo: boolean;
  existing: { spotSlug: string; placeSlug: string } | null;
}): PhotoPublishPlan {
  if (input.existing) {
    if (input.channel === "web") {
      return {
        action: "redirect",
        spotSlug: parseSpotSlug(input.existing.spotSlug),
        placeSlug: parseCitySlug(input.existing.placeSlug),
      };
    }
    if (!input.photo) {
      return { action: "reject", reason: "photo-required" };
    }
    return { action: "attach" };
  }
  return planPlaceAdd({
    types: input.types,
    geo: input.geo,
    photo: input.photo,
    existing: null,
  });
}

export type PlacePreviewPlan =
  | { kind: "new"; placeSlug: string; placeName: string }
  | { kind: "existing"; placeSlug: string; placeName: string; spotSlug: string }
  | { kind: "reject"; reason: PlaceAddRejectReason };

function woonplaatsName(placeSlug: string): string {
  return lookupWoonplaats(placeSlug)?.nameNl ?? placeSlug;
}

/**
 * What an app publish of this place would do, before any upload. A
 * prediction only: publish plans again on the server.
 */
export function planPlacePreview(input: {
  types: readonly string[];
  geo: { lat: number; lng: number };
  existing: { spotSlug: string; placeSlug: string } | null;
}): PlacePreviewPlan {
  const plan = planPhotoPublish({
    channel: "app",
    types: input.types,
    geo: input.geo,
    photo: true,
    existing: input.existing,
  });
  if (plan.action === "reject") {
    return { kind: "reject", reason: plan.reason };
  }
  if (plan.action === "live") {
    return {
      kind: "new",
      placeSlug: plan.placeSlug,
      placeName: woonplaatsName(plan.placeSlug),
    };
  }
  if (plan.action === "attach" && input.existing) {
    return {
      kind: "existing",
      placeSlug: input.existing.placeSlug,
      placeName: woonplaatsName(input.existing.placeSlug),
      spotSlug: input.existing.spotSlug,
    };
  }
  throw new Error(`Unexpected app publish plan: ${plan.action}`);
}

export function unusedPublishBlob(
  plan: PhotoPublishPlan,
): plan is Extract<PhotoPublishPlan, { action: "redirect" | "reject" }> {
  return plan.action === "redirect" || plan.action === "reject";
}

export function photoPublishWritesNewSpot(plan: PhotoPublishPlan): boolean {
  return plan.action === "live";
}

export function planPhotoDelete(input: {
  exists: boolean;
  owner: boolean;
}): PhotoDeletePlan {
  if (!input.exists) {
    return { action: "reject", reason: "missing" };
  }
  if (!input.owner) {
    return { action: "reject", reason: "not-owner" };
  }
  return { action: "delete" };
}

export function planHeroAfterDelete(input: {
  deletingStorageId: string;
  heroStorageId: string | null;
  remaining: { storageId: string; createdAt: number }[];
}): HeroAfterDelete {
  if (
    input.heroStorageId !== null &&
    input.heroStorageId !== input.deletingStorageId
  ) {
    return { kind: "keep", storageId: input.heroStorageId };
  }
  const oldest = [...input.remaining].sort(
    (a, b) => a.createdAt - b.createdAt,
  )[0];
  if (!oldest) {
    return { kind: "empty" };
  }
  return { kind: "promote", storageId: oldest.storageId };
}

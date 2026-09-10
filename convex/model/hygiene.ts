import type { MutationCtx } from "../_generated/server";
import {
  planHygiene,
  snapshotFromListedSpot,
  type HygieneExisting,
  type HygienePlan,
  type PlacesSnapshot,
} from "../../domain/hygiene";
import { slugFromPlaceName } from "../../domain/placeAdd";
import { upsertSpot } from "./spots";
import type { Doc } from "../_generated/dataModel";

export async function applySnapshot(
  ctx: MutationCtx,
  snapshot: PlacesSnapshot,
  now: number,
): Promise<HygienePlan> {
  const row = await ctx.db
    .query("spots")
    .withIndex("by_placeId", (q) => q.eq("placeId", snapshot.placeId))
    .unique();
  const existing: HygieneExisting = row
    ? {
        placeId: row.placeId,
        listingStatus: row.listingStatus,
        hours: row.hours,
      }
    : null;
  const plan = planHygiene(snapshot, existing, now);

  if (plan.action === "skip" || plan.action === "noop") {
    return plan;
  }

  if (plan.action === "close") {
    if (row) {
      await ctx.db.patch(row._id, {
        listingStatus: "gravestone",
        closedAt: plan.closedAt,
        lastSeenAt: now,
        boardScore: undefined,
        latestBragAt: undefined,
        windowExpiresAt: undefined,
      });
    }
    return plan;
  }

  await upsertSpot(ctx, {
    placeId: snapshot.placeId,
    slug: slugFromPlaceName(snapshot.name),
    citySlug: snapshot.citySlug,
    name: snapshot.name,
    address: snapshot.address,
    geo: snapshot.geo,
    hours: snapshot.hours ?? row?.hours ?? null,
    spotType: plan.spotType,
    listingStatus: "listed",
    lastSeenAt: now,
    placesRaw:
      plan.action === "insert"
        ? { source: "hygiene", types: [...snapshot.types] }
        : snapshot,
  });
  return plan;
}

export async function rejudgeStoredSpot(
  ctx: MutationCtx,
  row: Doc<"spots">,
  now: number,
): Promise<HygienePlan> {
  const snapshot = snapshotFromListedSpot({
    placeId: row.placeId,
    name: row.name,
    address: row.address,
    geo: row.geo,
    hours: row.hours,
    spotType: row.spotType,
    citySlug: row.citySlug,
    placesRaw: row.placesRaw,
  });
  const plan = planHygiene(
    snapshot,
    {
      placeId: row.placeId,
      listingStatus: row.listingStatus,
      hours: row.hours,
    },
    now,
  );
  if (plan.action === "close") {
    await ctx.db.patch(row._id, {
      listingStatus: "gravestone",
      closedAt: plan.closedAt,
      lastSeenAt: now,
      boardScore: undefined,
      latestBragAt: undefined,
      windowExpiresAt: undefined,
    });
  }
  return plan;
}

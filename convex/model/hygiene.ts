import type { MutationCtx } from "../_generated/server";
import {
  planHygiene,
  type HygieneExisting,
  type HygienePlan,
  type PlacesSnapshot,
} from "../../domain/hygiene";
import { slugFromPlaceName } from "../../domain/placeAdd";
import { upsertSpot } from "./spots";

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
    ? { placeId: row.placeId, listingStatus: row.listingStatus }
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
    hours: snapshot.hours,
    spotType: plan.spotType,
    listingStatus: "listed",
    placesRaw: plan.action === "insert" ? { source: "hygiene" } : snapshot,
  });
  return plan;
}

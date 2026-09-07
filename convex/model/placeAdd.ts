import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { parseCitySlug, parsePlaceId, parseSpotSlug } from "../../domain/ids";
import { classifyPlaceTypes, slugFromPlaceName } from "../../domain/placeAdd";
import { upsertSpot } from "./spots";

export async function applyPlaceAdd(
  ctx: MutationCtx,
  input: {
    placeId: string;
    name: string;
    address: string;
    geo: { lat: number; lng: number };
    types: string[];
    citySlug: string;
    submittedBy: Id<"users">;
  },
): Promise<void> {
  const placeId = parsePlaceId(input.placeId);
  const citySlug = parseCitySlug(input.citySlug);
  const plan = classifyPlaceTypes(input.types);
  if (plan.action === "live") {
    const slug = parseSpotSlug(slugFromPlaceName(input.name));
    await upsertSpot(ctx, {
      placeId,
      slug,
      citySlug,
      name: input.name,
      address: input.address,
      geo: input.geo,
      hours: null,
      spotType: plan.spotType,
      listingStatus: "listed",
    });
    return;
  }

  const existing = await ctx.db
    .query("spotAddQueue")
    .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
    .collect();
  if (existing.some((row) => row.status === "pending")) {
    return;
  }
  await ctx.db.insert("spotAddQueue", {
    placeId,
    name: input.name,
    address: input.address,
    geo: input.geo,
    types: [...input.types],
    citySlug,
    submittedBy: input.submittedBy,
    status: "pending",
  });
}

export async function approveSpotAdd(
  ctx: MutationCtx,
  queueId: Id<"spotAddQueue">,
): Promise<void> {
  const row = await ctx.db.get(queueId);
  if (!row) {
    throw new ConvexError("Spot add not found");
  }
  if (row.status === "approved") {
    return;
  }
  if (row.status !== "pending") {
    throw new ConvexError("Spot add is not pending");
  }
  const slug = parseSpotSlug(slugFromPlaceName(row.name));
  await upsertSpot(ctx, {
    placeId: row.placeId,
    slug,
    citySlug: row.citySlug,
    name: row.name,
    address: row.address,
    geo: row.geo,
    hours: null,
    spotType: "other",
    listingStatus: "listed",
  });
  await ctx.db.patch(queueId, { status: "approved" });
}

export async function rejectSpotAdd(
  ctx: MutationCtx,
  queueId: Id<"spotAddQueue">,
): Promise<void> {
  const row = await ctx.db.get(queueId);
  if (!row) {
    throw new ConvexError("Spot add not found");
  }
  if (row.status === "rejected") {
    return;
  }
  if (row.status !== "pending") {
    throw new ConvexError("Spot add is not pending");
  }
  await ctx.db.patch(queueId, { status: "rejected" });
}

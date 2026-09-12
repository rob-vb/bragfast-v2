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
  if (plan.action !== "live") {
    return;
  }
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
}

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { parseCitySlug, parsePlaceId, parseSpotSlug } from "../../domain/ids";
import {
  planPhotoPublish,
  unusedPublishBlob,
  type PhotoPublishChannel,
} from "../../domain/photo";
import { slugFromPlaceName, type PlaceAddPlan } from "../../domain/placeAdd";
import { insertSpotPhoto } from "./photos";
import { upsertSpot } from "./spots";

export type PlaceAddCommit =
  | Extract<PlaceAddPlan, { action: "redirect" | "reject" }>
  | (Extract<PlaceAddPlan, { action: "live" }> & {
      spotSlug: ReturnType<typeof parseSpotSlug>;
    })
  | {
      action: "attach";
      spotSlug: ReturnType<typeof parseSpotSlug>;
      placeSlug: ReturnType<typeof parseCitySlug>;
    };

async function uniqueSpotSlug(
  ctx: MutationCtx,
  citySlug: string,
  name: string,
): Promise<ReturnType<typeof parseSpotSlug>> {
  const root = slugFromPlaceName(name);
  for (let n = 0; n < 50; n += 1) {
    const candidate = parseSpotSlug(n === 0 ? root : `${root}-${n + 1}`);
    const taken = await ctx.db
      .query("spots")
      .withIndex("by_city_slug", (q) =>
        q.eq("citySlug", citySlug).eq("slug", candidate),
      )
      .unique();
    if (!taken) {
      return candidate;
    }
  }
  return parseSpotSlug(`${root}-spot`);
}

export async function applyPlaceAdd(
  ctx: MutationCtx,
  input: {
    placeId: string;
    name: string;
    address: string;
    geo: { lat: number; lng: number };
    types: string[];
    photoId: Id<"_storage"> | null;
    addedBy: Id<"users">;
    channel?: PhotoPublishChannel;
  },
): Promise<PlaceAddCommit> {
  const placeId = parsePlaceId(input.placeId);
  const byPlaceId = await ctx.db
    .query("spots")
    .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
    .unique();
  const photoId = input.photoId;
  const photoOk =
    photoId !== null && (await ctx.storage.getUrl(photoId)) !== null;
  const plan = planPhotoPublish({
    channel: input.channel ?? "web",
    types: input.types,
    geo: input.geo,
    photo: photoOk,
    existing: byPlaceId
      ? { spotSlug: byPlaceId.slug, placeSlug: byPlaceId.citySlug }
      : null,
  });
  if (plan.action === "attach") {
    if (!byPlaceId || photoId === null) {
      if (photoId !== null) {
        await ctx.storage.delete(photoId);
      }
      return { action: "reject", reason: "photo-required" };
    }
    await insertSpotPhoto(ctx, {
      spotId: byPlaceId._id,
      storageId: photoId,
      uploadedBy: input.addedBy,
    });
    if (byPlaceId.photoId === undefined) {
      await ctx.db.patch(byPlaceId._id, { photoId });
    }
    return {
      action: "attach",
      spotSlug: parseSpotSlug(byPlaceId.slug),
      placeSlug: parseCitySlug(byPlaceId.citySlug),
    };
  }
  if (unusedPublishBlob(plan)) {
    if (photoId !== null) {
      await ctx.storage.delete(photoId);
    }
    return plan;
  }
  if (photoId === null) {
    return { action: "reject", reason: "photo-required" };
  }
  const slug = await uniqueSpotSlug(ctx, plan.placeSlug, input.name);
  const spotId = await upsertSpot(ctx, {
    placeId,
    slug,
    citySlug: plan.placeSlug,
    name: input.name,
    address: input.address,
    geo: input.geo,
    hours: null,
    spotType: plan.spotType,
    listingStatus: "listed",
    photoId,
    addedBy: input.addedBy,
  });
  await insertSpotPhoto(ctx, {
    spotId,
    storageId: photoId,
    uploadedBy: input.addedBy,
  });
  return { ...plan, spotSlug: slug };
}

import type { MutationCtx } from "../_generated/server";
import { components } from "../_generated/api";
import { syncSpotLikes } from "../likes";
import { deleteOwnPhoto } from "./photos";

const PAGE = { numItems: 200, cursor: null };

// Erase one account: gallery photos (with hero succession), likes, the adder
// mark on spots, the app user row, then the Better Auth user and its logins.
// Spots stay in the catalog; a place is not personal data.
export async function deleteAccount(
  ctx: MutationCtx,
  authId: string,
): Promise<{ photos: number; likes: number; spots: number }> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", authId))
    .unique();

  let photos = 0;
  let likes = 0;
  let spots = 0;
  if (user) {
    const ownPhotos = await ctx.db
      .query("photos")
      .withIndex("by_user", (q) => q.eq("uploadedBy", user._id))
      .collect();
    for (const photo of ownPhotos) {
      const result = await deleteOwnPhoto(ctx, {
        photoId: photo._id,
        userId: user._id,
      });
      if (result.action === "delete") {
        photos += 1;
      }
    }

    const ownLikes = await ctx.db
      .query("likes")
      .withIndex("by_user_spot", (q) => q.eq("userId", user._id))
      .collect();
    for (const like of ownLikes) {
      await ctx.db.delete(like._id);
    }
    likes = ownLikes.length;
    for (const spotId of new Set(ownLikes.map((like) => like.spotId))) {
      if (await ctx.db.get(spotId)) {
        await syncSpotLikes(ctx, spotId);
      }
    }

    const allSpots = await ctx.db.query("spots").collect();
    for (const spot of allSpots) {
      if (spot.addedBy === user._id) {
        await ctx.db.patch(spot._id, { addedBy: undefined });
        spots += 1;
      }
    }

    await ctx.db.delete(user._id);
  }

  for (const model of ["session", "account", "twoFactor"] as const) {
    await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
      input: { model, where: [{ field: "userId", value: authId }] },
      paginationOpts: PAGE,
    });
  }
  await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
    input: { model: "user", where: [{ field: "_id", value: authId }] },
  });

  return { photos, likes, spots };
}

import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { serializeMakerKey } from "../../domain/makerKey";
import { planMakerMerge } from "../../domain/social";
import { instagramEmbed, resolveLocationName } from "../../domain/instagram";
import type { InstagramMedia } from "../../domain/instagram";
import { applyVisiblePosts } from "./votes";
import { ensureUserByAuthId } from "./users";
import { ingestSocial } from "./social";

export async function mergeMakerKeys(
  ctx: MutationCtx,
  input: { from: string; to: string },
): Promise<void> {
  if (input.from === input.to) {
    return;
  }
  const posts = await ctx.db
    .query("posts")
    .withIndex("by_maker_created", (q) => q.eq("makerKey", input.from))
    .collect();
  const spotIds = new Set<Id<"spots">>();
  for (const post of posts) {
    spotIds.add(post.spotId);
    await ctx.db.patch(post._id, { makerKey: input.to });
  }
  const queued = await ctx.db.query("aiMatchQueue").collect();
  for (const row of queued) {
    if (row.makerKey === input.from) {
      await ctx.db.patch(row._id, { makerKey: input.to });
    }
  }
  for (const spotId of spotIds) {
    await applyVisiblePosts(ctx, { spotId, makerKey: input.from });
    await applyVisiblePosts(ctx, { spotId, makerKey: input.to });
  }
}

export async function completeInstagramLink(
  ctx: MutationCtx,
  input: {
    authId: string;
    displayName: string;
    avatarUrl: string | null;
    igUserId: string;
    accessToken: string;
    expiresAt: number;
  },
): Promise<{ makerKey: string; userId: Id<"users"> }> {
  const user = await ensureUserByAuthId(ctx, {
    authId: input.authId,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
  });
  const occupied = await ctx.db
    .query("users")
    .withIndex("by_igUserId", (q) => q.eq("igUserId", input.igUserId))
    .unique();
  if (occupied && occupied._id !== user._id) {
    throw new ConvexError("Instagram already linked to another account");
  }
  const makerKey = serializeMakerKey({ kind: "user", userId: user._id });
  const plan = planMakerMerge({
    alreadyLinkedIgUserId: user.igUserId,
    incomingIgUserId: input.igUserId,
    userMakerKey: makerKey,
  });
  await ctx.db.patch(user._id, {
    igUserId: input.igUserId,
    igAccessToken: input.accessToken,
    igTokenExpiresAt: input.expiresAt,
  });
  if (plan.action === "rewrite") {
    await mergeMakerKeys(ctx, { from: plan.from, to: plan.to });
  }
  return { makerKey, userId: user._id };
}

export async function unlinkInstagram(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  await ctx.db.patch(userId, {
    igUserId: null,
    igAccessToken: null,
    igTokenExpiresAt: null,
  });
}

export async function ingestInstagramMedia(
  ctx: MutationCtx,
  input: { makerKey: string; media: InstagramMedia },
): Promise<void> {
  const listed = (await ctx.db.query("spots").collect()).filter(
    (spot) => spot.listingStatus === "listed",
  );
  const locationPlaceId = resolveLocationName(
    input.media.locationName,
    listed.map((spot) => ({ name: spot.name, placeId: spot.placeId })),
  );
  await ingestSocial(ctx, {
    caption: input.media.caption,
    locationPlaceId,
    makerKey: input.makerKey,
    embed: instagramEmbed(input.media),
    createdAt: input.media.createdAt ?? undefined,
  });
}

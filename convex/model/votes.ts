import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { computeStanding } from "../../domain/ranking";
import { desiredVote, reconcileVote, type VoteStanding } from "../../domain/vote";

export async function refreshSpotStanding(
  ctx: MutationCtx,
  spotId: Id<"spots">,
): Promise<void> {
  const spot = await ctx.db.get(spotId);
  if (!spot) {
    throw new Error("Spot missing while refreshing standing");
  }

  const votes = await ctx.db
    .query("makerVotes")
    .withIndex("by_spot_maker", (q) => q.eq("spotId", spotId))
    .collect();
  const standing = computeStanding(
    votes.map((vote) => ({
      firstPostAt: vote.firstPostAt,
      latestVisiblePostAt: vote.latestVisiblePostAt,
    })),
    Date.now(),
  );
  const allTimeMakers = votes.length;

  if (spot.listingStatus !== "listed") {
    await ctx.db.patch(spotId, { allTimeMakers });
    return;
  }

  if (standing === null) {
    await ctx.db.patch(spotId, {
      boardScore: undefined,
      latestBragAt: undefined,
      windowExpiresAt: undefined,
      allTimeMakers,
    });
    return;
  }

  await ctx.db.patch(spotId, {
    boardScore: standing.score,
    latestBragAt: standing.latestBragAt,
    windowExpiresAt: standing.windowExpiresAt,
    allTimeMakers,
  });
}

export async function applyVisiblePosts(
  ctx: MutationCtx,
  input: { spotId: Id<"spots">; makerKey: string },
): Promise<void> {
  const existing = await ctx.db
    .query("makerVotes")
    .withIndex("by_spot_maker", (q) =>
      q.eq("spotId", input.spotId).eq("makerKey", input.makerKey),
    )
    .unique();

  const posts = await ctx.db
    .query("posts")
    .withIndex("by_maker_spot", (q) =>
      q.eq("makerKey", input.makerKey).eq("spotId", input.spotId),
    )
    .collect();

  const desired = desiredVote(
    posts
      .filter((post) => post.visibility.kind === "visible")
      .map((post) => post.createdAt),
  );
  const current: VoteStanding | null = existing
    ? {
        firstPostAt: existing.firstPostAt,
        latestVisiblePostAt: existing.latestVisiblePostAt,
      }
    : null;
  const result = reconcileVote(current, desired);

  if (result.outcome === "granted") {
    await ctx.db.insert("makerVotes", {
      spotId: input.spotId,
      makerKey: input.makerKey,
      firstPostAt: result.standing.firstPostAt,
      latestVisiblePostAt: result.standing.latestVisiblePostAt,
    });
  } else if (result.outcome === "kept" && existing) {
    await ctx.db.patch(existing._id, {
      firstPostAt: result.standing.firstPostAt,
      latestVisiblePostAt: result.standing.latestVisiblePostAt,
    });
  } else if (result.outcome === "retracted" && existing) {
    await ctx.db.delete(existing._id);
  }

  await refreshSpotStanding(ctx, input.spotId);
}

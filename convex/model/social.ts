import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { parseMakerKey, serializeMakerKey } from "../../domain/makerKey";
import type { SocialEmbed } from "../../domain/post";
import {
  isInstagramPermalink,
  planCaptionMatch,
  planMakerMatchConfirm,
  planSocialIngest,
} from "../../domain/social";
import { applyVisiblePosts } from "./votes";

export async function ingestSocial(
  ctx: MutationCtx,
  input: {
    caption: string;
    locationPlaceId: string | null;
    embed: SocialEmbed;
    makerKey: string;
    createdAt?: number;
  },
): Promise<void> {
  const makerKey = serializeMakerKey(parseMakerKey(input.makerKey));
  const existing = await ctx.db
    .query("posts")
    .withIndex("by_platform_media", (q) =>
      q.eq("body.embed.platformMediaId", input.embed.platformMediaId),
    )
    .unique();
  const existingMediaId =
    existing?.body.kind === "social"
      ? existing.body.embed.platformMediaId
      : null;
  const plan = planSocialIngest(input, existingMediaId);
  if (plan.action === "skip") {
    return;
  }
  if (!isInstagramPermalink(input.embed.permalink)) {
    throw new ConvexError("Invalid Instagram permalink");
  }
  if (plan.action === "attach") {
    const spot = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) => q.eq("placeId", plan.placeId))
      .unique();
    if (!spot) {
      throw new ConvexError("Spot not found");
    }
    await insertVisibleSocial(ctx, {
      spotId: spot._id,
      makerKey,
      embed: input.embed,
      createdAt: input.createdAt,
    });
    return;
  }

  const queued = await ctx.db.query("aiMatchQueue").collect();
  if (
    queued.some(
      (row) => row.embed.platformMediaId === input.embed.platformMediaId,
    )
  ) {
    return;
  }

  const listed = (await ctx.db.query("spots").collect()).filter(
    (spot) => spot.listingStatus === "listed",
  );
  const match = planCaptionMatch(
    plan.caption,
    listed.map((spot) => ({ name: spot.name, _id: spot._id })),
  );
  await ctx.db.insert("aiMatchQueue", {
    embed: input.embed,
    makerKey,
    caption: plan.caption,
    proposedSpotId: match?._id ?? null,
    status: "pending",
  });
}

export async function approveMatch(
  ctx: MutationCtx,
  queueId: Id<"aiMatchQueue">,
): Promise<void> {
  const row = await ctx.db.get(queueId);
  if (!row) {
    throw new ConvexError("Match not found");
  }
  if (row.status === "approved") {
    return;
  }
  if (row.status !== "pending") {
    throw new ConvexError("Match is not pending");
  }
  if (!row.proposedSpotId) {
    throw new ConvexError("Proposed spot missing");
  }
  const spot = await ctx.db.get(row.proposedSpotId);
  if (!spot) {
    throw new ConvexError("Spot not found");
  }
  if (!isInstagramPermalink(row.embed.permalink)) {
    throw new ConvexError("Invalid Instagram permalink");
  }
  await insertVisibleSocial(ctx, {
    spotId: spot._id,
    makerKey: row.makerKey,
    embed: row.embed,
  });
  await ctx.db.patch(queueId, { status: "approved" });
}

export async function rejectMatch(
  ctx: MutationCtx,
  queueId: Id<"aiMatchQueue">,
): Promise<void> {
  const row = await ctx.db.get(queueId);
  if (!row) {
    throw new ConvexError("Match not found");
  }
  if (row.status === "rejected") {
    return;
  }
  if (row.status !== "pending") {
    throw new ConvexError("Match is not pending");
  }
  await ctx.db.patch(queueId, { status: "rejected" });
}

export async function confirmMakerMatch(
  ctx: MutationCtx,
  input: {
    queueId: Id<"aiMatchQueue">;
    spotId: Id<"spots">;
    userId: Id<"users">;
  },
): Promise<{ action: "attach" | "already"; spotName: string; path: string }> {
  const row = await ctx.db.get(input.queueId);
  if (!row) {
    throw new ConvexError("Match not found");
  }
  const spot = await ctx.db.get(input.spotId);
  if (!spot) {
    throw new ConvexError("Spot not found");
  }
  const makerKey = serializeMakerKey({ kind: "user", userId: input.userId });
  const existing = await ctx.db
    .query("posts")
    .withIndex("by_platform_media", (q) =>
      q.eq("body.embed.platformMediaId", row.embed.platformMediaId),
    )
    .unique();
  const plan = planMakerMatchConfirm({
    queueStatus: row.status,
    queueMakerKey: row.makerKey,
    userMakerKey: makerKey,
    listingStatus: spot.listingStatus,
    existingSpotId: existing?.spotId ?? null,
    targetSpotId: input.spotId,
  });
  if (!plan.ok) {
    throw new ConvexError(
      plan.reason === "not-owner"
        ? "Not your post"
        : plan.reason === "closed"
          ? "Closed spots cannot take brags"
          : plan.reason === "duplicate"
            ? "This Instagram post is already on another spot"
            : "Match is not pending",
    );
  }
  if (!isInstagramPermalink(row.embed.permalink)) {
    throw new ConvexError("Invalid Instagram permalink");
  }
  if (plan.action === "attach") {
    await insertVisibleSocial(ctx, {
      spotId: spot._id,
      makerKey,
      embed: row.embed,
    });
  }
  await ctx.db.patch(input.queueId, { status: "approved" });
  return {
    action: plan.action,
    spotName: spot.name,
    path: `/nl/${spot.citySlug}/${spot.slug}`,
  };
}

async function insertVisibleSocial(
  ctx: MutationCtx,
  input: {
    spotId: Id<"spots">;
    makerKey: string;
    embed: SocialEmbed;
    createdAt?: number;
  },
): Promise<void> {
  await ctx.db.insert("posts", {
    spotId: input.spotId,
    makerKey: input.makerKey,
    createdAt: input.createdAt ?? Date.now(),
    visibility: { kind: "visible" },
    body: { kind: "social", embed: input.embed },
  });
  await applyVisiblePosts(ctx, {
    spotId: input.spotId,
    makerKey: input.makerKey,
  });
}
